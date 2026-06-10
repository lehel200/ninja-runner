// Pixel art textúrák generálása kódból, induláskor. Nincs külső asset.
const Textures = {

  makeTex(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;
    draw(ctx, w, h);
    canvas.refresh();
  },

  generateAll(scene) {
    this.ninja(scene);
    this.enemies(scene);
    this.tiles(scene);
    this.misc(scene);
    this.backgrounds(scene);
  },

  // ----- ninja (32x20 vászon, talp y=20, jobbra néz) -----
  ninja(scene) {
    const C = {
      hood: '#26345f', hoodDark: '#1b2547', skin: '#e8b88a', eye: '#10131f',
      body: '#2e3e6e', belt: '#b23b34', scarf: '#c63f37', scarfL: '#e05548',
      blade: '#dde7ee', bladeEdge: '#9fb4c0', handle: '#6d4c41', sash: '#3c4f85'
    };
    const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

    const head = (ctx, ox = 0, oy = 0) => {
      px(ctx, 12 + ox, 1 + oy, 7, 6, C.hood);
      px(ctx, 12 + ox, 1 + oy, 7, 1, C.hoodDark);
      px(ctx, 14 + ox, 3 + oy, 5, 2, C.skin);
      px(ctx, 16 + ox, 3 + oy, 1, 1, C.eye);
      px(ctx, 18 + ox, 3 + oy, 1, 1, C.eye);
    };

    const torso = (ctx) => {
      px(ctx, 13, 7, 6, 5, C.body);
      px(ctx, 13, 9, 2, 2, C.sash);
      px(ctx, 13, 12, 6, 1, C.belt);
    };

    const scarf = (ctx, wave, len = 5) => {
      px(ctx, 11, 6, 2, 2, C.scarf);
      for (let i = 0; i < len; i++) {
        const y = 6 + Math.round(Math.sin(wave + i * 0.9) * 1.5);
        px(ctx, 10 - i, y, 1, 2, i % 2 ? C.scarfL : C.scarf);
      }
    };

    const swordOnBack = (ctx) => {
      px(ctx, 9, 1, 2, 2, C.handle);
      px(ctx, 10, 3, 2, 1, C.blade);
      px(ctx, 11, 4, 2, 1, C.blade);
      px(ctx, 12, 5, 2, 1, C.bladeEdge);
    };

    const legsRun = (ctx, phase) => {
      // 6 fázisú futás: első/hátsó láb ellentétes kilépéssel
      const t = phase / 6 * Math.PI * 2;
      const a = Math.round(Math.sin(t) * 3);
      const b = Math.round(Math.sin(t + Math.PI) * 3);
      // láb: comb + lábszár
      px(ctx, 14 + Math.round(a / 2), 13, 2, 4, C.hoodDark);
      px(ctx, 14 + a, 16, 2, 4 - Math.abs(Math.round(a / 2)), C.hood);
      px(ctx, 17 + Math.round(b / 2), 13, 2, 4, C.body);
      px(ctx, 17 + b, 16, 2, 4 - Math.abs(Math.round(b / 2)), C.hood);
    };

    const legsIdle = (ctx) => {
      px(ctx, 14, 13, 2, 7, C.hoodDark);
      px(ctx, 17, 13, 2, 7, C.hood);
    };

    const legsTuck = (ctx) => {
      px(ctx, 13, 13, 3, 4, C.hoodDark);
      px(ctx, 17, 13, 3, 5, C.hood);
    };

    // idle
    this.makeTex(scene, 'ninja_idle', 32, 20, (ctx) => {
      swordOnBack(ctx); head(ctx); torso(ctx); scarf(ctx, 0, 4); legsIdle(ctx);
      px(ctx, 18, 8, 2, 4, C.hoodDark);
    });

    // futás 6 frame
    for (let i = 0; i < 6; i++) {
      this.makeTex(scene, `ninja_run_${i}`, 32, 20, (ctx) => {
        swordOnBack(ctx); head(ctx); torso(ctx); scarf(ctx, i * 1.1, 5);
        legsRun(ctx, i);
        const arm = Math.round(Math.sin(i / 6 * Math.PI * 2) * 2);
        px(ctx, 18 + arm, 8, 2, 4, C.hoodDark);
      });
    }

    // ugrás / esés
    this.makeTex(scene, 'ninja_jump', 32, 20, (ctx) => {
      swordOnBack(ctx); head(ctx, 0, -1); torso(ctx); scarf(ctx, 1, 6); legsTuck(ctx);
      px(ctx, 18, 6, 2, 3, C.hoodDark); // kar fent
    });
    this.makeTex(scene, 'ninja_fall', 32, 20, (ctx) => {
      swordOnBack(ctx); head(ctx); torso(ctx); scarf(ctx, 2.5, 6);
      px(ctx, 13, 13, 2, 6, C.hoodDark);
      px(ctx, 17, 13, 3, 4, C.hood);
      px(ctx, 18, 8, 3, 2, C.hoodDark);
    });

    // falcsúszás (fal jobb oldalon)
    this.makeTex(scene, 'ninja_slide', 32, 20, (ctx) => {
      swordOnBack(ctx); head(ctx, 1, 0); torso(ctx); scarf(ctx, 0.5, 6);
      px(ctx, 14, 13, 2, 5, C.hoodDark);
      px(ctx, 17, 13, 2, 6, C.hood);
      px(ctx, 19, 6, 2, 3, C.skin);  // kéz a falon
      px(ctx, 19, 14, 2, 2, C.hood); // térd a falnak
    });

    // kardcsapás 4 frame
    const atkPoses = [
      (ctx) => { // 0: kard hátrahúzva fent
        px(ctx, 10, 0, 6, 2, C.blade); px(ctx, 15, 2, 2, 2, C.handle);
        px(ctx, 16, 5, 3, 3, C.hoodDark);
      },
      (ctx) => { // 1: vízszintes suhintás előre
        px(ctx, 21, 8, 9, 2, C.blade); px(ctx, 29, 8, 2, 2, C.bladeEdge);
        px(ctx, 19, 8, 2, 2, C.handle);
        px(ctx, 17, 8, 3, 2, C.skin);
      },
      (ctx) => { // 2: lefelé ívben
        px(ctx, 20, 11, 7, 2, C.blade); px(ctx, 26, 12, 2, 2, C.bladeEdge);
        px(ctx, 19, 10, 2, 2, C.handle);
        px(ctx, 17, 9, 3, 2, C.skin);
      },
      (ctx) => { // 3: visszahúzás
        px(ctx, 19, 9, 4, 2, C.blade);
        px(ctx, 18, 9, 1, 2, C.handle);
        px(ctx, 17, 8, 2, 3, C.hoodDark);
      }
    ];
    atkPoses.forEach((pose, i) => {
      this.makeTex(scene, `ninja_atk_${i}`, 32, 20, (ctx) => {
        head(ctx); torso(ctx); scarf(ctx, i * 1.6, 5); legsIdle(ctx);
        pose(ctx);
      });
    });
  },

  // ----- szörnyek -----
  enemies(scene) {
    const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

    // sétáló oni
    for (let f = 0; f < 2; f++) {
      this.makeTex(scene, `oni_${f}`, 18, 14, (ctx) => {
        px(ctx, 4, 1, 2, 3, '#ffe082'); px(ctx, 12, 1, 2, 3, '#ffe082'); // szarvak
        px(ctx, 2, 4, 14, 9, '#c62828');
        px(ctx, 2, 10, 14, 3, '#8e1c1c');
        px(ctx, 4, 6, 3, 2, '#ffffff'); px(ctx, 11, 6, 3, 2, '#ffffff');
        px(ctx, 5, 6, 1, 2, '#10131f'); px(ctx, 12, 6, 1, 2, '#10131f');
        px(ctx, 5, 10, 2, 2, '#fff3e0'); px(ctx, 11, 10, 2, 2, '#fff3e0'); // agyarak
        if (f === 0) { px(ctx, 3, 13, 3, 1, '#8e1c1c'); px(ctx, 12, 13, 3, 1, '#8e1c1c'); }
        else { px(ctx, 5, 13, 3, 1, '#8e1c1c'); px(ctx, 10, 13, 3, 1, '#8e1c1c'); }
      });
    }

    // repkedő denevér (3 szárnyállás)
    const wingY = [1, 4, 7];
    for (let f = 0; f < 3; f++) {
      this.makeTex(scene, `bat_${f}`, 18, 12, (ctx) => {
        const wy = wingY[f];
        px(ctx, 1, wy, 6, 3, '#4a148c');
        px(ctx, 11, wy, 6, 3, '#4a148c');
        px(ctx, 2, wy + 2, 4, 2, '#6a1b9a');
        px(ctx, 12, wy + 2, 4, 2, '#6a1b9a');
        px(ctx, 7, 4, 4, 5, '#6a1b9a');
        px(ctx, 7, 9, 1, 2, '#4a148c'); px(ctx, 10, 9, 1, 2, '#4a148c');
        px(ctx, 7, 5, 1, 1, '#ff5252'); px(ctx, 10, 5, 1, 1, '#ff5252');
      });
    }

    // ugráló béka (ülő + nyújtott)
    this.makeTex(scene, 'frog_0', 16, 12, (ctx) => {
      px(ctx, 2, 4, 12, 7, '#2e7d32');
      px(ctx, 2, 8, 12, 3, '#1b5e20');
      px(ctx, 3, 2, 3, 3, '#ffffff'); px(ctx, 10, 2, 3, 3, '#ffffff');
      px(ctx, 4, 3, 1, 1, '#10131f'); px(ctx, 11, 3, 1, 1, '#10131f');
      px(ctx, 1, 9, 3, 2, '#1b5e20'); px(ctx, 12, 9, 3, 2, '#1b5e20');
    });
    this.makeTex(scene, 'frog_1', 16, 12, (ctx) => {
      px(ctx, 3, 1, 10, 7, '#2e7d32');
      px(ctx, 3, 5, 10, 3, '#1b5e20');
      px(ctx, 4, 0, 2, 2, '#ffffff'); px(ctx, 10, 0, 2, 2, '#ffffff');
      px(ctx, 5, 0, 1, 1, '#10131f'); px(ctx, 11, 0, 1, 1, '#10131f');
      px(ctx, 1, 8, 3, 4, '#1b5e20'); px(ctx, 12, 8, 3, 4, '#1b5e20');
    });

    // shuriken-dobó rivális ninja (szürke)
    for (let f = 0; f < 2; f++) {
      this.makeTex(scene, `thrower_${f}`, 16, 18, (ctx) => {
        px(ctx, 5, 1, 6, 5, '#37474f');
        px(ctx, 5, 3, 6, 2, '#c9a07a');
        px(ctx, 6, 3, 1, 1, '#b71c1c'); px(ctx, 9, 3, 1, 1, '#b71c1c'); // vörös szem
        px(ctx, 5, 6, 6, 7, '#455a64');
        px(ctx, 5, 11, 6, 1, '#263238');
        px(ctx, 5, 13, 2, 5, '#37474f'); px(ctx, 9, 13, 2, 5, '#37474f');
        if (f === 0) px(ctx, 11, 8, 2, 4, '#37474f');     // kar lent
        else { px(ctx, 11, 3, 2, 4, '#37474f'); px(ctx, 12, 2, 2, 2, '#90a4ae'); } // dobás
      });
    }

    // shuriken
    this.makeTex(scene, 'shuriken', 8, 8, (ctx) => {
      px(ctx, 3, 0, 2, 8, '#90a4ae');
      px(ctx, 0, 3, 8, 2, '#90a4ae');
      px(ctx, 3, 3, 2, 2, '#cfd8dc');
    });
  },

  // ----- csempék -----
  tiles(scene) {
    const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

    this.makeTex(scene, 'tile_ground', 16, 16, (ctx) => {
      px(ctx, 0, 0, 16, 16, '#5d4037');
      for (let i = 0; i < 10; i++) {
        px(ctx, (i * 7 + 3) % 16, (i * 5 + 6) % 12 + 4, 2, 1, '#4e342e');
      }
      px(ctx, 0, 0, 16, 4, '#3e8948');
      px(ctx, 0, 0, 16, 1, '#5fb364');
      px(ctx, 2, 3, 2, 2, '#3e8948'); px(ctx, 9, 3, 3, 2, '#3e8948');
    });

    this.makeTex(scene, 'tile_dirt', 16, 16, (ctx) => {
      px(ctx, 0, 0, 16, 16, '#5d4037');
      for (let i = 0; i < 10; i++) {
        px(ctx, (i * 11 + 2) % 14, (i * 7 + 3) % 14, 2, 1, '#4e342e');
      }
    });

    this.makeTex(scene, 'tile_wall', 16, 16, (ctx) => {
      px(ctx, 0, 0, 16, 16, '#546e7a');
      px(ctx, 0, 0, 16, 1, '#37474f'); px(ctx, 0, 8, 16, 1, '#37474f');
      px(ctx, 7, 1, 1, 7, '#37474f'); px(ctx, 3, 9, 1, 7, '#37474f'); px(ctx, 12, 9, 1, 7, '#37474f');
      px(ctx, 1, 2, 3, 2, '#607d8b'); px(ctx, 9, 10, 3, 2, '#607d8b');
    });

    this.makeTex(scene, 'tile_plat', 16, 16, (ctx) => {
      px(ctx, 0, 0, 16, 6, '#8d6e63');
      px(ctx, 0, 0, 16, 1, '#a1887f');
      px(ctx, 5, 1, 1, 5, '#6d4c41'); px(ctx, 11, 1, 1, 5, '#6d4c41');
      px(ctx, 2, 6, 2, 3, '#6d4c41'); px(ctx, 12, 6, 2, 3, '#6d4c41');
    });
  },

  // ----- egyéb -----
  misc(scene) {
    const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

    this.makeTex(scene, 'px', 2, 2, (ctx) => px(ctx, 0, 0, 2, 2, '#ffffff'));

    this.makeTex(scene, 'heart', 12, 11, (ctx) => {
      px(ctx, 1, 1, 4, 3, '#e53935'); px(ctx, 7, 1, 4, 3, '#e53935');
      px(ctx, 0, 2, 12, 4, '#e53935');
      px(ctx, 2, 6, 8, 2, '#c62828');
      px(ctx, 4, 8, 4, 2, '#c62828');
      px(ctx, 5, 10, 2, 1, '#c62828');
      px(ctx, 2, 2, 2, 2, '#ff8a80');
    });

    // kardsuhintás-ív effekt
    this.makeTex(scene, 'slash_arc', 24, 24, (ctx) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(2, 12, 16, -0.9, 0.9);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(180,220,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(2, 12, 11, -0.8, 0.8);
      ctx.stroke();
    });
  },

  // ----- parallax hátterek (vízszintesen csempézhető) -----
  backgrounds(scene) {
    // távoli: ég gradiens + hold + hegyek
    this.makeTex(scene, 'bg_far', 480, 270, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#181030');
      grad.addColorStop(0.6, '#3a2452');
      grad.addColorStop(1, '#5b3a63');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // hold
      ctx.fillStyle = '#f5ecd7';
      ctx.beginPath(); ctx.arc(360, 60, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0d5bb';
      ctx.beginPath(); ctx.arc(352, 54, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(368, 68, 3, 0, Math.PI * 2); ctx.fill();
      // csillagok
      ctx.fillStyle = '#cfc3e8';
      for (let i = 0; i < 40; i++) {
        ctx.fillRect((i * 97 + 31) % w, (i * 53 + 11) % 140, 1, 1);
      }
      // hegyek (periodikus → csempézhető)
      ctx.fillStyle = '#241a3e';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y = 190 - Math.sin(x / w * Math.PI * 2) * 30 - Math.sin(x / w * Math.PI * 6) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1c1433';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y = 225 - Math.sin((x / w + 0.3) * Math.PI * 4) * 22;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath(); ctx.fill();
    });

    // középső: pagoda sziluettek
    this.makeTex(scene, 'bg_mid', 480, 270, (ctx, w, h) => {
      ctx.fillStyle = '#171028';
      const pagoda = (bx, by, s) => {
        // 3 szintes pagoda
        for (let lvl = 0; lvl < 3; lvl++) {
          const lw = (50 - lvl * 12) * s;
          const ly = by - lvl * 26 * s;
          ctx.fillRect(bx - lw / 2, ly - 14 * s, lw, 14 * s);
          ctx.beginPath();
          ctx.moveTo(bx - lw / 2 - 9 * s, ly - 14 * s);
          ctx.lineTo(bx + lw / 2 + 9 * s, ly - 14 * s);
          ctx.lineTo(bx, ly - 26 * s);
          ctx.closePath(); ctx.fill();
        }
      };
      pagoda(90, 268, 1);
      pagoda(300, 268, 0.7);
      pagoda(420, 268, 0.5);
      // fák
      ctx.fillStyle = '#171028';
      [180, 230, 360].forEach(x => {
        ctx.fillRect(x - 2, 230, 4, 40);
        ctx.beginPath(); ctx.arc(x, 226, 14, 0, Math.PI * 2); ctx.fill();
      });
    });

    // közeli: bambusz
    this.makeTex(scene, 'bg_near', 480, 270, (ctx, w, h) => {
      ctx.fillStyle = '#120d22';
      [30, 55, 150, 175, 290, 310, 400, 430].forEach((x, i) => {
        const bw = 5 + (i % 3);
        ctx.fillRect(x, 40 + (i * 37) % 60, bw, 270);
        // bambusz csomópontok
        ctx.fillStyle = '#0c081a';
        for (let y = 60 + (i * 23) % 40; y < 270; y += 34) {
          ctx.fillRect(x - 1, y, bw + 2, 3);
        }
        // levelek
        ctx.fillStyle = '#120d22';
        ctx.beginPath();
        ctx.ellipse(x + bw + 9, 70 + (i * 41) % 80, 11, 4, 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }
};
