// Játékmenet: pálya, játékos, szörnyek, harc, HUD.
class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.elapsed = 0;
    this.kills = 0;
    this.dead = false;
    localStorage.removeItem('ninja_record_time');    // régi időrekord kivezetve
    this.record = parseInt(localStorage.getItem('ninja_record_kills') || '0', 10);
    this.skills = { speed: 0, range: 0, jump: 0, shield: 0 }; // kék szív skillek, max 3 szint
    this.blueCooldown = 0;                           // kék szív drop cooldown (mp)
    this.collapseX = -400;                           // omlás-front éle (világ x)

    // parallax háttér
    // világ-objektumként követik a kamerát (zoom-kompatibilis parallax)
    this.bgFar = this.add.tileSprite(0, 0, 960, 540, 'bg_far')
      .setOrigin(0).setTileScale(2).setDepth(0);
    this.bgMid = this.add.tileSprite(0, 0, 960, 540, 'bg_mid')
      .setOrigin(0).setTileScale(2).setDepth(1);
    this.bgNear = this.add.tileSprite(0, 0, 960, 540, 'bg_near')
      .setOrigin(0).setTileScale(2).setDepth(2);

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
      const isBlue = h.isBlue;
      h.destroy();
      SFX.pickup();
      if (isBlue) {
        // skill-választó: játék megáll, panel jön
        this.scene.pause();
        this.scene.launch('SkillChoice');
      } else {
        this.player.heal(20);
        this.floatText(this.player.x, this.player.y - 40, '+20', '#7CFC8a');
      }
    });

    this.spawner = new Spawner(this);

    // kamera: zoom 2 → a 960×540-es világ tölti ki az 1920×1080-as vásznat
    const cam = this.cameras.main;
    cam.setZoom(2);
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

    // omlás-front vizuál: sötét fal + gradiens + felszálló por
    this.collapseDark = this.add.rectangle(this.collapseX, 270, 2400, 1400, 0x0d0a1a)
      .setOrigin(1, 0.5).setDepth(12);
    this.collapseGrad = this.add.image(this.collapseX, 270, 'collapse_grad')
      .setOrigin(0, 0.5).setDepth(12);
    this.collapseGrad.setDisplaySize(160, 1400);
    this.collapseEmitter = this.add.particles(this.collapseX, 270, 'px', {
      speedY: { min: -140, max: -40 },
      speedX: { min: -30, max: 30 },
      scale: { start: 2.2, end: 0 },
      lifespan: { min: 400, max: 900 },
      tint: [0x3d2a54, 0x241a3e, 0x5b3a63],
      frequency: 25,
      quantity: 2,
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-12, -270, 24, 540) }
    }).setDepth(13);

    this.bloodEmitter = this.add.particles(0, 0, 'px', {
      speed: { min: 60, max: 220 },
      scale: { start: 2, end: 0 },
      lifespan: 450,
      gravityY: 600,
      emitting: false
    }).setDepth(9);

    // éles feliratok: HUD külön, natív felbontású jeleneten
    this.scene.launch('UI');
  }

  // ----- effektek -----
  dust(x, y, count) {
    this.dustEmitter.explode(count, x, y);
  }

  slashEffect(player) {
    const r = 1 + 0.2 * this.skills.range;
    const arc = this.add.image(player.x + player.facing * 44 * r, player.y - 2, 'slash_arc')
      .setScale(2.4 * r).setDepth(11).setFlipX(player.facing === -1).setAlpha(0.9);
    this.tweens.add({
      targets: arc, alpha: 0, scaleX: 3.2 * r, scaleY: 3.2 * r,
      duration: 160, onComplete: () => arc.destroy()
    });
  }

  hitStop() {
    this.physics.world.timeScale = 6;
    this.time.delayedCall(70, () => { this.physics.world.timeScale = 1; });
  }

  floatText(x, y, str, color) {
    const ui = this.scene.get('UI');
    if (ui && ui.scene.isActive()) ui.floatTextWorld(x, y, str, color);
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

    // kék szív (skill): 8% esély, 60s cooldown, csak ha van fejleszthető skill
    const hasUpgradable = Object.values(this.skills).some(lvl => lvl < 3);
    if (this.blueCooldown <= 0 && hasUpgradable && Math.random() < 0.08) {
      this.blueCooldown = 20;
      this.dropHeart(enemy.x, enemy.y, true);
    } else if (Math.random() < 0.12) {
      // 12% eséllyel élet-pickup
      this.dropHeart(enemy.x, enemy.y, false);
    }
    enemy.destroy();
  }

  dropHeart(x, y, isBlue) {
    const heart = this.pickups.create(x, y - 10, isBlue ? 'heart_blue' : 'heart');
    heart.isBlue = isBlue;
    heart.setScale(2).setDepth(8);
    heart.setVelocity(Phaser.Math.Between(-60, 60), -250);
    heart.setBounce(0.4);
    this.tweens.add({
      targets: heart, alpha: 0.2, duration: 200,
      delay: 6000, repeat: 8, yoyo: true,
      onComplete: () => heart.destroy()
    });
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

  // ----- halál -----
  onPlayerDeath() {
    if (this.dead) return;
    this.dead = true;
    SFX.gameOver();
    this.cameras.main.shake(300, 0.01);

    const finalTime = this.elapsed;
    const newRecord = this.kills > this.record;
    if (newRecord) {
      localStorage.setItem('ninja_record_kills', String(this.kills));
    }
    // online ranglista (csak bejelentkezve, fire-and-forget)
    Supa.submitScore(this.kills, finalTime);

    this.time.delayedCall(1200, () => {
      this.scene.stop('UI');
      this.scene.start('GameOver', {
        time: finalTime,
        kills: this.kills,
        record: Math.max(this.record, this.kills),
        newRecord
      });
    });
  }

  // ----- fő ciklus -----
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    if (!this.dead) {
      this.elapsed += dt;
      this.blueCooldown = Math.max(0, this.blueCooldown - dt);
      this.player.update(dt);
      this.gen.update();
      this.spawner.update(dt, this.elapsed);
      this.checkSwordHits();

      // omlás-front: 4 mp türelem után indul, idővel gyorsul, gumiszalaggal követ
      const cam = this.cameras.main;
      if (this.elapsed > 4) {
        const speed = 130 + Math.min(this.elapsed, 300) * 0.3;
        this.collapseX += speed * dt;
        const minX = cam.scrollX - 700;
        if (this.collapseX < minX) this.collapseX = minX;
        this.gen.collapseTo(this.collapseX);

        // elérte a játékost → azonnali halál
        if (this.player.x < this.collapseX + 20) {
          this.player.hp = 0;
          this.player.die();
        }
        // feszültség-remegés ha közel a front
        if (this.player.x - this.collapseX < 250) {
          cam.shake(60, 0.002);
        }
      }

      // szörny AI + lemaradók/elnyeltek törlése
      const cullX = Math.max(cam.scrollX - 350, this.collapseX);
      [this.groundEnemies, this.airEnemies].forEach(group => {
        [...group.getChildren()].forEach(e => {
          if (!e.active) return;
          e.updateAI(dt, this.player);
          if (e.x < cullX || e.y > 900) e.destroy();
        });
      });
      [...this.shurikens.getChildren()].forEach(s => {
        if (s.active && (s.x < this.collapseX || s.x < cam.scrollX - 100 || s.x > cam.scrollX + 1100 || s.y > 900)) s.destroy();
      });
      [...this.pickups.getChildren()].forEach(h => {
        if (h.active && h.x < this.collapseX) h.destroy();
      });

      // leesés a pályáról
      if (this.player.y > 820) {
        this.player.hp = 0;
        this.player.die();
      }
    }

    // parallax: a háttér a kamera nézetét követi, textúra-eltolás adja a mélységet
    const view = this.cameras.main.worldView;
    [this.bgFar, this.bgMid, this.bgNear].forEach(bg => bg.setPosition(view.x, view.y));
    this.bgFar.tilePositionX = view.x * 0.08;
    this.bgMid.tilePositionX = view.x * 0.22;
    this.bgNear.tilePositionX = view.x * 0.45;

    // omlás-front vizuál pozicionálás
    this.collapseDark.setPosition(this.collapseX + 6, view.centerY);
    this.collapseGrad.setPosition(this.collapseX - 6, view.centerY);
    this.collapseEmitter.setPosition(this.collapseX - 4, view.centerY);

    Keys.endFrame();
  }
}
