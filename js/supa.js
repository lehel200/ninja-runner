// Supabase kapcsolat: Google auth, profil, leaderboard.
const Supa = {
  URL: 'https://tjvudzhmqilsfpyeipjw.supabase.co',
  KEY: 'sb_publishable_QSiRgNjUSQBNaIkkShkEeQ_Ngxgchlo',

  client: null,
  user: null,       // auth user (vagy null = vendég)
  profile: null,    // profiles sor
  onChange: null,   // UI callback auth/profil változáskor

  init() {
    if (!window.supabase) {
      console.warn('supabase-js nem töltődött be — offline mód');
      return;
    }
    this.client = window.supabase.createClient(this.URL, this.KEY);
    this.client.auth.onAuthStateChange((event, session) => {
      this.user = session ? session.user : null;
      if (this.user) {
        this.loadProfile().then(() => this.onChange && this.onChange());
      } else {
        this.profile = null;
        this.onChange && this.onChange();
      }
    });
  },

  isLoggedIn() {
    return !!this.user;
  },

  async signIn() {
    if (!this.client) return;
    await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname }
    });
  },

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
  },

  async loadProfile() {
    if (!this.client || !this.user) return null;
    const { data, error } = await this.client
      .from('profiles').select('*').eq('id', this.user.id).single();
    if (error) {
      console.warn('profil betöltés hiba:', error.message);
      return null;
    }
    this.profile = data;
    return data;
  },

  async setAvatar(type, pixelIdx = 0) {
    if (!this.client || !this.user) return;
    const { error } = await this.client
      .from('profiles')
      .update({ avatar_type: type, pixel_avatar: pixelIdx })
      .eq('id', this.user.id);
    if (!error && this.profile) {
      this.profile.avatar_type = type;
      this.profile.pixel_avatar = pixelIdx;
    }
  },

  // Csak akkor ír, ha jobb a mostani eredmény (kill, döntetlennél idő).
  async submitScore(kills, survivalTime) {
    if (!this.client || !this.user || kills <= 0) return;
    try {
      const { data } = await this.client
        .from('scores').select('kills, survival_time').eq('user_id', this.user.id).maybeSingle();
      if (data && (data.kills > kills ||
          (data.kills === kills && data.survival_time >= survivalTime))) {
        return; // a régi jobb
      }
      await this.client.from('scores').upsert({
        user_id: this.user.id,
        kills,
        survival_time: survivalTime,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('score beküldés hiba:', e);
    }
  },

  async fetchBoard(limit = 100) {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('leaderboard').select('*').limit(limit);
    if (error) {
      console.warn('leaderboard hiba:', error.message);
      return [];
    }
    return data || [];
  },

  fetchTop(n = 3) {
    return this.fetchBoard(n);
  },

  // Hányadik hely lenne ennyi kill (1-alapú).
  async rankOf(kills) {
    if (!this.client) return null;
    const { count, error } = await this.client
      .from('scores').select('*', { count: 'exact', head: true })
      .gt('kills', kills);
    if (error) return null;
    return (count || 0) + 1;
  }
};

Supa.init();

// Avatár textúra-kulcs feloldás (Google kép aszinkron betöltéssel, pixel fallback).
const Avatars = {
  ensure(scene, p, cb) {
    const pixelKey = `avatar_${p.pixel_avatar || 0}`;
    const url = p.google_avatar_url;
    if (p.avatar_type === 'pixel' || !url) {
      cb(pixelKey);
      return;
    }
    const key = `gav_${p.user_id || p.id}`;
    if (scene.textures.exists(key)) {
      cb(key);
      return;
    }
    scene.load.crossOrigin = 'anonymous';
    scene.load.image(key, url);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      cb(scene.textures.exists(key) ? key : pixelKey);
    });
    scene.load.start();
  }
};
