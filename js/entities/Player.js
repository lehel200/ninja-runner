// Játékos: futás, ugrás (coyote + buffer), falcsúszás, falugrás, kardcsapás.
class Player extends Phaser.Physics.Arcade.Sprite {
  static SPEED = 270;
  static JUMP_VEL = 590;
  static WALL_SLIDE_MAX = 90;
  static WALL_JUMP_X = 340;
  static WALL_JUMP_Y = 560;
  static COYOTE = 0.1;
  static JUMP_BUFFER = 0.12;
  static ATTACK_TIME = 0.24;
  static ATTACK_COOLDOWN = 0.32;
  static INVULN_TIME = 1.1;
  static MAX_HP = 100;

  constructor(scene, x, y) {
    super(scene, x, y, 'ninja_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(3);
    this.body.setSize(9, 16);
    this.body.setOffset(12, 3);
    this.setDepth(10);

    this.hp = Player.MAX_HP;
    this.facing = 1;
    this.coyoteTimer = 0;
    this.bufferTimer = 0;
    this.attackTimer = 0;
    this.cooldownTimer = 0;
    this.invulnTimer = 0;
    this.controlLock = 0;
    this.swingId = 0;
    this.wallSliding = false;
    this.wasOnGround = false;
    this.dustTimer = 0;
    this.dead = false;

    // kard hitbox zóna
    this.attackZone = scene.add.zone(x, y, 66, 56);
    scene.physics.add.existing(this.attackZone);
    this.attackZone.body.setAllowGravity(false);
    this.attackZone.body.enable = false;
  }

  update(dt) {
    if (this.dead) return;
    const body = this.body;
    const onGround = body.blocked.down;

    // időzítők
    this.coyoteTimer = onGround ? Player.COYOTE : Math.max(0, this.coyoteTimer - dt);
    this.bufferTimer = Math.max(0, this.bufferTimer - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.controlLock = Math.max(0, this.controlLock - dt);

    if (Keys.justPressed('jump')) this.bufferTimer = Player.JUMP_BUFFER;

    const left = Keys.isDown('left');
    const right = Keys.isDown('right');

    // vízszintes mozgás (falugrás után rövid zár)
    if (this.controlLock <= 0) {
      if (left && !right) {
        body.setVelocityX(-Player.SPEED);
        this.facing = -1;
      } else if (right && !left) {
        body.setVelocityX(Player.SPEED);
        this.facing = 1;
      } else {
        body.setVelocityX(onGround ? 0 : body.velocity.x * 0.96);
      }
    }

    // falcsúszás: levegőben, fal felé nyomva, esés közben
    this.wallSliding = false;
    let wallDir = 0;
    if (!onGround && body.velocity.y > -60) {
      if (body.blocked.left && left) wallDir = -1;
      else if (body.blocked.right && right) wallDir = 1;
      if (wallDir !== 0) {
        this.wallSliding = true;
        if (body.velocity.y > Player.WALL_SLIDE_MAX) {
          body.setVelocityY(Player.WALL_SLIDE_MAX);
        }
      }
    }

    // ugrás: talajról (coyote) vagy falról
    if (this.bufferTimer > 0) {
      if (this.wallSliding) {
        body.setVelocityY(-Player.WALL_JUMP_Y);
        body.setVelocityX(-wallDir * Player.WALL_JUMP_X);
        this.facing = -wallDir;
        this.controlLock = 0.16;
        this.bufferTimer = 0;
        SFX.wallJump();
        this.scene.dust(this.x + wallDir * 14, this.y, 6);
      } else if (this.coyoteTimer > 0) {
        body.setVelocityY(-Player.JUMP_VEL);
        this.coyoteTimer = 0;
        this.bufferTimer = 0;
        SFX.jump();
        this.scene.dust(this.x, this.y + 26, 5);
      }
    }

    // rövid ugrás: gomb felengedésekor felfele lassítás
    if (!Keys.isDown('jump') && body.velocity.y < -200) {
      body.setVelocityY(body.velocity.y * 0.9);
    }

    // kardcsapás
    if (Keys.justPressed('attack') && this.cooldownTimer <= 0) {
      this.attackTimer = Player.ATTACK_TIME;
      this.cooldownTimer = Player.ATTACK_COOLDOWN;
      this.swingId++;
      this.play('atk', true);
      SFX.slash();
      this.scene.slashEffect(this);
    }

    // kard hitbox pozicionálás
    const attacking = this.attackTimer > 0;
    this.attackZone.body.enable = attacking;
    if (attacking) {
      this.attackZone.setPosition(this.x + this.facing * 50, this.y - 2);
    }

    // landolás: por (a sprite scale-jét nem tweeneljük — az átméretezné a fizikai testet is)
    if (onGround && !this.wasOnGround && body.velocity.y >= 0) {
      this.scene.dust(this.x, this.y + 26, 8);
    }
    this.wasOnGround = onGround;

    // futási por
    if (onGround && Math.abs(body.velocity.x) > 100) {
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.14;
        this.scene.dust(this.x - this.facing * 12, this.y + 26, 1);
      }
    }

    // animáció kiválasztás
    this.setFlipX(this.facing === -1);
    if (attacking) {
      // atk anim már fut
    } else if (this.wallSliding) {
      this.play('slide', true);
    } else if (!onGround) {
      this.play(body.velocity.y < 0 ? 'jump' : 'fall', true);
    } else if (Math.abs(body.velocity.x) > 20) {
      this.play('run', true);
    } else {
      this.play('idle', true);
    }

    // sebezhetetlenség villogás
    this.setAlpha(this.invulnTimer > 0 ? (Math.floor(this.invulnTimer * 12) % 2 ? 0.3 : 0.9) : 1);
  }

  takeDamage(amount, fromX) {
    if (this.dead || this.invulnTimer > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = Player.INVULN_TIME;
    const dir = this.x < fromX ? -1 : 1;
    this.body.setVelocity(dir * 260, -300);
    this.controlLock = 0.2;
    SFX.hit();
    this.scene.cameras.main.shake(120, 0.006);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.clearTint());
    if (this.hp <= 0) this.die();
    return true;
  }

  heal(amount) {
    this.hp = Math.min(Player.MAX_HP, this.hp + amount);
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.attackZone.body.enable = false;
    this.body.setVelocity(0, -400);
    this.body.checkCollision.none = true;
    this.setTint(0x888899);
    this.scene.onPlayerDeath();
  }

  static createAnims(scene) {
    const a = scene.anims;
    if (a.exists('run')) return;
    a.create({ key: 'idle', frames: [{ key: 'ninja_idle' }], frameRate: 1 });
    a.create({
      key: 'run',
      frames: [0, 1, 2, 3, 4, 5].map(i => ({ key: `ninja_run_${i}` })),
      frameRate: 14, repeat: -1
    });
    a.create({ key: 'jump', frames: [{ key: 'ninja_jump' }], frameRate: 1 });
    a.create({ key: 'fall', frames: [{ key: 'ninja_fall' }], frameRate: 1 });
    a.create({ key: 'slide', frames: [{ key: 'ninja_slide' }], frameRate: 1 });
    a.create({
      key: 'atk',
      frames: [0, 1, 2, 3].map(i => ({ key: `ninja_atk_${i}` })),
      frameRate: 18
    });
  }
}
