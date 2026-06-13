// Teljes ranglista: overlay a menü fölött, görgethető top 100.
class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('Leaderboard');
  }

  create() {
    this.scrollY = 0;
    this.maxScroll = 0;

    // sötétítő + kattintás-blokkoló háttér
    const blocker = this.add.rectangle(960, 540, 1920, 1080, 0x0d0a1a, 0.85)
      .setInteractive();
    blocker.on('pointerdown', () => {}); // elnyeli a kattintást

    this.add.rectangle(960, 540, 1300, 940, 0x10131f, 0.97)
      .setStrokeStyle(6, 0xffd54f);
    this.add.text(960, 130, '🏆 TELJES RANGLISTA', {
      fontFamily: 'monospace', fontSize: '56px', color: '#ffd54f', fontStyle: 'bold'
    }).setOrigin(0.5);

    const close = this.add.text(1570, 110, '✕', {
      fontFamily: 'monospace', fontSize: '48px', color: '#b9aed4', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerover', () => close.setColor('#ffffff'));
    close.on('pointerout', () => close.setColor('#b9aed4'));
    close.on('pointerdown', () => this.close());

    this.loadingText = this.add.text(960, 540, 'Betöltés...', {
      fontFamily: 'monospace', fontSize: '36px', color: '#b9aed4'
    }).setOrigin(0.5);

    // görgethető sor-konténer maszkkal
    this.rowContainer = this.add.container(0, 0);
    const maskShape = this.make.graphics();
    maskShape.fillRect(330, 190, 1260, 790);
    this.rowContainer.setMask(maskShape.createGeometryMask());

    this.input.on('wheel', (pointer, over, dx, dy) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.6, 0, this.maxScroll);
      this.rowContainer.y = -this.scrollY;
    });

    Supa.fetchBoard(100).then(rows => {
      if (!this.scene.isActive('Leaderboard')) return;
      this.loadingText.destroy();
      this.buildRows(rows);
    });
  }

  buildRows(rows) {
    if (!rows.length) {
      this.add.text(960, 540, 'Még üres a ranglista — légy te az első!', {
        fontFamily: 'monospace', fontSize: '32px', color: '#b9aed4'
      }).setOrigin(0.5);
      return;
    }

    const rankColors = ['#ffd54f', '#cfd8dc', '#cd7f32'];
    const startY = 240;
    const rowH = 74;

    rows.forEach((row, i) => {
      const y = startY + i * rowH;
      const own = Supa.user && row.user_id === Supa.user.id;

      if (own) {
        this.rowContainer.add(this.add.rectangle(960, y, 1220, rowH - 8, 0x1d2f50)
          .setStrokeStyle(3, 0x90caf9));
      } else if (i % 2 === 1) {
        this.rowContainer.add(this.add.rectangle(960, y, 1220, rowH - 8, 0x161a28));
      }

      this.rowContainer.add(this.add.text(420, y, `${i + 1}.`, {
        fontFamily: 'monospace', fontSize: '32px', fontStyle: 'bold',
        color: rankColors[i] || '#e8e2f5'
      }).setOrigin(0, 0.5));

      const av = this.add.image(530, y, 'avatar_0').setDisplaySize(52, 52);
      Avatars.ensure(this, row, (key) => {
        if (av.active) av.setTexture(key).setDisplaySize(52, 52);
      });
      this.rowContainer.add(av);

      this.rowContainer.add(this.add.text(590, y, row.display_name.slice(0, 22), {
        fontFamily: 'monospace', fontSize: '30px',
        color: own ? '#90caf9' : '#ffffff', fontStyle: own ? 'bold' : 'normal'
      }).setOrigin(0, 0.5));

      this.rowContainer.add(this.add.text(1280, y, `⚔ ${row.kills}`, {
        fontFamily: 'monospace', fontSize: '32px', color: '#ffd54f', fontStyle: 'bold'
      }).setOrigin(0, 0.5));

      const m = Math.floor(row.survival_time / 60);
      const s = Math.floor(row.survival_time % 60);
      this.rowContainer.add(this.add.text(1460, y, `${m}:${String(s).padStart(2, '0')}`, {
        fontFamily: 'monospace', fontSize: '26px', color: '#b9aed4'
      }).setOrigin(0, 0.5));
    });

    this.maxScroll = Math.max(0, rows.length * rowH - 760);
  }

  close() {
    this.scene.stop();
    this.scene.resume('Menu');
  }

  update() {
    if (Keys.codePressed('Escape')) this.close();
    Keys.endFrame();
  }
}
