class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  init() {
    this.selectedOps       = ['+', '-', '*', '/'];
    this.selectedDifficulty = 'easy';
    this.opButtons  = {};
    this.diffButtons = {};
  }

  preload() {
    SpriteManager.preload(this);
  }

  create() {
    SpriteManager.createAnimations(this);
    this._drawBackground();
    this._createTitle();
    this._createOperationButtons();
    this._createDifficultyButtons();
    this._createHighScore();
    this._createStartButton();
    SpriteManager.checkAndShowErrors(this);
  }

  _drawBackground() {
    // Full-canvas background image
    const bg = this.add.image(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, 'background');
    bg.setDisplaySize(CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT).setDepth(0);

    // Dark overlay so UI is readable
    const ov = this.add.graphics().setDepth(1);
    ov.fillStyle(0x000011, 0.52);
    ov.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
  }

  _createTitle() {
    // Shadow
    this.add.text(403, 63, 'MATH SLAYER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '46px',
      color: '#220044',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5, 0.5).setDepth(2);

    const title = this.add.text(400, 60, 'MATH SLAYER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '46px',
      color: '#bb55ff',
      stroke: '#330066',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5).setDepth(2);

    this.tweens.add({
      targets: title,
      alpha: { from: 0.82, to: 1.0 },
      duration: 1300,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    this.add.text(400, 104, '\u2014 Defeat Slimes with Math! \u2014', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '15px',
      color: '#ccaaff'
    }).setOrigin(0.5, 0.5).setDepth(2);
  }

  _createOperationButtons() {
    this.add.text(400, 150, 'PRACTICE:', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '14px',
      color: '#ccaaff'
    }).setOrigin(0.5, 0.5).setDepth(2);

    const ops = [
      { label: '+ Addition',        op: '+' },
      { label: '\u2212 Subtract',   op: '-' },
      { label: '\u00d7 Multiply',   op: '*' },
      { label: '\u00f7 Division',   op: '/' }
    ];

    const btnW = 108, btnH = 38, gap = 12;
    const totalW = ops.length * btnW + (ops.length - 1) * gap;
    const startX = (CONFIG.GAME_WIDTH - totalW) / 2 + btnW / 2;

    ops.forEach((item, i) => {
      const x  = startX + i * (btnW + gap);
      const bg = this.add.graphics().setDepth(2);
      const txt = this.add.text(x, 184, item.label, {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0.5, 0.5).setDepth(3);

      const zone = this.add.zone(x, 184, btnW, btnH).setInteractive().setDepth(4);
      zone.on('pointerdown', () => this._toggleOp(item.op));
      zone.on('pointerover', () => txt.setColor('#ffeeaa'));
      zone.on('pointerout',  () => this._updateOpButtons());

      this.opButtons[item.op] = { bg, txt, x, y: 184, w: btnW, h: btnH };
    });

    this._updateOpButtons();
  }

  _toggleOp(op) {
    const idx = this.selectedOps.indexOf(op);
    if (idx >= 0) {
      if (this.selectedOps.length > 1) this.selectedOps.splice(idx, 1);
    } else {
      this.selectedOps.push(op);
    }
    this._updateOpButtons();
  }

  _updateOpButtons() {
    Object.keys(this.opButtons).forEach(op => {
      const btn = this.opButtons[op];
      const sel = this.selectedOps.includes(op);
      btn.bg.clear();
      if (sel) {
        btn.bg.fillStyle(0xaa44ff);
        btn.bg.fillRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.bg.lineStyle(2, 0xffffff);
        btn.bg.strokeRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.txt.setColor('#ffffff');
      } else {
        btn.bg.fillStyle(0x0a0011, 0.8);
        btn.bg.fillRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.bg.lineStyle(2, 0x664488);
        btn.bg.strokeRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.txt.setColor('#9966bb');
      }
    });
  }

  _createDifficultyButtons() {
    this.add.text(400, 238, 'DIFFICULTY:', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '14px',
      color: '#ccaaff'
    }).setOrigin(0.5, 0.5).setDepth(2);

    const diffs = [
      { label: 'EASY',   key: 'easy',   fill: 0x44cc44, text: '#000000' },
      { label: 'MEDIUM', key: 'medium', fill: 0xccaa00, text: '#000000' },
      { label: 'HARD',   key: 'hard',   fill: 0xff4444, text: '#ffffff' }
    ];

    const btnW = 98, btnH = 38, gap = 14;
    const totalW = diffs.length * btnW + (diffs.length - 1) * gap;
    const startX = (CONFIG.GAME_WIDTH - totalW) / 2 + btnW / 2;

    diffs.forEach((item, i) => {
      const x  = startX + i * (btnW + gap);
      const y  = 272;
      const bg = this.add.graphics().setDepth(2);
      const txt = this.add.text(x, y, item.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0.5, 0.5).setDepth(3);

      const zone = this.add.zone(x, y, btnW, btnH).setInteractive().setDepth(4);
      zone.on('pointerdown', () => {
        this.selectedDifficulty = item.key;
        this._updateDiffButtons();
      });

      this.diffButtons[item.key] = { bg, txt, x, y, w: btnW, h: btnH, fill: item.fill, textColor: item.text };
    });

    this._updateDiffButtons();
  }

  _updateDiffButtons() {
    Object.keys(this.diffButtons).forEach(key => {
      const btn = this.diffButtons[key];
      const sel = this.selectedDifficulty === key;
      btn.bg.clear();
      if (sel) {
        btn.bg.fillStyle(btn.fill);
        btn.bg.fillRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.bg.lineStyle(2, 0xffffff);
        btn.bg.strokeRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.txt.setColor(btn.textColor);
      } else {
        btn.bg.fillStyle(0x0a0011, 0.8);
        btn.bg.fillRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.bg.lineStyle(2, 0x664488);
        btn.bg.strokeRoundedRect(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 8);
        btn.txt.setColor('#665577');
      }
    });
  }

  _createHighScore() {
    const hs = parseInt(localStorage.getItem('mathslayer_highscore') || '0', 10);
    this.add.text(400, 328, 'BEST SCORE: ' + hs, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '15px',
      color: '#ffcc00'
    }).setOrigin(0.5, 0.5).setDepth(2);
  }

  _createStartButton() {
    const x = 400, y = 388, w = 210, h = 52;
    const bg  = this.add.graphics().setDepth(2);
    const txt = this.add.text(x, y, '\u25b6 START GAME', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(3);

    const drawBtn = (hovered) => {
      bg.clear();
      bg.fillStyle(hovered ? 0xcc66ff : 0xaa44ff);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
      bg.lineStyle(3, 0xffffff);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    };
    drawBtn(false);

    const zone = this.add.zone(x, y, w, h).setInteractive().setDepth(4);
    zone.on('pointerover', () => { drawBtn(true);  txt.setScale(1.04); });
    zone.on('pointerout',  () => { drawBtn(false); txt.setScale(1.0);  });
    zone.on('pointerdown', () => {
      this.scene.start('GameScene', {
        operations: this.selectedOps.slice(),
        difficulty: this.selectedDifficulty
      });
    });
  }
}
