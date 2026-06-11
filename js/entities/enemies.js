// Szörnyek: 4 típus AI-val + spawn-igazgató (idő-alapú nehezedés).
const ENEMY_TYPES = {
  walker: {
    tex: 'oni', frames: 2, animRate: 6, hp: 1, dmg: 14, scale: 3,
    bodyW: 14, bodyH: 12, gravity: true, unlockAt: 0, weight: 10
  },
  flyer: {
    tex: 'bat', frames: 3, animRate: 10, hp: 1, dmg: 10, scale: 3,
    bodyW: 10, bodyH: 8, gravity: false, unlockAt: 20, weight: 7
  },
  hopper: {
    tex: 'frog', frames: 2, animRate: 4, hp: 2, dmg: 16, scale: 3,
    bodyW: 12, bodyH: 9, gravity: true, unlockAt: 45, weight: 6
  },
  thrower: {
    tex: 'thrower', frames: 2, animRate: 3, hp: 2, dmg: 12, scale: 3,
    bodyW: 8, bodyH: 16, gravity: true, unlockAt: 70, weight: 5
  }
};

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, speedScale) {
    const cfg = ENEMY_TYPES[type];
    super(scene, x, y, `${cfg.tex}_0`);
    this.type = type;
    this.cfg = cfg;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = cfg.hp;
    this.dmg = cfg.dmg;
    this.speedScale = speedScale;
    this.lastHitSwing = -1;
    this.aiTimer = Phaser.Math.FloatBetween(0.5, 1.5);
    this.wave = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.baseY = y;
    this.setScale(cfg.scale);
    this.setDepth(8);
    this.play(`e_${type}`, true);
  }

  setupBody() {
    this.body.setSize(this.cfg.bodyW, this.cfg.bodyH);
    this.body.setAllowGravity(this.cfg.gravity);
  }

  updateAI(dt, player) {
    if (!this.active) return;
    const toPlayer = Math.sign(player.x - this.x) || -1;
    const s = this.speedScale;

    switch (this.type) {
      case 'walker': {
        this.setVelocityX(toPlayer * 85 * s);
        this.setFlipX(toPlayer === 1);
        // akadálynál kis ugrás
        if (this.body.blocked.down && (this.body.blocked.left || this.body.blocked.right)) {
          this.setVelocityY(-420);
        }
        break;
      }
      case 'flyer': {
        this.wave += dt * 4.5;
        this.setVelocityX(toPlayer * 100 * s);
        this.setVelocityY(Math.cos(this.wave) * 130);
        this.setFlipX(toPlayer === 1);
        break;
      }
      case 'hopper': {
        if (this.body.blocked.down) {
          this.setVelocityX(0);
          this.aiTimer -= dt;
          this.setTexture('frog_0');
          this.anims.stop();
          if (this.aiTimer <= 0) {
            this.aiTimer = Phaser.Math.FloatBetween(0.9, 1.5) / s;
            this.setVelocity(toPlayer * 240 * s, -520);
            this.setTexture('frog_1');
          }
        } else {
          this.setTexture('frog_1');
        }
        this.setFlipX(toPlayer === 1);
        break;
      }
      case 'thrower': {
        const dist = Math.abs(player.x - this.x);
        if (dist > 320) {
          this.setVelocityX(toPlayer * 60 * s);
        } else {
          this.setVelocityX(0);
        }
        this.setFlipX(toPlayer === 1);
        this.aiTimer -= dt;
        if (this.aiTimer <= 0 && dist < 600) {
          this.aiTimer = Phaser.Math.FloatBetween(1.8, 2.6) / s;
          this.setTexture('thrower_1');
          this.scene.time.delayedCall(180, () => {
            if (this.active) {
              this.setTexture('thrower_0');
              this.scene.throwShuriken(this, player);
            }
          });
        }
        break;
      }
    }
  }

  // Kardcsapás találat. true ha meghalt.
  hitBySword(swingId, fromX) {
    if (this.lastHitSwing === swingId) return false;
    this.lastHitSwing = swingId;
    this.hp--;
    if (this.hp <= 0) {
      return true;
    }
    // visszalökés + villanás
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.active) this.clearTint(); });
    const dir = Math.sign(this.x - fromX) || 1;
    this.setVelocityX(dir * 300);
    if (this.cfg.gravity) this.setVelocityY(-200);
    return false;
  }

  static createAnims(scene) {
    const a = scene.anims;
    if (a.exists('e_walker')) return;
    a.create({ key: 'e_walker', frames: [{ key: 'oni_0' }, { key: 'oni_1' }], frameRate: 6, repeat: -1 });
    a.create({
      key: 'e_flyer',
      frames: [{ key: 'bat_0' }, { key: 'bat_1' }, { key: 'bat_2' }, { key: 'bat_1' }],
      frameRate: 12, repeat: -1
    });
    a.create({ key: 'e_hopper', frames: [{ key: 'frog_0' }], frameRate: 1 });
    a.create({ key: 'e_thrower', frames: [{ key: 'thrower_0' }], frameRate: 1 });
  }
}

// Spawn-igazgató: idővel sűrűbb, gyorsabb, többféle szörny.
class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.timer = 0.8;
  }

  update(dt, elapsed) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.spawn(elapsed);
      // spawn-ráta: 60/perc-ről indul, +20/perc percenként, plafon 200/perc
      const rate = Math.min(200, 60 + 20 * (elapsed / 60));
      this.timer = 60 / rate;
    }
  }

  spawn(elapsed) {
    const scene = this.scene;
    const cam = scene.cameras.main;
    const available = Object.entries(ENEMY_TYPES).filter(([, c]) => elapsed >= c.unlockAt);
    const total = available.reduce((s, [, c]) => s + c.weight, 0);
    let r = Math.random() * total;
    let type = available[0][0];
    for (const [t, c] of available) {
      r -= c.weight;
      if (r <= 0) { type = t; break; }
    }

    const speedScale = 1 + Math.min(elapsed / 120, 1.5) * 0.6;
    const x = cam.scrollX + cam.width + 60;
    const groundY = scene.gen.groundYAt(x);
    if (groundY === null) return; // szakadék fölé nem spawnolunk talajlényt

    let y;
    if (type === 'flyer') {
      y = groundY - Phaser.Math.Between(120, 220);
    } else {
      y = groundY - 40;
    }

    const enemy = new Enemy(scene, x, y, type, speedScale);
    if (ENEMY_TYPES[type].gravity) {
      scene.groundEnemies.add(enemy);
    } else {
      scene.airEnemies.add(enemy);
    }
    enemy.setupBody();
    if (type === 'flyer') enemy.baseY = y;
  }
}
