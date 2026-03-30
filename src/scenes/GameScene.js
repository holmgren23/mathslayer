class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.selectedOps        = (data && data.operations) ? data.operations : ['+'];
    this.selectedDifficulty = (data && data.difficulty) ? data.difficulty : 'easy';
  }

  preload() {
    SpriteManager.preload(this);
  }

  create() {
    // ── State ───────────────────────────────────────────────────────────────
    this.hp             = CONFIG.PLAYER_HP;
    this.score          = 0;
    this.correctAnswers = 0;
    this.gameOver       = false;
    this.currentTarget  = null;
    this.projectiles    = [];
    this.inputDisabled  = false;
    this.domInput       = null;
    this.questionPool   = [];

    SpriteManager.createAnimations(this);

    // ── Background ─────────────────────────────────────────────────────────
    const bgImg = this.add.image(CONFIG.GAME_WIDTH / 2, CONFIG.PANEL_Y / 2, 'background');
    bgImg.setDisplaySize(CONFIG.GAME_WIDTH, CONFIG.PANEL_Y).setDepth(0);

    // ── Math engine & question pool ────────────────────────────────────────
    this.mathEngine   = new MathEngine(this.selectedOps, this.selectedDifficulty);
    this.questionPool = this.mathEngine.generateBatch(12);

    // ── Enemies ────────────────────────────────────────────────────────────
    // Each slime gets its own question from the pool at spawn time.
    // The slime's color reflects its question's operation.
    this.enemyManager = new EnemyManager(this, () => this._getNextSlimeQuestion());
    this.events.on('slimeReachedPlayer', this._onSlimeReachedPlayer, this);

    // ── Player ─────────────────────────────────────────────────────────────
    this.player = SpriteManager.createPlayer(
      this, CONFIG.PLAYER_X, CONFIG.GROUND_Y - 38
    );
    this.player.setDepth(10);
    // Gentle idle float
    this.tweens.add({
      targets: this.player,
      y: CONFIG.GROUND_Y - 46,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── HUD ────────────────────────────────────────────────────────────────
    this._createHUD();

    // ── Math panel ─────────────────────────────────────────────────────────
    this._createMathPanel();

    // ── Initial question display ───────────────────────────────────────────
    this._refreshQueueText();
    this.time.delayedCall(120, () => {
      if (this.domInput && this.domInput.node && !this.gameOver) {
        this.domInput.node.focus();
      }
    });

    SpriteManager.checkAndShowErrors(this);
  }

  update(time, delta) {
    if (this.gameOver) return;
    this.enemyManager.update(time, delta);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────

  _createHUD() {
    const hudBg = this.add.graphics().setDepth(20);
    hudBg.fillStyle(0x000011, 0.80);
    hudBg.fillRect(0, 0, CONFIG.GAME_WIDTH, 46);

    this.heartSprites = [];
    for (let i = 0; i < CONFIG.PLAYER_HP; i++) {
      const h = SpriteManager.createHeart(this, 22 + i * 28, 23);
      h.setDepth(25);
      this.heartSprites.push(h);
    }

    this.scoreText = this.add.text(CONFIG.GAME_WIDTH - 10, 6, 'SCORE: 0', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '15px',
      color: '#ffcc00'
    }).setOrigin(1, 0).setDepth(25);

    this.correctText = this.add.text(CONFIG.GAME_WIDTH - 10, 27, '\u2713 0', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#44ff88'
    }).setOrigin(1, 0).setDepth(25);

    this.waveText = this.add.text(CONFIG.GAME_WIDTH / 2, 6, 'WAVE 1', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#ccaaff'
    }).setOrigin(0.5, 0).setDepth(25);
  }

  _updateHUD() {
    this.heartSprites.forEach((h, i) => {
      h.setTexture(i < this.hp ? 'heart' : 'heart_empty');
    });
    this.scoreText.setText('SCORE: ' + this.score);
    this.correctText.setText('\u2713 ' + this.correctAnswers);
    const wave = Math.floor(this.correctAnswers / CONFIG.SLIMES_SCALE_THRESHOLD) + 1;
    this.waveText.setText('WAVE ' + wave);
  }

  // ── Math panel ───────────────────────────────────────────────────────────────

  _createMathPanel() {
    const pY = CONFIG.PANEL_Y;       // 350
    const pH = CONFIG.PANEL_HEIGHT;  // 150

    // Panel background
    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(0x110022, 0.96);
    panel.fillRect(0, pY, CONFIG.GAME_WIDTH, pH);
    panel.lineStyle(2, 0xaa44ff);
    panel.strokeRect(0, pY, CONFIG.GAME_WIDTH, pH);

    // ── Question queue (top section of panel) ───────────────────────────────
    // CURRENT question — large, centered
    this.qCurrent = this.add.text(CONFIG.GAME_WIDTH / 2, pY + 22, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#110022',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5).setDepth(25);

    // NEXT — left side, smaller
    this.qNextLabel = this.add.text(16, pY + 53, 'Next:', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '12px',
      color: '#aa88cc'
    }).setOrigin(0, 0.5).setDepth(25).setAlpha(0.85);

    this.qNext = this.add.text(68, pY + 53, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#ccaaff'
    }).setOrigin(0, 0.5).setDepth(25).setAlpha(0.75);

    // SOON — right side, smaller still
    this.qSoonLabel = this.add.text(430, pY + 53, 'Soon:', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '11px',
      color: '#776699'
    }).setOrigin(0, 0.5).setDepth(25).setAlpha(0.6);

    this.qSoon = this.add.text(484, pY + 53, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#998aaa'
    }).setOrigin(0, 0.5).setDepth(25).setAlpha(0.5);

    // Divider line
    const div = this.add.graphics().setDepth(22);
    div.lineStyle(1, 0x442266, 0.8);
    div.lineBetween(10, pY + 68, CONFIG.GAME_WIDTH - 10, pY + 68);

    // ── Answer section (bottom of panel) ────────────────────────────────────
    const answerY = pY + 110;  // vertical center of answer row

    // "ANSWER:" label
    this.add.text(45, answerY, 'ANSWER:', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '13px',
      color: '#ccaaff'
    }).setOrigin(0.5, 0.5).setDepth(25);

    // DOM text input
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.placeholder = 'Type here\u2026';
    inputEl.setAttribute('autocomplete', 'off');
    inputEl.setAttribute('inputmode', 'numeric');
    inputEl.style.cssText = [
      'background:#1a0033',
      'border:2px solid #aa44ff',
      'border-radius:8px',
      'color:#ffffff',
      'font-family:Orbitron,sans-serif',
      'font-size:17px',
      'padding:7px 10px',
      'width:168px',
      'text-align:center',
      'outline:none'
    ].join(';');

    this.domInput = this.add.dom(170, answerY, inputEl).setDepth(30);

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.inputDisabled && !this.gameOver) {
        const val = parseInt(inputEl.value, 10);
        inputEl.value = '';
        this._handleAnswer(val);
      }
    });

    // 4 multiple-choice buttons
    this.choiceButtons = [];
    const btnW = 80, btnH = 36;
    const btnPositions = [328, 416, 504, 592];
    btnPositions.forEach(bx => {
      this.choiceButtons.push(this._makeChoiceButton(bx, answerY, btnW, btnH));
    });
  }

  _makeChoiceButton(x, y, w, h) {
    const bg  = this.add.graphics().setDepth(22);
    const txt = this.add.text(x, y, '?', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(26);

    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(0x220044);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, 7);
      bg.lineStyle(2, 0xaa44ff);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 7);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x440077);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, 7);
      bg.lineStyle(2, 0xdd88ff);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 7);
    };

    drawNormal();

    const zone = this.add.zone(x, y, w, h).setInteractive().setDepth(27);
    zone.on('pointerover', drawHover);
    zone.on('pointerout',  drawNormal);
    zone.on('pointerdown', () => {
      if (!this.inputDisabled && !this.gameOver) {
        const val = parseInt(txt.text, 10);
        if (!isNaN(val)) this._handleAnswer(val);
      }
    });

    return { bg, txt, zone, drawNormal };
  }

  // ── Question queue ───────────────────────────────────────────────────────────

  // Called by EnemyManager when a slime spawns — pops from pool, binds to slime
  _getNextSlimeQuestion() {
    this._refillPool();
    return this.questionPool.shift();
  }

  _refillPool() {
    if (this.questionPool.length < 5) {
      const needed = 12 - this.questionPool.length;
      const batch  = this.mathEngine.generateBatch(needed);
      this.questionPool.push(...batch);
    }
  }

  // Returns the 3 display items: first from active slimes (sorted by proximity),
  // then padded from the pool for the "upcoming" slots.
  _getDisplayQueue() {
    const items = [];
    const slimes = this.enemyManager.getActiveSlimes()
      .filter(s => s.getData('question'))
      .sort((a, b) => a.x - b.x);

    slimes.forEach(s => {
      const q = s.getData('question');
      if (q) items.push(q);
    });

    // Pad with pool questions
    for (let i = 0; items.length < 3 && i < this.questionPool.length; i++) {
      items.push(this.questionPool[i]);
    }

    return items;
  }

  _refreshQueueText() {
    const items = this._getDisplayQueue();
    const q0 = items[0];
    const q1 = items[1];
    const q2 = items[2];

    this.qCurrent.setText(q0 ? q0.question : 'Get ready\u2026');

    this.qNext.setText(q1 ? q1.question : '');
    this.qSoon.setText(q2 ? q2.question : '');

    // Update choice buttons
    if (q0) {
      q0.choices.forEach((c, i) => {
        if (this.choiceButtons[i]) this.choiceButtons[i].txt.setText(String(c));
      });
    } else {
      this.choiceButtons.forEach(btn => btn.txt.setText('?'));
    }
  }

  _advanceQuestionDisplay() {
    const pY = CONFIG.PANEL_Y;

    // Slide current question up and fade out
    this.tweens.add({
      targets: this.qCurrent,
      y:       pY + 8,
      alpha:   0,
      duration: 175,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.qCurrent.y = pY + 22;     // reset position
        this._refreshQueueText();       // update content
        this.tweens.add({
          targets: this.qCurrent,
          alpha: 1,
          duration: 160,
          ease: 'Cubic.easeOut'
        });
      }
    });

    // Briefly flash the preview rows during transition
    this.tweens.add({
      targets: [this.qNext, this.qNextLabel, this.qSoon, this.qSoonLabel],
      alpha:   0.1,
      duration: 140,
      ease: 'Power1',
      yoyo: true,
      onComplete: () => {
        this.qNextLabel.setAlpha(0.85);
        this.qNext.setAlpha(0.75);
        this.qSoonLabel.setAlpha(0.60);
        this.qSoon.setAlpha(0.50);
      }
    });
  }

  // ── Gameplay ─────────────────────────────────────────────────────────────────

  _handleAnswer(value) {
    if (this.inputDisabled || this.gameOver) return;
    if (isNaN(value)) return;

    const displayItems = this._getDisplayQueue();
    const currentQ = displayItems[0];
    if (!currentQ) return;

    if (parseInt(value, 10) !== currentQ.answer) {
      this._wrongAnswerFeedback();
      return;
    }

    // ── Correct answer ──────────────────────────────────────────────────────
    this.correctAnswers++;
    this.score += CONFIG.SCORE_PER_KILL;
    this._updateHUD();
    this.enemyManager.onCorrectAnswers(this.correctAnswers);
    this._showScorePop('+' + CONFIG.SCORE_PER_KILL);
    this._advanceQuestionDisplay();

    // Determine if a slime owns this question or it came from the pool
    const slimes      = this.enemyManager.getActiveSlimes().sort((a, b) => a.x - b.x);
    const slimeOwner  = slimes.find(s => s.getData('question') === currentQ);

    // Consume the question from wherever it lives
    if (slimeOwner) {
      // Slime carries this question — kill the slime
      this.inputDisabled  = true;
      this.currentTarget  = slimeOwner;
      this._fireProjectile(slimeOwner);
    } else {
      // Pool question (warm-up, before slimes or between slimes)
      const idx = this.questionPool.indexOf(currentQ);
      if (idx !== -1) this.questionPool.splice(idx, 1);
      this._refillPool();

      // If there happens to be a slime on screen, fire at it too (bonus kill)
      if (slimes.length > 0) {
        this.inputDisabled = true;
        this.currentTarget = slimes[0];
        this._fireProjectile(slimes[0]);
      }
      // No slimes: just advance display, leave inputDisabled false
    }
  }

  _fireProjectile(target) {
    const proj = SpriteManager.createProjectile(this, this.player.x + 30, this.player.y);
    proj.setDepth(15);
    this.projectiles.push(proj);

    const dist     = Math.max(10, target.x - this.player.x);
    const duration = Math.max(80, (dist / CONFIG.PROJECTILE_SPEED) * 1000);

    this.tweens.add({
      targets: proj,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.projectiles = this.projectiles.filter(p => p !== proj);
        if (proj.active) proj.destroy();

        if (target.active && target.getData('alive')) {
          this.enemyManager.killSlime(target, () => {
            this.inputDisabled = false;
          });
        } else {
          this.inputDisabled = false;
        }
      }
    });

    // Player attack squash
    this.tweens.add({
      targets: this.player,
      scaleX: 1.15,
      scaleY: 0.88,
      duration: 90,
      yoyo: true
    });
  }

  _wrongAnswerFeedback() {
    const el = this.domInput && this.domInput.node;
    if (!el) return;
    el.value = '';
    el.style.borderColor     = '#ff4444';
    el.style.backgroundColor = '#330011';

    let step = 0;
    this.time.addEvent({
      delay: 55,
      repeat: 7,
      callback: () => {
        step++;
        el.style.marginLeft = step % 2 === 0 ? '6px' : '-6px';
        if (step >= 8) {
          el.style.marginLeft      = '0px';
          el.style.borderColor     = '#aa44ff';
          el.style.backgroundColor = '#1a0033';
        }
      }
    });
  }

  _onSlimeReachedPlayer() {
    if (this.gameOver) return;

    this.hp = Math.max(0, this.hp - 1);
    this._updateHUD();

    // Red flash overlay
    const flash = this.add.graphics().setDepth(50);
    flash.fillStyle(0xff0000, 0.30);
    flash.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy()
    });
    this.cameras.main.shake(260, 0.008);

    if (this.hp <= 0) {
      this._triggerGameOver();
      return;
    }

    // Input stays enabled — queue continues uninterrupted
    this.inputDisabled = false;
  }

  _showScorePop(text) {
    const pop = this.add.text(this.player.x + 60, this.player.y - 20, text, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '22px',
      color: '#44ff88',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(30).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: pop,
      y:     pop.y - 65,
      alpha: 0,
      duration: 920,
      ease: 'Cubic.easeOut',
      onComplete: () => pop.destroy()
    });
  }

  _triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;

    localStorage.setItem('mathslayer_last_ops',  JSON.stringify(this.selectedOps));
    localStorage.setItem('mathslayer_last_diff', this.selectedDifficulty);

    const prevHS = parseInt(localStorage.getItem('mathslayer_highscore') || '0', 10);

    this.time.delayedCall(900, () => {
      if (this.domInput && this.domInput.node) this.domInput.node.blur();
      this.scene.start('GameOverScene', {
        score:          this.score,
        correctAnswers: this.correctAnswers,
        wave:           Math.floor(this.correctAnswers / CONFIG.SLIMES_SCALE_THRESHOLD) + 1,
        highScore:      Math.max(this.score, prevHS)
      });
    });
  }

  shutdown() {
    this.events.off('slimeReachedPlayer', this._onSlimeReachedPlayer, this);
    if (this.domInput) this.domInput.destroy();
    this.projectiles.forEach(p => { if (p && p.active) p.destroy(); });
    this.projectiles = [];
  }
}
