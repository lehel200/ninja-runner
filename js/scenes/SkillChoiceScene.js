// Kék szív skill-választó: a játék megáll, 3 kártya, kattintás vagy 1/2/3.
const SKILL_DEFS = [
  { key: 'speed',  icon: '🏃', name: 'Gyors láb', desc: '+15% mozgási sebesség' },
  { key: 'range',  icon: '⚔', name: 'Hosszú penge', desc: '+20% kard hatótáv' },
  { key: 'jump',   icon: '⬆', name: 'Magas ugrás', desc: '+12% ugrási erő' },
  { key: 'shield', icon: '🛡', name: 'Pajzs', desc: 'Túlgyógyítás pajzzsá válik (+25 kapacitás)' }
];
const SKILL_MAX_LEVEL = 3;
const ROMAN = ['—', 'I', 'II', 'III'];

class SkillChoiceScene extends Phaser.Scene {
  constructor() {
    super('SkillChoice');
  }

  create() {
    this.gs = this.scene.get('Game');
    this.chosen = false;

    this.add.rectangle(960, 540, 1920, 1080, 0x0d0a1a, 0.75);
    this.add.text(960, 200, '💙 VÁLASSZ KÉPESSÉGET!', {
      fontFamily: 'monospace', fontSize: '72px', color: '#90caf9', fontStyle: 'bold',
      stroke: '#10131f', strokeThickness: 12
    }).setOrigin(0.5);
    this.add.text(960, 290, 'Kattints egy kártyára, vagy nyomd meg az 1 / 2 / 3 / 4 gombot', {
      fontFamily: 'monospace', fontSize: '30px', color: '#b9aed4'
    }).setOrigin(0.5);

    this.cards = SKILL_DEFS.map((def, i) => this.makeCard(def, i));
  }

  makeCard(def, i) {
    const x = 360 + i * 400;
    const y = 620;
    const lvl = this.gs.skills[def.key];
    const maxed = lvl >= SKILL_MAX_LEVEL;

    const card = this.add.rectangle(x, y, 360, 460, maxed ? 0x1a1d28 : 0x1d2335)
      .setStrokeStyle(5, maxed ? 0x3a3f4f : 0x42a5f5);

    const textColor = maxed ? '#5a5f6f' : '#e8e2f5';
    this.add.text(x, y - 150, def.icon, { fontSize: '96px' }).setOrigin(0.5).setAlpha(maxed ? 0.35 : 1);
    this.add.text(x, y - 30, def.name, {
      fontFamily: 'monospace', fontSize: '40px', color: maxed ? '#5a5f6f' : '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(x, y + 40, def.desc, {
      fontFamily: 'monospace', fontSize: '22px', color: textColor,
      align: 'center', wordWrap: { width: 330 }
    }).setOrigin(0.5);
    this.add.text(x, y + 110,
      maxed ? 'MAX SZINT' : `${ROMAN[lvl]}  →  ${ROMAN[lvl + 1]}`, {
        fontFamily: 'monospace', fontSize: '34px',
        color: maxed ? '#5a5f6f' : '#90caf9', fontStyle: 'bold'
      }).setOrigin(0.5);
    this.add.text(x, y + 185, `[${i + 1}]`, {
      fontFamily: 'monospace', fontSize: '28px', color: maxed ? '#3a3f4f' : '#ffd54f'
    }).setOrigin(0.5);

    if (!maxed) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setFillStyle(0x2a3350));
      card.on('pointerout', () => card.setFillStyle(0x1d2335));
      card.on('pointerdown', () => this.choose(def.key));
    }
    return { card, def, maxed };
  }

  choose(key) {
    if (this.chosen) return;
    this.chosen = true;
    this.gs.skills[key]++;
    SFX.newRecord();
    this.scene.stop();
    this.scene.resume('Game');
  }

  update() {
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((code, i) => {
      if (Keys.codePressed(code) && !this.cards[i].maxed) {
        this.choose(this.cards[i].def.key);
      }
    });
    Keys.endFrame();
  }
}
