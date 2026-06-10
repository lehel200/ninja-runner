// Játékmenet: pálya, játékos, szörnyek, harc, HUD.
class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.elapsed = 0;
    this.kills = 0;
    this.dead = false;
    this.record = parseFloat(localStorage.getItem('ninja_record_time') || '0');
    this.recordBeaten = false;

    // parallax háttér
    this.bgFar = this.add.tileSprite(0, 0, 960, 540, 'bg_far')
      .setOrigin(0).setScrollFactor(0).setTileScale(2).setDepth(0);
    this.bgMid = this.add.tileSprite(0, 0, 960, 540, 'bg_mid')
      .setOrigin(0).setScrollFactor(0).setTileScale(2).setDepth(1);
    this.bgNear = this.add.tileSprite(0, 0, 960, 540, 'bg_near')
      .setOrigin(0).setScrollFactor(0).setTileScale(2).setDepth(2);

    // világ
    this.gen = new ChunkGenerator(this);
    this.gen.update();

    this.groundEnemies = this.physics.add.group();
    this.airEnemies = this.physics.add.group();
    this.shurikens = this.physics.add.group({ allowGravity: false });
    this.pickups = this.physics.add.group();

    Player.createAnims(this);
    Enemy.createAnims(this);
    this.player = new Player(this, 120, 380);

    // ütközések
    this.physics.add.collider(this.player, this.gen.tiles);
    this.physics.add.collider(this.groundEnemies, this.gen.tiles);
    this.physics.add.collider(this.pickups, this.gen.tiles);

    this.physics.add.overlap(this.player, this.groundEnemies, (p, e) => this.enemyTouch(e));
    this.physics.add.overlap(this.player, this.airEnemies, (p, e) => this.enemyTouch(e));
    this.physics.add.overlap(this.player, this.shurikens, (p, s) => {
      if (!this.dead && this.player.invulnTimer <= 0) {
        s.destroy();
        this.player.takeDamage(8, s.x);
      }
    });
    this.physics.add.overlap(this.player, this.pickups, (p, h) => {
      h.destroy();
      this.player.heal(20);
      SFX.pickup();
      this.floatText(this.player.x, this.player.y - 40, '+20', '#7CFC8a');
    });

    this.spawner = new Spawner(this);

    // kamera
    const cam = this.cameras.main;
    cam.setBounds(-200, -260, 1e9, 1060);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setFollowOffset(-140, 40);

    // részecske emitterek
    this.dustEmitter = this.add.particles(0, 0, 'px', {
      speed: { min: 30, max: 90 },
      angle: { min: 200, max: 340 },
      scale: { start: 1.6, end: 0 },
      lifespan: 350,
      tint: 0xcbb89d,
      emitting: false
    }).setDepth(9);

    this.bloodEmitter = this.add.particles(0, 0, 'px', {
      speed: { min: 60, max: 220 },
      scale: { start: 2, end: 0 },
      lifespan: 450,
      gravityY: 600,
      emitting: false
    }).setDepth(9);

    this.createHUD();
  }

  // ----- effektek -----
  dust(x, y, count) {
    this.dustEmitter.explode(count, x, y);
  }

  slashEffect(player) {
    const arc = this.add.image(player.x + player.facing * 44, player.y - 2, 'slash_arc')
      .setScale(2.4).setDepth(11).setFlipX(player.facing === -1).setAlpha(0.9);
    this.tweens.add({
      targets: arc, alpha: 0, scaleX: 3.2, scaleY: 3.2,
      duration: 160, onComplete: () => arc.destroy()
    });
  }

  hitStop() {
    this.physics.world.timeScale = 6;
    this.time.delayedCall(70, () => { this.physics.world.timeScale = 1; });
  }

  floatText(x, y, str, color) {
    const t = this.add.text(x, y, str, {
      fontFamily: 'monospace', fontSize: '18px', color, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: t, y: y - 40, alpha: 0, duration: 700,
      onComplete: () => t.destroy()
    });
  }

  // ----- harc -----
  enemyTouch(enemy) {
    if (this.dead || !enemy.active) return;
    this.player.takeDamage(enemy.dmg, enemy.x);
  }

  checkSwordHits() {
    if (this.player.attackTimer <= 0) return;
    const zone = this.player.attackZone;
    const swing = this.player.swingId;

    [this.groundEnemies, this.airEnemies].forEach(group => {
      this.physics.overlap(zone, group, (z, enemy) => {
        if (enemy.hitBySword(swing, this.player.x)) {
          this.killEnemy(enemy);
        } else {
          this.hitStop();
        }
      });
    });

    // shuriken levágható
    this.physics.overlap(zone, this.shurikens, (z, s) => {
      SFX.swordClang();
      this.bloodEmitter.setParticleTint(0xcfd8dc);
      this.bloodEmitter.explode(6, s.x, s.y);
      s.destroy();
    });
  }

  killEnemy(enemy) {
    this.kills++;
    SFX.enemyDie();
    this.hitStop();
    this.cameras.main.shake(80, 0.003);
    const tints = { walker: 0xc62828, flyer: 0x6a1b9a, hopper: 0x2e7d32, thrower: 0x455a64 };
    this.bloodEmitter.setParticleTint(tints[enemy.type] || 0xffffff);
    this.bloodEmitter.explode(14, enemy.x, enemy.y);

    // 12% eséllyel élet-pickup
    if (Math.random() < 0.12) {
      const heart = this.pickups.create(enemy.x, enemy.y - 10, 'heart');
      heart.setScale(2).setDepth(8);
      heart.setVelocity(Phaser.Math.Between(-60, 60), -250);
      heart.setBounce(0.4);
      this.tweens.add({
        targets: heart, alpha: 0.2, duration: 200,
        delay: 6000, repeat: 8, yoyo: true,
        onComplete: () => heart.destroy()
      });
    }
    enemy.destroy();
    this.killText.setText(`⚔ ${this.kills}`);
  }

  throwShuriken(thrower, player) {
    if (this.dead) return;
    const s = this.shurikens.create(thrower.x, thrower.y - 20, 'shuriken');
    s.setScale(2.5).setDepth(8);
    const angle = Phaser.Math.Angle.Between(thrower.x, thrower.y - 20, player.x, player.y);
    this.physics.velocityFromRotation(angle, 280, s.body.velocity);
    this.tweens.add({ targets: s, angle: 360, duration: 400, repeat: -1 });
    SFX.noise({ dur: 0.06, vol: 0.08, filter: 4000 });
  }

  // ----- HUD -----
  createHUD() {
    this.hpBarBg = this.add.rectangle(20, 20, 204, 22, 0x10131f)
      .setOrigin(0).setScrollFactor(0).setDepth(30).setStrokeStyle(2, 0x8899aa);
    this.hpBar = this.add.rectangle(22, 22, 200, 18, 0x43a047)
      .setOrigin(0).setScrollFactor(0).setDepth(31);

    const style = { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' };
    this.timeText = this.add.text(480, 18, '0:00.0', { ...style, fontSize: '26px' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(30);
    this.recordText = this.add.text(940, 18, `REKORD ${this.fmt(this.record)}`,
      { ...style, color: '#ffd54f' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(30);
    this.killText = this.add.text(20, 50, '⚔ 0', style)
      .setScrollFactor(0).setDepth(30);
  }

  fmt(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
  }

  updateHUD() {
    const ratio = this.player.hp / Player.MAX_HP;
    this.hpBar.width = 200 * ratio;
    this.hpBar.fillColor = ratio > 0.5 ? 0x43a047 : ratio > 0.25 ? 0xfb8c00 : 0xe53935;
    this.timeText.setText(this.fmt(this.elapsed));

    if (!this.recordBeaten && this.record > 0 && this.elapsed > this.record) {
      this.recordBeaten = true;
      SFX.newRecord();
      const t = this.add.text(480, 120, 'ÚJ REKORD!', {
        fontFamily: 'monospace', fontSize: '40px', color: '#ffd54f', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(40);
      this.tweens.add({
        targets: t, scale: 1.4, alpha: 0, duration: 1500,
        ease: 'Cubic.easeOut', onComplete: () => t.destroy()
      });
    }
    if (this.recordBeaten) {
      this.recordText.setText(`REKORD ${this.fmt(this.elapsed)}`);
    }
  }

  // ----- halál -----
  onPlayerDeath() {
    if (this.dead) return;
    this.dead = true;
    SFX.gameOver();
    this.cameras.main.shake(300, 0.01);

    const finalTime = this.elapsed;
    const newRecord = finalTime > this.record;
    if (newRecord) {
      localStorage.setItem('ninja_record_time', String(finalTime));
    }

    this.time.delayedCall(1200, () => {
      this.scene.start('GameOver', {
        time: finalTime,
        kills: this.kills,
        record: Math.max(this.record, finalTime),
        newRecord
      });
    });
  }

  // ----- fő ciklus -----
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    if (!this.dead) {
      this.elapsed += dt;
      this.player.update(dt);
      this.gen.update();
      this.spawner.update(dt, this.elapsed);
      this.checkSwordHits();

      // szörny AI + lemaradók törlése
      const cam = this.cameras.main;
      [this.groundEnemies, this.airEnemies].forEach(group => {
        [...group.getChildren()].forEach(e => {
          if (!e.active) return;
          e.updateAI(dt, this.player);
          if (e.x < cam.scrollX - 350 || e.y > 900) e.destroy();
        });
      });
      [...this.shurikens.getChildren()].forEach(s => {
        if (s.active && (s.x < cam.scrollX - 100 || s.x > cam.scrollX + 1100 || s.y > 900)) s.destroy();
      });

      // leesés a pályáról
      if (this.player.y > 820) {
        this.player.hp = 0;
        this.player.die();
      }

      this.updateHUD();
    }

    // parallax
    const sx = this.cameras.main.scrollX;
    this.bgFar.tilePositionX = sx * 0.08;
    this.bgMid.tilePositionX = sx * 0.22;
    this.bgNear.tilePositionX = sx * 0.45;

    Keys.endFrame();
  }
}
