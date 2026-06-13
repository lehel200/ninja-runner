// Címképernyő: rekord, indítás, gombátállító menü. Natív 1920×1080, éles szöveg.
class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.view = 'main'; // 'main' | 'controls' | 'avatar'
    this.add.tileSprite(0, 0, 1920, 1080, 'bg_far').setOrigin(0).setTileScale(4);
    this.add.tileSprite(0, 0, 1920, 1080, 'bg_mid').setOrigin(0).setTileScale(4);
    this.add.tileSprite(0, 0, 1920, 1080, 'bg_near').setOrigin(0).setTileScale(4);

    this.controlsGroup = this.add.container(0, 0).setVisible(false);
    this.authGroup = this.add.container(0, 0);
    this.podiumGroup = this.add.container(0, 0);
    this.avatarGroup = this.add.container(0, 0).setVisible(false);

    this.buildMain();
    this.buildControls();
    this.buildAuth();
    this.buildPodium();

    // auth állapotváltozásra (login redirect után is) frissül a UI
    Supa.onChange = () => {
      if (this.scene.isActive('Menu')) {
        this.buildAuth();
        this.buildPodium();
      }
    };

    this.input.on('pointerdown', () => SFX.ensure());

    // a controls/avatar panel a dobogó fölé kerüljön
    this.children.bringToTop(this.controlsGroup);
    this.children.bringToTop(this.avatarGroup);
  }

  // ----- bejelentkezés sáv (jobb felső sarok) -----
  buildAuth() {
    this.authGroup.removeAll(true);
    const g = this.authGroup;

    if (Supa.isLoggedIn() && Supa.profile) {
      const p = Supa.profile;
      const av = this.add.image(1500, 60, 'avatar_0').setDisplaySize(64, 64);
      Avatars.ensure(this, { ...p, user_id: p.id }, (key) => {
        if (av.active) av.setTexture(key).setDisplaySize(64, 64);
      });
      g.add(av);
      g.add(this.add.text(1545, 60, p.display_name.slice(0, 16), {
        fontFamily: 'monospace', fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0, 0.5));

      const avBtn = this.add.text(1545, 105, 'Avatár', {
        fontFamily: 'monospace', fontSize: '20px', color: '#90caf9',
        backgroundColor: '#1d2335', padding: { x: 10, y: 4 }
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      avBtn.on('pointerdown', () => this.showAvatarPicker());
      g.add(avBtn);

      const outBtn = this.add.text(1660, 105, 'Kijelentkezés', {
        fontFamily: 'monospace', fontSize: '20px', color: '#b9aed4',
        backgroundColor: '#1d2335', padding: { x: 10, y: 4 }
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      outBtn.on('pointerdown', () => Supa.signOut());
      g.add(outBtn);
    } else {
      const btn = this.add.text(1880, 60, '🔑 Google bejelentkezés', {
        fontFamily: 'monospace', fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: '#1d2335', padding: { x: 18, y: 10 }
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setBackgroundColor('#2a3350'));
      btn.on('pointerout', () => btn.setBackgroundColor('#1d2335'));
      btn.on('pointerdown', () => Supa.signIn());
      this.authGroup.add(btn);
    }
  }

  // ----- dobogó: top 3 gyors nézet -----
  buildPodium() {
    this.podiumGroup.removeAll(true);
    const g = this.podiumGroup;
    const cx = 1560, baseY = 760;

    g.add(this.add.text(cx, 400, '🏆 RANGLISTA', {
      fontFamily: 'monospace', fontSize: '36px', color: '#ffd54f', fontStyle: 'bold'
    }).setOrigin(0.5));

    Supa.fetchTop(3).then(rows => {
      if (!this.scene.isActive('Menu') || this.podiumGroup !== g) return;

      if (!rows.length) {
        g.add(this.add.text(cx, 600, 'Még üres a ranglista —\nlégy te az első!', {
          fontFamily: 'monospace', fontSize: '26px', color: '#b9aed4', align: 'center'
        }).setOrigin(0.5));
        return;
      }

      // oszlopok: középen az 1., balra a 2., jobbra a 3.
      const slots = [
        { rank: 1, x: cx, h: 170, color: 0xffd54f },
        { rank: 2, x: cx - 175, h: 115, color: 0xcfd8dc },
        { rank: 3, x: cx + 175, h: 80, color: 0xcd7f32 }
      ];
      slots.forEach(slot => {
        const row = rows[slot.rank - 1];
        if (!row) return;
        const colTop = baseY - slot.h;
        g.add(this.add.rectangle(slot.x, baseY, 150, slot.h, 0x1d2335)
          .setOrigin(0.5, 1).setStrokeStyle(4, slot.color));
        g.add(this.add.text(slot.x, baseY - slot.h / 2, String(slot.rank), {
          fontFamily: 'monospace', fontSize: '52px', fontStyle: 'bold',
          color: '#' + slot.color.toString(16).padStart(6, '0')
        }).setOrigin(0.5));

        const av = this.add.image(slot.x, colTop - 88, 'avatar_0').setDisplaySize(72, 72);
        Avatars.ensure(this, row, (key) => {
          if (av.active) av.setTexture(key).setDisplaySize(72, 72);
        });
        g.add(av);
        g.add(this.add.text(slot.x, colTop - 38, row.display_name.slice(0, 10), {
          fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5));
        g.add(this.add.text(slot.x, colTop - 12, `⚔ ${row.kills}`, {
          fontFamily: 'monospace', fontSize: '22px', color: '#e8e2f5'
        }).setOrigin(0.5));
      });

      g.add(this.add.text(cx, baseY + 36, 'Kattints a teljes listáért', {
        fontFamily: 'monospace', fontSize: '20px', color: '#b9aed4'
      }).setOrigin(0.5));

      // kattintható zóna az egész dobogón
      const zone = this.add.zone(cx, 600, 560, 440).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.openLeaderboard());
      g.add(zone);
    });
  }

  openLeaderboard() {
    this.scene.pause();
    this.scene.launch('Leaderboard');
  }

  // ----- avatár-választó panel -----
  buildAvatarPicker() {
    this.avatarGroup.removeAll(true);
    const g = this.avatarGroup;
    const p = Supa.profile;

    g.add(this.add.rectangle(960, 540, 1200, 760, 0x10131f, 0.95)
      .setStrokeStyle(6, 0x90caf9));
    g.add(this.add.text(960, 240, 'AVATÁR VÁLASZTÁS', {
      fontFamily: 'monospace', fontSize: '56px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5));

    const select = (type, idx) => {
      Supa.setAvatar(type, idx).then(() => {
        this.hideAvatarPicker();
        this.buildAuth();
        this.buildPodium();
      });
    };

    // Google kép opció
    if (p && p.google_avatar_url) {
      const gx = 960, gy = 360;
      const av = this.add.image(gx, gy, 'avatar_0').setDisplaySize(96, 96)
        .setInteractive({ useHandCursor: true });
      Avatars.ensure(this, { ...p, avatar_type: 'google', user_id: p.id }, (key) => {
        if (av.active) av.setTexture(key).setDisplaySize(96, 96);
      });
      av.on('pointerdown', () => select('google', p.pixel_avatar));
      g.add(av);
      g.add(this.add.text(gx, gy + 70, 'Google profilkép', {
        fontFamily: 'monospace', fontSize: '22px', color: '#b9aed4'
      }).setOrigin(0.5));
    }

    // 10 pixel-ninja, 5×2 rács
    for (let i = 0; i < 10; i++) {
      const x = 960 - 2 * 150 + (i % 5) * 150;
      const y = 540 + Math.floor(i / 5) * 160;
      const av = this.add.image(x, y, `avatar_${i}`).setDisplaySize(96, 96)
        .setInteractive({ useHandCursor: true });
      av.on('pointerover', () => av.setDisplaySize(110, 110));
      av.on('pointerout', () => av.setDisplaySize(96, 96));
      av.on('pointerdown', () => select('pixel', i));
      g.add(av);
    }

    const back = this.add.text(960, 850, '← VISSZA (ESC)', {
      fontFamily: 'monospace', fontSize: '32px', color: '#b9aed4',
      backgroundColor: '#1d2335', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.hideAvatarPicker());
    g.add(back);
  }

  showAvatarPicker() {
    this.view = 'avatar';
    this.buildAvatarPicker();
    this.avatarGroup.setVisible(true);
    this.children.bringToTop(this.avatarGroup);
  }

  hideAvatarPicker() {
    this.view = 'main';
    this.avatarGroup.setVisible(false);
  }

  buildMain() {
    const title = this.add.text(960, 260, 'NINJA RUNNER', {
      fontFamily: 'monospace', fontSize: '128px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#c63f37', strokeThickness: 16
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 280, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const record = parseInt(localStorage.getItem('ninja_record_kills') || '0', 10);
    const recStr = record > 0
      ? `REKORD: ${record} szörny`
      : 'Még nincs rekord — kaszabolj!';
    this.add.text(960, 430, recStr, {
      fontFamily: 'monospace', fontSize: '48px', color: '#ffd54f', fontStyle: 'bold'
    }).setOrigin(0.5).setName('record');

    // ninja a címképernyőn
    const ninja = this.add.image(960, 600, 'ninja_run_0').setScale(10);
    this.time.addEvent({
      delay: 80, loop: true,
      callback: () => {
        this.runFrame = ((this.runFrame || 0) + 1) % 6;
        ninja.setTexture(`ninja_run_${this.runFrame}`);
      }
    });

    this.makeButton(960, 780, '▶  JÁTÉK INDÍTÁSA  (ENTER)', () => this.startGame());
    this.makeButton(960, 890, '⌨  IRÁNYÍTÁS BEÁLLÍTÁSA  (C)', () => this.showControls());

    this.add.text(960, 1010,
      `${Keybinds.labelsFor('left')}/${Keybinds.labelsFor('right')} mozgás · ${Keybinds.labelsFor('jump')} ugrás · ${Keybinds.labelsFor('attack')} kard · falon csúszva ugorhatsz!`,
      { fontFamily: 'monospace', fontSize: '28px', color: '#b9aed4' }
    ).setOrigin(0.5).setName('hints');
  }

  buildControls() {
    this.controlsGroup.removeAll(true);
    const g = this.controlsGroup;

    g.add(this.add.rectangle(960, 540, 1120, 880, 0x10131f, 0.92)
      .setStrokeStyle(6, 0xc63f37));
    g.add(this.add.text(960, 180, 'IRÁNYÍTÁS', {
      fontFamily: 'monospace', fontSize: '68px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5));
    g.add(this.add.text(960, 256, 'Kattints egy sorra, majd nyomd meg az új gombot', {
      fontFamily: 'monospace', fontSize: '30px', color: '#b9aed4'
    }).setOrigin(0.5));

    const actions = Object.keys(Keybinds.defaults);
    actions.forEach((action, i) => {
      const y = 350 + i * 88;
      const row = this.add.text(960, y,
        `${Keybinds.actionNames[action].padEnd(8)}  ${Keybinds.labelsFor(action)}`, {
          fontFamily: 'monospace', fontSize: '44px', color: '#e8e2f5',
          backgroundColor: '#1d2335', padding: { x: 32, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      row.on('pointerover', () => row.setColor('#ffd54f'));
      row.on('pointerout', () => row.setColor('#e8e2f5'));
      row.on('pointerdown', () => {
        SFX.ensure();
        row.setText(`${Keybinds.actionNames[action].padEnd(8)}  [nyomj egy gombot...]`);
        row.setColor('#7CFC8a');
        Keys.captureNext((code) => {
          if (code !== 'Escape') Keybinds.set(action, code);
          this.buildControls();   // teljes lista frissítés (ütközés-feloldás miatt)
          this.refreshHints();
        });
      });
      g.add(row);
    });

    const resetBtn = this.add.text(960, 890, '↺ ALAPHELYZET (R)', {
      fontFamily: 'monospace', fontSize: '36px', color: '#ff8a80',
      backgroundColor: '#1d2335', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => { Keybinds.reset(); this.buildControls(); this.refreshHints(); });
    g.add(resetBtn);

    const backBtn = this.add.text(960, 980, '← VISSZA (ESC)', {
      fontFamily: 'monospace', fontSize: '36px', color: '#b9aed4',
      backgroundColor: '#1d2335', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.showMain());
    g.add(backBtn);
  }

  refreshHints() {
    const hints = this.children.getByName('hints');
    if (hints) {
      hints.setText(`${Keybinds.labelsFor('left')}/${Keybinds.labelsFor('right')} mozgás · ${Keybinds.labelsFor('jump')} ugrás · ${Keybinds.labelsFor('attack')} kard · falon csúszva ugorhatsz!`);
    }
  }

  makeButton(x, y, label, onClick) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '48px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#c63f37', padding: { x: 40, y: 20 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setBackgroundColor('#e05548'));
    btn.on('pointerout', () => btn.setBackgroundColor('#c63f37'));
    btn.on('pointerdown', () => { SFX.ensure(); onClick(); });
    return btn;
  }

  showControls() {
    this.view = 'controls';
    this.controlsGroup.setVisible(true);
  }

  showMain() {
    this.view = 'main';
    Keys.cancelCapture();
    this.controlsGroup.setVisible(false);
  }

  startGame() {
    SFX.ensure();
    this.scene.start('Game');
  }

  fmt(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
  }

  update() {
    if (this.view === 'main') {
      if (Keys.codePressed('Enter')) this.startGame();
      if (Keys.codePressed('KeyC')) this.showControls();
    } else if (this.view === 'avatar') {
      if (Keys.codePressed('Escape')) this.hideAvatarPicker();
    } else {
      if (Keys.codePressed('Escape')) this.showMain();
      if (Keys.codePressed('KeyR') && !Keys.captureCb) {
        Keybinds.reset(); this.buildControls(); this.refreshHints();
      }
    }
    Keys.endFrame();
  }
}
