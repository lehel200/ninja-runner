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

// Belső felbontás 1920×1080: a játékvilágot zoom-2 kamera nagyítja (pixel art),
// a feliratok natív felbontáson, élesen renderelődnek.
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1920,
  height: 1080,
  backgroundColor: '#181030',
  render: {
    antialias: true,
    roundPixels: true
  },
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
  scene: [BootScene, MenuScene, GameScene, UIScene, SkillChoiceScene, LeaderboardScene, GameOverScene]
};

window.game = new Phaser.Game(config);
