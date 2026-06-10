// Halál képernyő: eredmény, rekord, újraindítás.
class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.result = data;
  }

  create() {
    this.add.tileSprite(0, 0, 960, 540, 'bg_far').setOrigin(0).setTileScale(2);
    this.add.rectangle(480, 270, 960, 540, 0x0d0a1a, 0.7);

    this.add.text(480, 120, 'ELESTÉL', {
      fontFamily: 'monospace', fontSize: '58px', color: '#e53935', fontStyle: 'bold',
      stroke: '#10131f', strokeThickness: 8
    }).setOrigin(0.5);

    const { time, kills, record, newRecord } = this.result;

    this.add.text(480, 215, `Túlélt idő:  ${this.fmt(time)}`, {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(480, 260, `Levágott szörnyek:  ${kills}`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#b9aed4'
    }).setOrigin(0.5);

    const recText = this.add.text(480, 315,
      newRecord ? `★ ÚJ REKORD: ${this.fmt(record)} ★` : `Rekord: ${this.fmt(record)}`, {
        fontFamily: 'monospace', fontSize: newRecord ? '30px' : '24px',
        color: '#ffd54f', fontStyle: 'bold'
      }).setOrigin(0.5);
    if (newRecord) {
      this.tweens.add({ targets: recText, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }

    const retry = this.add.text(480, 400, '↻  ÚJRA  (ENTER)', {
      fontFamily: 'monospace', fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#c63f37', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setBackgroundColor('#e05548'));
    retry.on('pointerout', () => retry.setBackgroundColor('#c63f37'));
    retry.on('pointerdown', () => this.scene.start('Game'));

    const menu = this.add.text(480, 460, 'FŐMENÜ  (M)', {
      fontFamily: 'monospace', fontSize: '18px', color: '#b9aed4',
      backgroundColor: '#1d2335', padding: { x: 14, y: 8 }
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
