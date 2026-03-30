class SpriteManager {
  // ── Preload (call in scene.preload) ──────────────────────────────────────────
  static preload(scene) {
    SpriteManager._loadErrors   = [];
    SpriteManager._loadedAssets = 0;
    SpriteManager._expectedKeys = [
      'background',
      'player_idle', 'player_walk',
      'slime_green', 'slime_blue', 'slime_red', 'slime_white'
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

    // Player spritesheets
    scene.load.spritesheet('player_idle', 'sprites/player_idle.png', {
      frameWidth: 57, frameHeight: 55
    });
    scene.load.spritesheet('player_walk', 'sprites/player_walk.png', {
      frameWidth: 60, frameHeight: 58
    });

    // Operation-specific slime spritesheets (128×128, 4×4 grid = 16 frames of 32×32)
    scene.load.spritesheet('slime_green', 'sprites/Slime_Medium_Green.png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('slime_blue',  'sprites/Slime_Medium_Blue.png',  { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('slime_red',   'sprites/Slime_Medium_Red.png',   { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('slime_white', 'sprites/Slime_Medium_White.png', { frameWidth: 32, frameHeight: 32 });

    // Placeholder textures for elements with no sprite file
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

    if (!a.exists('player_idle_anim')) {
      a.create({ key: 'player_idle_anim',
        frames: a.generateFrameNumbers('player_idle', { start: 0, end: 7 }),
        frameRate: 8, repeat: -1 });
    }
    if (!a.exists('player_walk_anim')) {
      a.create({ key: 'player_walk_anim',
        frames: a.generateFrameNumbers('player_walk', { start: 0, end: 17 }),
        frameRate: 10, repeat: -1 });
    }

    const slimes = [
      { key: 'slime_green', anim: 'slime_green_anim' },
      { key: 'slime_blue',  anim: 'slime_blue_anim'  },
      { key: 'slime_red',   anim: 'slime_red_anim'   },
      { key: 'slime_white', anim: 'slime_white_anim' }
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
    sp.setScale(1.4);
    if (scene.anims.exists('player_idle_anim')) sp.play('player_idle_anim');
    return sp;
  }

  static createSlime(scene, x, y, operation) {
    const key  = SpriteManager._slimeKey(operation);
    const anim = SpriteManager._slimeAnim(operation);
    const sp   = scene.add.sprite(x, y, key);
    sp.setScale(2.0); // 32px × 2 = 64px display
    if (scene.anims.exists(anim)) sp.play(anim);
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
  static _slimeKey(op) {
    switch (op) {
      case '+': return 'slime_green';
      case '-': return 'slime_blue';
      case '*': return 'slime_red';
      case '/': return 'slime_white';
      default:  return 'slime_green';
    }
  }

  static _slimeAnim(op) {
    switch (op) {
      case '+': return 'slime_green_anim';
      case '-': return 'slime_blue_anim';
      case '*': return 'slime_red_anim';
      case '/': return 'slime_white_anim';
      default:  return 'slime_green_anim';
    }
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
