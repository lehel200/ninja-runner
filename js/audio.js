// Web Audio API-val generált hangeffektek — nincs külső fájl.
const SFX = {
  ctx: null,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  // Egyszerű oszcillátor hang frekvencia-csúszással.
  tone({ freq = 440, end = null, dur = 0.15, type = 'square', vol = 0.15, delay = 0 }) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (end !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(end, 1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  // Fehér zaj burst (suhintás, robbanás jelleg).
  noise({ dur = 0.15, vol = 0.2, filter = 3000, filterEnd = null, delay = 0 }) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(filter, t0);
    if (filterEnd !== null) flt.frequency.exponentialRampToValueAtTime(Math.max(filterEnd, 10), t0 + dur);
    flt.Q.value = 1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(flt).connect(gain).connect(ctx.destination);
    src.start(t0);
  },

  slash() {
    this.noise({ dur: 0.12, vol: 0.25, filter: 6000, filterEnd: 1200 });
  },

  jump() {
    this.tone({ freq: 320, end: 620, dur: 0.12, type: 'square', vol: 0.1 });
  },

  wallJump() {
    this.tone({ freq: 260, end: 700, dur: 0.14, type: 'square', vol: 0.1 });
    this.noise({ dur: 0.06, vol: 0.08, filter: 2500 });
  },

  hit() {
    this.tone({ freq: 180, end: 60, dur: 0.2, type: 'sawtooth', vol: 0.2 });
    this.noise({ dur: 0.1, vol: 0.15, filter: 800 });
  },

  enemyDie() {
    this.tone({ freq: 400, end: 80, dur: 0.22, type: 'square', vol: 0.12 });
    this.noise({ dur: 0.18, vol: 0.18, filter: 1500, filterEnd: 200 });
  },

  swordClang() {
    this.tone({ freq: 1400, end: 900, dur: 0.08, type: 'triangle', vol: 0.15 });
  },

  pickup() {
    this.tone({ freq: 660, dur: 0.08, type: 'square', vol: 0.1 });
    this.tone({ freq: 990, dur: 0.12, type: 'square', vol: 0.1, delay: 0.08 });
  },

  newRecord() {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.tone({ freq: f, dur: 0.12, type: 'square', vol: 0.1, delay: i * 0.09 }));
  },

  gameOver() {
    [392, 311, 262, 196].forEach((f, i) =>
      this.tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.14, delay: i * 0.22 }));
  }
};
