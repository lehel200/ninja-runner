// Phaser konfiguráció + induló textúra-generálás.
class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    Textures.generateAll(this);
    this.scene.start('Menu');
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#181030',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1600 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

window.game = new Phaser.Game(config);
