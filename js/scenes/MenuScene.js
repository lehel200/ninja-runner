// Címképernyő: rekord, indítás, gombátállító menü. Natív 1920×1080, éles szöveg.
class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.view = 'main'; // 'main' | 'controls'
    this.add.tileSprite(0, 0, 1920, 1080, 'bg_far').setOrigin(0).setTileScale(4);
    this.add.tileSprite(0, 0, 1920, 1080, 'bg_mid').setOrigin(0).setTileScale(4);
    this.add.tileSprite(0, 0, 1920, 1080, 'bg_near').setOrigin(0).setTileScale(4);

    this.controlsGroup = this.add.container(0, 0).setVisible(false);

    this.buildMain();
    this.buildControls();

    this.input.on('pointerdown', () => SFX.ensure());
  }

  buildMain() {
    const title = this.add.text(960, 260, 'NINJA RUNNER', {
      fontFamily: 'monospace', fontSize: '128px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#c63f37', strokeThickness: 16
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 280, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const record = parseFloat(localStorage.getItem('ninja_record_time') || '0');
    const recStr = record > 0
      ? `REKORD: ${this.fmt(record)}`
      : 'Még nincs rekord — fuss!';
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
    } else {
      if (Keys.codePressed('Escape')) this.showMain();
      if (Keys.codePressed('KeyR') && !Keys.captureCb) {
        Keybinds.reset(); this.buildControls(); this.refreshHints();
      }
    }
    Keys.endFrame();
  }
}
