// Procedurális pálya: oszloponként generál előre, mögötte takarít.
const TILE = 32;

class ChunkGenerator {
  constructor(scene) {
    this.scene = scene;
    this.tiles = scene.physics.add.staticGroup();
    this.cols = new Map();           // oszlopindex -> { tiles: [], groundY }
    this.groundY = 480;              // talaj teteje (világ y)
    this.startCol = -6;
    this.nextCol = this.startCol;
    this.featureCooldown = 0;
    this.gapRemaining = 0;
    this.safeUntil = 36;             // első szakasz: sima talaj
  }

  update() {
    const cam = this.scene.cameras.main;
    const genUntil = Math.floor((cam.scrollX + cam.width + 400) / TILE);
    while (this.nextCol <= genUntil) {
      this.genColumn(this.nextCol++);
    }
    // takarítás a kamera mögött
    const cleanBefore = Math.floor((cam.scrollX - 360) / TILE);
    for (const [col, entry] of this.cols) {
      if (col < cleanBefore) {
        entry.tiles.forEach(t => t.destroy());
        this.cols.delete(col);
      }
    }
  }

  genColumn(col) {
    const entry = { tiles: [], groundY: null };
    this.cols.set(col, entry);
    const x = col * TILE;

    // szakadék
    if (this.gapRemaining > 0) {
      this.gapRemaining--;
      return;
    }

    // új pályaelem választás
    if (this.featureCooldown-- <= 0 && col > this.startCol + this.safeUntil) {
      const roll = Math.random();
      if (roll < 0.22) {
        // szakadék (2-3 oszlop)
        this.gapRemaining = Phaser.Math.Between(2, 3);
        this.featureCooldown = Phaser.Math.Between(8, 14);
        this.fillGround(entry, x);
        entry.groundY = this.groundY;
        this.cols.set(col, entry);
        return;
      } else if (roll < 0.45) {
        // szintlépés
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.groundY = Phaser.Math.Clamp(
          this.groundY + dir * TILE * Phaser.Math.Between(1, 2), 352, 480);
        this.featureCooldown = Phaser.Math.Between(5, 10);
      } else if (roll < 0.68) {
        // fal akadály
        const h = Math.random() < 0.3 ? 4 : 3;
        this.fillGround(entry, x);
        entry.groundY = this.groundY;
        for (let i = 1; i <= h; i++) {
          this.addTile(entry, x, this.groundY - i * TILE, 'tile_wall');
        }
        if (h === 4) {
          // magas falhoz segéd-platform előtte
          for (let p = 0; p < 3; p++) {
            this.addTile(entry, x - (5 - p) * TILE, this.groundY - 3 * TILE, 'tile_plat');
          }
        }
        this.featureCooldown = Phaser.Math.Between(10, 16);
        return;
      } else {
        // lebegő platform sor
        const count = Phaser.Math.Between(1, 3);
        for (let p = 0; p < count; p++) {
          const pw = Phaser.Math.Between(3, 4);
          const px0 = x + (p * 6 + 2) * TILE;
          const py = this.groundY - TILE * Phaser.Math.Between(3, 6);
          for (let i = 0; i < pw; i++) {
            this.addTile(entry, px0 + i * TILE, py, 'tile_plat');
          }
        }
        this.featureCooldown = Phaser.Math.Between(12, 18);
      }
    }

    this.fillGround(entry, x);
    entry.groundY = this.groundY;
  }

  fillGround(entry, x) {
    this.addTile(entry, x, this.groundY, 'tile_ground');
    for (let y = this.groundY + TILE; y <= 672; y += TILE) {
      this.addTile(entry, x, y, 'tile_dirt');
    }
  }

  addTile(entry, x, y, key) {
    const t = this.tiles.create(x + TILE / 2, y + TILE / 2, key);
    t.setScale(2).refreshBody();
    t.setDepth(5);
    entry.tiles.push(t);
  }

  // Talaj teteje adott x-nél; null = szakadék vagy még nem generált.
  groundYAt(x) {
    const entry = this.cols.get(Math.floor(x / TILE));
    return entry ? entry.groundY : null;
  }
}
