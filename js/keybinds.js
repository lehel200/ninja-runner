// Gombkiosztás kezelés: alapértelmezett bindek, localStorage mentés, remap.
const Keybinds = {
  STORAGE_KEY: 'ninja_keybinds_v1',

  defaults: {
    left:   ['ArrowLeft', 'KeyA'],
    right:  ['ArrowRight', 'KeyD'],
    up:     ['ArrowUp', 'KeyW'],
    down:   ['ArrowDown', 'KeyS'],
    jump:   ['Space'],
    attack: ['KeyX', 'KeyJ']
  },

  actionNames: {
    left: 'Balra',
    right: 'Jobbra',
    up: 'Fel',
    down: 'Le',
    jump: 'Ugrás',
    attack: 'Kard'
  },

  binds: null,

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.binds = {};
        for (const action of Object.keys(this.defaults)) {
          this.binds[action] = Array.isArray(saved[action]) && saved[action].length
            ? saved[action]
            : this.defaults[action].slice();
        }
        return;
      }
    } catch (e) { /* sérült mentés esetén default */ }
    this.reset();
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.binds));
  },

  reset() {
    this.binds = {};
    for (const action of Object.keys(this.defaults)) {
      this.binds[action] = this.defaults[action].slice();
    }
    this.save();
  },

  set(action, code) {
    // Ha másik akción van ez a gomb, onnan levesszük.
    for (const a of Object.keys(this.binds)) {
      this.binds[a] = this.binds[a].filter(c => c !== code);
      if (this.binds[a].length === 0) this.binds[a] = this.defaults[a].slice();
    }
    this.binds[action] = [code];
    this.save();
  },

  label(code) {
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Arrow')) {
      return { Left: '←', Right: '→', Up: '↑', Down: '↓' }[code.slice(5)] || code;
    }
    const map = {
      Space: 'SZÓKÖZ', ShiftLeft: 'BAL SHIFT', ShiftRight: 'JOBB SHIFT',
      ControlLeft: 'BAL CTRL', ControlRight: 'JOBB CTRL',
      AltLeft: 'BAL ALT', AltRight: 'JOBB ALT', Enter: 'ENTER',
      Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'"
    };
    return map[code] || code.toUpperCase();
  },

  labelsFor(action) {
    return this.binds[action].map(c => this.label(c)).join(' / ');
  }
};

// Nyers billentyű-állapot követés event.code alapján (remap-barát).
const Keys = {
  down: new Set(),
  pressed: new Set(),
  captureCb: null,

  init() {
    window.addEventListener('keydown', (e) => {
      if (this.captureCb) {
        e.preventDefault();
        const cb = this.captureCb;
        this.captureCb = null;
        cb(e.code);
        return;
      }
      if (!e.repeat) {
        this.down.add(e.code);
        this.pressed.add(e.code);
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  },

  isDown(action) {
    return Keybinds.binds[action].some(c => this.down.has(c));
  },

  justPressed(action) {
    return Keybinds.binds[action].some(c => this.pressed.has(c));
  },

  codePressed(code) {
    return this.pressed.has(code);
  },

  captureNext(cb) {
    this.captureCb = cb;
  },

  cancelCapture() {
    this.captureCb = null;
  },

  endFrame() {
    this.pressed.clear();
  }
};

Keybinds.load();
Keys.init();
