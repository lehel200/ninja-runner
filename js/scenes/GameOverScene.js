// Halál képernyő: eredmény, rekord, újraindítás. Natív 1920×1080, éles szöveg.
class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.result = data;
  }

  create() {
    this.add.tileSprite(0, 0, 1920, 1080, 'bg_far').setOrigin(0).setTileScale(4);
    this.add.rectangle(960, 540, 1920, 1080, 0x0d0a1a, 0.7);

    this.add.text(960, 240, 'ELESTÉL', {
      fontFamily: 'monospace', fontSize: '116px', color: '#e53935', fontStyle: 'bold',
      stroke: '#10131f', strokeThickness: 16
    }).setOrigin(0.5);

    const { time, kills, record, newRecord } = this.result;

    this.add.text(960, 430, `Levágott szörnyek:  ${kills}`, {
      fontFamily: 'monospace', fontSize: '56px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(960, 520, `Túlélt idő:  ${this.fmt(time)}`, {
      fontFamily: 'monospace', fontSize: '44px', color: '#b9aed4'
    }).setOrigin(0.5);

    const recText = this.add.text(960, 630,
      newRecord ? `★ ÚJ REKORD: ${record} szörny ★` : `Rekord: ${record} szörny`, {
        fontFamily: 'monospace', fontSize: newRecord ? '60px' : '48px',
        color: '#ffd54f', fontStyle: 'bold'
      }).setOrigin(0.5);
    if (newRecord) {
      this.tweens.add({ targets: recText, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }

    // világranglista helyezés / login hint
    if (Supa.isLoggedIn()) {
      const rankText = this.add.text(960, 700, 'Világranglista: …', {
        fontFamily: 'monospace', fontSize: '34px', color: '#90caf9', fontStyle: 'bold'
      }).setOrigin(0.5);
      Supa.rankOf(kills).then(rank => {
        if (rankText.active && rank) rankText.setText(`Világranglista: #${rank}`);
      });
    } else {
      this.add.text(960, 700, 'Jelentkezz be a menüben, hogy felkerülj a ranglistára!', {
        fontFamily: 'monospace', fontSize: '26px', color: '#b9aed4'
      }).setOrigin(0.5);
    }

    const retry = this.add.text(960, 800, '↻  ÚJRA  (ENTER)', {
      fontFamily: 'monospace', fontSize: '52px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#c63f37', padding: { x: 40, y: 20 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setBackgroundColor('#e05548'));
    retry.on('pointerout', () => retry.setBackgroundColor('#c63f37'));
    retry.on('pointerdown', () => this.scene.start('Game'));

    const menu = this.add.text(960, 920, 'FŐMENÜ  (M)', {
      fontFamily: 'monospace', fontSize: '36px', color: '#b9aed4',
      backgroundColor: '#1d2335', padding: { x: 28, y: 16 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('Menu'));
  }

  fmt(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
  }

  update() {
    if (Keys.codePressed('Enter')) this.scene.start('Game');
    if (Keys.codePressed('KeyM')) this.scene.start('Menu');
    Keys.endFrame();
  }
}
