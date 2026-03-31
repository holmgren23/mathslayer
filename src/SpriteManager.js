class SpriteManager {
  // ── Preload (call in scene.preload) ──────────────────────────────────────────
  static preload(scene) {
    SpriteManager._loadErrors   = [];
    SpriteManager._loadedAssets = 0;
    SpriteManager._expectedKeys = [
      'background',
      'player_idle', 'player_attack', 'player_run', 'player_hurt',
      // Regular slimes
      'small_green', 'small_pink', 'small_violet',
      // Mid-wave slimes
      'medium_blue', 'medium_orange', 'medium_yellow',
      // Boss slimes
      'large_purple', 'large_red', 'large_grey'
    ];

    scene.load.on('loaderror', (file) => {
      const msg = `[MathSlayer] FAILED to load: ${file.key} (${file.src})`;
      console.error(msg);
      SpriteManager._loadErrors.push({ key: file.key, src: file.src });
    });

    scene.load.on('filecomplete', (key) => {
      if (SpriteManager._expectedKeys.includes(key)) {
        SpriteManager._loadedAssets++;
      }
    });

    scene.load.once('complete', () => {
      const total = SpriteManager._expectedKeys.length;
      const ok    = SpriteManager._loadedAssets;
      if (SpriteManager._loadErrors.length === 0) {
        console.log(`[MathSlayer] Loaded ${ok}/${total} assets successfully`);
      } else {
        console.warn(`[MathSlayer] Loaded ${ok}/${total} assets — ${SpriteManager._loadErrors.length} failed`);
      }
    });

    scene.load.image('background', 'sprites/background.png');

    // New samurai player spritesheets — 96px per frame, all horizontal strips
    scene.load.spritesheet('player_idle',   'sprites/player_idle.png',   { frameWidth: 96, frameHeight: 96 });
    scene.load.spritesheet('player_attack', 'sprites/player_attack.png', { frameWidth: 96, frameHeight: 96 });
    scene.load.spritesheet('player_run',     'sprites/player_run.png',    { frameWidth: 96, frameHeight: 96 });
    scene.load.spritesheet('player_hurt',    'sprites/player_hurt.png',   { frameWidth: 96, frameHeight: 96 });

    // All slime sheets are 1240×1860px — auto-detect frame size via common grid columns
    const slimeSheetW = 1240, slimeSheetH = 1860;
    const slimeFrame  = SpriteManager._detectSlimeFrameSize(slimeSheetW, slimeSheetH);

    // Regular slimes (wave 1-2)
    scene.load.spritesheet('small_green',   'sprites/SmallSlime_Green.png',   { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    scene.load.spritesheet('small_pink',    'sprites/SmallSlime_Pink.png',    { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    scene.load.spritesheet('small_violet',  'sprites/SmallSlime_Violet.png',  { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    // Mid-wave slimes (wave 3+)
    scene.load.spritesheet('medium_blue',   'sprites/MediumSlime_Blue.png',   { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    scene.load.spritesheet('medium_orange', 'sprites/MediumSlime_Orange.png', { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    scene.load.spritesheet('medium_yellow', 'sprites/MediumSlime_Yellow.png', { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    // Boss slimes
    scene.load.spritesheet('large_purple',  'sprites/LargeSlime_Purple.png',  { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    scene.load.spritesheet('large_red',     'sprites/LargeSlime_Red.png',      { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });
    scene.load.spritesheet('large_grey',    'sprites/LargeSlime_Grey.png',     { frameWidth: slimeFrame.w, frameHeight: slimeFrame.h });

    SpriteManager._createPlaceholders(scene);
  }

  // ── Show on-screen error panel if any assets failed to load ─────────────────
  static checkAndShowErrors(scene) {
    const errors = SpriteManager._loadErrors;
    if (!errors || errors.length === 0) return;

    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    const panelH = Math.min(40 + errors.length * 22 + 20, H - 20);
    const panelY = H / 2 - panelH / 2;

    const g = scene.add.graphics().setDepth(100);
    g.fillStyle(0x220000, 0.92);
    g.fillRoundedRect(20, panelY, W - 40, panelH, 10);
    g.lineStyle(2, 0xff4444);
    g.strokeRoundedRect(20, panelY, W - 40, panelH, 10);

    scene.add.text(W / 2, panelY + 18, '⚠ MISSING SPRITE FILES', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      color: '#ff6666'
    }).setOrigin(0.5, 0.5).setDepth(101);

    errors.forEach((err, i) => {
      scene.add.text(W / 2, panelY + 40 + i * 22, err.src, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffaaaa'
      }).setOrigin(0.5, 0.5).setDepth(101);
    });
  }

  // ── Animations (call in scene.create) ───────────────────────────────────────
  static createAnimations(scene) {
    const a = scene.anims;

    // New samurai player animations
    if (!a.exists('player_idle_anim')) {
      a.create({ key: 'player_idle_anim',
        frames: a.generateFrameNumbers('player_idle', { start: 0, end: 9 }),
        frameRate: 8, repeat: -1 });
    }
    if (!a.exists('player_attack_anim')) {
      a.create({ key: 'player_attack_anim',
        frames: a.generateFrameNumbers('player_attack', { start: 0, end: 6 }),
        frameRate: 10, repeat: 0 });
    }
    if (!a.exists('player_run_anim')) {
      a.create({ key: 'player_run_anim',
        frames: a.generateFrameNumbers('player_run', { start: 0, end: 15 }),
        frameRate: 12, repeat: -1 });
    }
    if (!a.exists('player_hurt_anim')) {
      a.create({ key: 'player_hurt_anim',
        frames: a.generateFrameNumbers('player_hurt', { start: 0, end: 3 }),
        frameRate: 6, repeat: 0 });
    }

    // New slime animations — use first 4 frames of each sheet
    const slimes = [
      // Regular
      { key: 'small_green',   anim: 'small_green_anim'   },
      { key: 'small_pink',    anim: 'small_pink_anim'    },
      { key: 'small_violet',  anim: 'small_violet_anim'  },
      // Mid-wave
      { key: 'medium_blue',   anim: 'medium_blue_anim'   },
      { key: 'medium_orange', anim: 'medium_orange_anim' },
      { key: 'medium_yellow', anim: 'medium_yellow_anim' },
      // Boss
      { key: 'large_purple',  anim: 'large_purple_anim' },
      { key: 'large_red',     anim: 'large_red_anim'     },
      { key: 'large_grey',    anim: 'large_grey_anim'    }
    ];
    slimes.forEach(({ key, anim }) => {
      if (!a.exists(anim)) {
        a.create({ key: anim,
          frames: a.generateFrameNumbers(key, { start: 0, end: 3 }),
          frameRate: 6, repeat: -1 });
      }
    });
  }

  // ── Sprite factories ─────────────────────────────────────────────────────────
  static createPlayer(scene, x, y) {
    const sp = scene.add.sprite(x, y, 'player_idle');
    sp.setScale(2.5);
    if (scene.anims.exists('player_idle_anim')) sp.play('player_idle_anim');
    return sp;
  }

  static addBounceToSlime(slime, scene, baseY) {
    scene.tweens.add({
      targets: slime,
      y: baseY + 10,
      duration: 700,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  static createSlime(scene, x, y, operation, wave) {
    const key  = SpriteManager._slimeKey(operation, wave);
    const anim = SpriteManager._slimeAnim(operation, wave);
    const sp   = scene.add.sprite(x, y, key);
    // Scale down to fit: original 248px → ~80px display
    sp.setScale(0.32);
    sp.setFlipX(true);
    if (scene.anims.exists(anim)) sp.play(anim);
    SpriteManager.addBounceToSlime(sp, scene, y);
    return sp;
  }

  static createBossSlime(scene, x, y, variant) {
    const keyMap = { purple: 'large_purple', red: 'large_red', grey: 'large_grey' };
    const key = keyMap[variant] || 'large_purple';
    const anim = key + '_anim';
    const sp = scene.add.sprite(x, y, key);
    sp.setScale(CONFIG.BOSS_SCALE);
    sp.setFlipX(true);
    if (scene.anims.exists(anim)) sp.play(anim);
    SpriteManager.addBounceToSlime(sp, scene, y);
    return sp;
  }

  static createProjectile(scene, x, y) {
    return scene.add.sprite(x, y, 'projectile');
  }

  static createHeart(scene, x, y) {
    return scene.add.sprite(x, y, 'heart');
  }

  static createHeartEmpty(scene, x, y) {
    return scene.add.sprite(x, y, 'heart_empty');
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  // Auto-detect frame size for a 1240×1860 slime sheet by testing common column grids.
  // Tries 5→4→3→2 columns; returns the first whose rows also divide evenly.
  static _detectSlimeFrameSize(sheetW, sheetH) {
    for (const cols of [5, 4, 3, 2]) {
      if (sheetW % cols !== 0) continue;
      const fw = sheetW / cols;
      // Assume a reasonable row count (typically 5-8 for these sheets) and find exact match
      const rows = Math.round(sheetH / fw);
      if (rows > 0 && sheetH % rows === 0) {
        return { w: fw, h: sheetH / rows };
      }
    }
    // Fallback: 5-column default (1240/5 = 248, 1860/5 = 372)
    return { w: sheetW / 5, h: sheetH / 5 };
  }

  static _slimeKey(operation, wave) {
    // Wave 3+ mid-wave slimes
    if (wave >= 3) {
      const mid = ['medium_blue', 'medium_orange', 'medium_yellow'];
      const idx = ['+', '-', '*', '/'].indexOf(operation) % mid.length;
      return mid[idx];
    }
    // Regular slimes by operation
    switch (operation) {
      case '+': return 'small_green';
      case '-': return 'small_pink';
      case '*': return 'small_violet';
      case '/': return 'small_pink';
      default:  return 'small_green';
    }
  }

  static _slimeAnim(operation, wave) {
    return SpriteManager._slimeKey(operation, wave) + '_anim';
  }

  // Generate small placeholder textures for non-sprited elements
  static _createPlaceholders(scene) {
    // Projectile — yellow energy bolt (18×8)
    if (!scene.textures.exists('projectile')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xff8800); g.fillEllipse(9, 4, 16, 6);
      g.fillStyle(0xffee00); g.fillEllipse(9, 4, 12, 5);
      g.fillStyle(0xffffff); g.fillCircle(9, 4, 2);
      g.generateTexture('projectile', 18, 8);
      g.destroy();
    }

    // Heart — full (20×18)
    if (!scene.textures.exists('heart')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xcc2255);
      g.fillCircle(5, 7, 5); g.fillCircle(15, 7, 5);
      g.fillTriangle(0, 8, 20, 8, 10, 18);
      g.fillStyle(0xff4477);
      g.fillCircle(5, 6, 4); g.fillCircle(15, 6, 4);
      g.fillTriangle(1, 8, 19, 8, 10, 17);
      g.fillStyle(0xff88aa); g.fillCircle(7, 5, 2);
      g.generateTexture('heart', 20, 18);
      g.destroy();
    }

    // Heart empty (20×18)
    if (!scene.textures.exists('heart_empty')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x331122);
      g.fillCircle(5, 7, 5); g.fillCircle(15, 7, 5);
      g.fillTriangle(0, 8, 20, 8, 10, 18);
      g.fillStyle(0x553344);
      g.fillCircle(5, 6, 4); g.fillCircle(15, 6, 4);
      g.fillTriangle(1, 8, 19, 8, 10, 17);
      g.generateTexture('heart_empty', 20, 18);
      g.destroy();
    }
  }
}
