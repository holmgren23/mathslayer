class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore     = data.score          || 0;
    this.finalCorrect   = data.correctAnswers || 0;
    this.finalWave      = data.wave           || 1;

    const prevHS = parseInt(localStorage.getItem('mathslayer_highscore') || '0', 10);
    this.isNewHighScore = this.finalScore > prevHS;
    this.finalHighScore = Math.max(this.finalScore, prevHS);
    localStorage.setItem('mathslayer_highscore', this.finalHighScore);
  }

  create() {
    this._drawBackground();
    this._createTitle();
    this._createStatsPanel();
    this._createButtons();
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a3e);
    bg.fillRect(0, 0, CONFIG.GAME_WIDTH, 300);
    bg.fillStyle(0x0d0d1a);
    bg.fillRect(0, 300, CONFIG.GAME_WIDTH, 200);

    for (let i = 0; i < 50; i++) {
      bg.fillStyle(0xffffff, Math.random() * 0.4 + 0.1);
      bg.fillCircle(Math.random() * CONFIG.GAME_WIDTH, Math.random() * 260, Math.random() * 1.5 + 0.3);
    }
  }

  _createTitle() {
    // Shadow
    this.add.text(403, 98, 'GAME OVER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '52px',
      color: '#550000',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5, 0.5);

    const title = this.add.text(400, 95, 'GAME OVER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '52px',
      color: '#ff4444',
      stroke: '#220000',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5);

    // Entry shake
    let step = 0;
    this.time.addEvent({
      delay: 55,
      repeat: 9,
      callback: () => {
        step++;
        title.x = 400 + (step % 2 === 0 ? 4 : -4);
        if (step >= 10) title.x = 400;
      }
    });
  }

  _createStatsPanel() {
    const px = 170, py = 158, pw = 460, ph = 200;
    const cx = CONFIG.GAME_WIDTH / 2;

    if (this.isNewHighScore) {
      const newHS = this.add.text(cx, py - 16, '\u2605 NEW HIGH SCORE! \u2605', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '15px',
        color: '#ffcc00'
      }).setOrigin(0.5, 0.5);
      this.tweens.add({ targets: newHS, alpha: { from: 0.4, to: 1.0 }, duration: 550, repeat: -1, yoyo: true });
    }

    const panel = this.add.graphics();
    panel.fillStyle(0x110022, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(2, 0xaa44ff);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    this.add.text(cx, py + 38, 'SCORE: ' + this.finalScore, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      color: '#ffcc00'
    }).setOrigin(0.5, 0.5);

    this.add.text(cx, py + 80, 'BEST: ' + this.finalHighScore, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: this.isNewHighScore ? '#44ff88' : '#ccaaff'
    }).setOrigin(0.5, 0.5);

    this.add.text(cx, py + 116, 'CORRECT ANSWERS: ' + this.finalCorrect, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '17px',
      color: '#ccaaff'
    }).setOrigin(0.5, 0.5);

    this.add.text(cx, py + 153, 'WAVES SURVIVED: ' + this.finalWave, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '17px',
      color: '#ccaaff'
    }).setOrigin(0.5, 0.5);
  }

  _createButtons() {
    this._makeButton(265, 420, 185, 48, 'PLAY AGAIN', 0xaa44ff, () => {
      const ops  = JSON.parse(localStorage.getItem('mathslayer_last_ops')  || '["+"]');
      const diff = localStorage.getItem('mathslayer_last_diff') || 'easy';
      this.scene.start('GameScene', { operations: ops, difficulty: diff });
    });

    this._makeButton(535, 420, 185, 48, 'MAIN MENU', 0x334466, () => {
      this.scene.start('MenuScene');
    });
  }

  _makeButton(x, y, w, h, label, bgColor, callback) {
    const bg = this.add.graphics();
    bg.fillStyle(bgColor);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    bg.lineStyle(2, 0xffffff);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    const txt = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    const zone = this.add.zone(x, y, w, h).setInteractive();
    zone.on('pointerover', () => bg.setAlpha(0.75));
    zone.on('pointerout',  () => bg.setAlpha(1.0));
    zone.on('pointerdown', callback);
  }
}
