// HUD külön jeleneten, natív (1920×1080) felbontáson — éles feliratok.
class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.gs = this.scene.get('Game');
    this.recordBeaten = false;

    this.hpBarBg = this.add.rectangle(40, 40, 408, 44, 0x10131f)
      .setOrigin(0).setStrokeStyle(3, 0x8899aa);
    this.hpBar = this.add.rectangle(44, 44, 400, 36, 0x43a047).setOrigin(0);

    const style = { fontFamily: 'monospace', fontSize: '38px', color: '#ffffff', fontStyle: 'bold' };
    this.timeText = this.add.text(960, 34, '0:00.0', { ...style, fontSize: '50px' }).setOrigin(0.5, 0);
    this.recordText = this.add.text(1880, 38, '', { ...style, color: '#ffd54f' }).setOrigin(1, 0);
    this.killText = this.add.text(40, 100, '⚔ 0', style);
    this.skillText = this.add.text(40, 156, '', {
      fontFamily: 'monospace', fontSize: '30px', color: '#90caf9', fontStyle: 'bold'
    });
  }

  fmt(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
  }

  // világkoordinátás lebegő szöveg (pl. +20 élet) képernyő-koordinátára vetítve
  floatTextWorld(wx, wy, str, color) {
    const cam = this.gs.cameras.main;
    const x = (wx - cam.scrollX - 480) * 2 + 960;
    const y = (wy - cam.scrollY - 270) * 2 + 540;
    const t = this.add.text(x, y, str, {
      fontFamily: 'monospace', fontSize: '34px', color, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: y - 80, alpha: 0, duration: 700,
      onComplete: () => t.destroy()
    });
  }

  update() {
    const gs = this.gs;
    if (!gs || !gs.player) return;

    const ratio = gs.player.hp / Player.MAX_HP;
    this.hpBar.width = 400 * ratio;
    this.hpBar.fillColor = ratio > 0.5 ? 0x43a047 : ratio > 0.25 ? 0xfb8c00 : 0xe53935;
    this.timeText.setText(this.fmt(gs.elapsed));
    this.killText.setText(`⚔ ${gs.kills}`);

    // megszerzett skillek szintjei
    if (gs.skills) {
      const roman = ['', 'I', 'II', 'III'];
      const parts = [];
      if (gs.skills.speed) parts.push(`🏃 ${roman[gs.skills.speed]}`);
      if (gs.skills.range) parts.push(`🗡 ${roman[gs.skills.range]}`);
      if (gs.skills.jump) parts.push(`⬆ ${roman[gs.skills.jump]}`);
      this.skillText.setText(parts.join('   '));
    }

    if (!this.recordBeaten && gs.record > 0 && gs.elapsed > gs.record) {
      this.recordBeaten = true;
      SFX.newRecord();
      const t = this.add.text(960, 240, 'ÚJ REKORD!', {
        fontFamily: 'monospace', fontSize: '80px', color: '#ffd54f', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({
        targets: t, scale: 1.4, alpha: 0, duration: 1500,
        ease: 'Cubic.easeOut', onComplete: () => t.destroy()
      });
    }
    this.recordText.setText(
      `REKORD ${this.fmt(this.recordBeaten ? gs.elapsed : gs.record)}`);
  }
}
