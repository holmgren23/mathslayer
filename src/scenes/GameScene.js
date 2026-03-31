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
    this.isPaused       = false;
    this.currentTarget  = null;
    this.projectiles    = [];
    this.inputDisabled  = false;
    this.domInput       = null;
    this.questionPool   = [];
    this.bossActive     = false;
    this.bossHP         = 0;
    this.bossBar        = null;
    this.wrongAttempts      = 0;
    this.pauseOverlayObjects = [];

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
    this.events.on('bossTriggered',      this._onBossTriggered,      this);
    this.events.on('bossReachedPlayer',   this._onBossReachedPlayer,   this);

    // ── Player ─────────────────────────────────────────────────────────────
    this.player = SpriteManager.createPlayer(
      this, CONFIG.PLAYER_X, CONFIG.GROUND_Y - 38
    );
    this.player.setDepth(10);
    // Gentle idle float (compatible with player idle animation)
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
    this._setupPauseKey();
  }

  update(time, delta) {
    if (this.gameOver || this.isPaused) return;
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

  _createBossBar() {
    const barW = 300;
    const barH = 18;
    const bx   = CONFIG.GAME_WIDTH / 2 - barW / 2;
    const by   = 52;

    this.bossBar = { bx, by, barW, barH, hp: CONFIG.BOSS_HP };

    const bg = this.add.graphics().setDepth(22);
    bg.fillStyle(0x220033);
    bg.fillRoundedRect(bx, by, barW, barH, 6);
    bg.lineStyle(2, 0xff00ff);
    bg.strokeRoundedRect(bx, by, barW, barH, 6);
    this.bossBar.bg = bg;

    const label = this.add.text(CONFIG.GAME_WIDTH / 2, by + 9, 'BOSS', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '10px',
      color: '#ff44ff'
    }).setOrigin(0.5, 0.5).setDepth(23);
    this.bossBar.label = label;

    this.bossFill = this.add.graphics().setDepth(22);
    this.bossBar.fill = this.bossFill;
    this._drawBossFill(CONFIG.BOSS_HP);

    const labelHP = this.add.text(CONFIG.GAME_WIDTH / 2, by + barH + 10, 'HP: ' + CONFIG.BOSS_HP + '/' + CONFIG.BOSS_HP, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#ff88ff'
    }).setOrigin(0.5, 0).setDepth(23);
    this.bossBar.labelHP = labelHP;
  }

  _destroyBossBar() {
    if (!this.bossBar) return;
    ['bg', 'label', 'fill', 'labelHP'].forEach(key => {
      if (this.bossBar[key] && this.bossBar[key].active) this.bossBar[key].destroy();
    });
    this.bossFill = null;
    this.bossBar  = null;
  }

  _drawBossFill(hp) {
    this.bossFill.clear();
    if (hp <= 0) return;
    const ratio = hp / CONFIG.BOSS_HP;
    const fillW = this.bossBar.barW * ratio;
    this.bossFill.fillStyle(0xff0066);
    this.bossFill.fillRoundedRect(this.bossBar.bx + 2, this.bossBar.by + 2, fillW - 4, this.bossBar.barH - 4, 4);
  }

  _showBossAppeared(callback) {
    // Darken screen
    const overlay = this.add.graphics().setDepth(45);
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    this.tweens.add({
      targets: overlay,
      alpha: 0.4,
      duration: 600,
      onComplete: () => overlay.destroy()
    });

    // Flash "BOSS APPEARED!" text
    const text = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.PANEL_Y / 2, 'BOSS APPEARED!', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '36px',
      color: '#ff0066',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5).setDepth(50).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: text,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 300,
          delay: 600,
          onComplete: () => text.destroy()
        });
      }
    });

    if (callback) this.time.delayedCall(1200, callback);
  }

  _showBossDefeated() {
    // Explosion particles at boss position
    if (this.enemyManager.bossSlime) {
      this._emitKillParticles(this.enemyManager.bossSlime.x, this.enemyManager.bossSlime.y);
    }

    // "BOSS DEFEATED!" celebration
    const text = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.PANEL_Y / 2, 'BOSS DEFEATED!', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '32px',
      color: '#44ff88',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5).setDepth(50).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: text,
      alpha: 1,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          duration: 400,
          delay: 1000,
          onComplete: () => text.destroy()
        });
      }
    });

    // Score bonus pop
    this._showScorePop('+' + CONFIG.BOSS_SCORE_BONUS);
  }

  _onBossTriggered() {
    const variants = ['purple', 'red', 'grey'];
    this._bossVariant = variants[Math.floor(Math.random() * variants.length)];

    // Show warning and wait for all existing slimes to be cleared first
    this._showBossIncoming(() => {
      this.bossActive = true;
      this.bossHP     = CONFIG.BOSS_HP;
      this._createBossBar();

      this._showBossAppeared(() => {
        this.enemyManager.spawnBoss(this._bossVariant, () => this.mathEngine.generateBossQuestion());
        // Sync panel and state immediately after boss question is assigned
        this.wrongAttempts = 0;
        this._updateAttemptIndicator();
        this.inputDisabled = false;
        this._refreshQueueText();
        if (this.domInput && this.domInput.node) this.domInput.node.focus();
      });
    });
  }

  _showBossIncoming(onCleared) {
    const text = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.PANEL_Y / 2, 'BOSS INCOMING...', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5).setDepth(50).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: { from: 0.3, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const checkTimer = this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        if (this.enemyManager.getActiveSlimes().length === 0) {
          checkTimer.remove(false);
          this.tweens.killTweensOf(text);
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 200,
            onComplete: () => {
              text.destroy();
              if (typeof onCleared === 'function') onCleared();
            }
          });
        }
      }
    });
  }

  _onBossReachedPlayer() {
    if (this.gameOver) return;

    // Boss deals 2 HP damage
    this.hp = Math.max(0, this.hp - 2);
    this._updateHUD();

    // Big red flash
    const flash = this.add.graphics().setDepth(50);
    flash.fillStyle(0xff0000, 0.45);
    flash.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy()
    });
    this.cameras.main.shake(400, 0.012);

    if (this.anims.exists('player_hurt_anim')) {
      this.player.play('player_hurt_anim');
      this.player.once('animationcomplete', () => {
        if (!this.gameOver) this.player.play('player_idle_anim');
      });
    }

    if (this.hp <= 0) {
      this._triggerGameOver();
      return;
    }
  }

  _emitKillParticles(x, y) {
    try {
      const emitter = this.add.particles(x, y, 'projectile', {
        speed: { min: 60, max: 200 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        tint: [0xff0066, 0xffee00, 0xff44ff, 0xffffff],
        quantity: 20,
        emitting: false
      });
      emitter.explode(20, x, y);
      this.time.delayedCall(900, () => {
        if (emitter && emitter.active) emitter.destroy();
      });
    } catch (e) { /* particles unavailable */ }
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

    // Attempt indicator — top-right of question row
    this.attemptIndicator = this.add.text(CONFIG.GAME_WIDTH - 16, pY + 22, '● ●', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#44ff88'
    }).setOrigin(1, 0.5).setDepth(25);

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
    let items = [];
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

    // If boss is active, boss question takes first priority
    if (this.bossActive) {
      const boss = this.enemyManager.getBossSlime();
      if (boss && boss.getData('question')) {
        items.unshift(boss.getData('question'));
        items = items.slice(0, 3);
      }
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
    this.wrongAttempts = 0;
    this._updateAttemptIndicator();
    this._updateHUD();
    this.enemyManager.onCorrectAnswers(this.correctAnswers);
    this._showScorePop('+' + CONFIG.SCORE_PER_KILL);
    this._advanceQuestionDisplay();

    // Determine if a slime owns this question or it came from the pool
    const slimes      = this.enemyManager.getActiveSlimes().sort((a, b) => a.x - b.x);
    const slimeOwner  = slimes.find(s => s.getData('question') === currentQ);

    // Consume the question from wherever it lives
    if (slimeOwner) {
      slimeOwner.setData('question', null);
      this.inputDisabled  = true;
      this.currentTarget  = slimeOwner;
      this._fireProjectile(slimeOwner);
    } else if (this.bossActive) {
      // Boss takes damage — handled in projectile onComplete
      this.inputDisabled = true;
      const boss = this.enemyManager.getBossSlime();
      if (boss) {
        this.currentTarget = boss;
        this._fireProjectile(boss);
      } else {
        this.inputDisabled = false;
      }
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

        if (!target.active || !target.getData('alive')) {
          this.inputDisabled = false;
          this._refreshQueueText();
          return;
        }

        if (target.getData('isBoss')) {
          // Boss: deal 1 damage, update bar — only destroy when HP hits 0
          const bossDead = this.enemyManager.damageBoss();
          this.bossHP = this.enemyManager.bossSlime ? this.enemyManager.bossSlime.getData('hp') : 0;
          this._drawBossFill(this.bossHP);
          if (this.bossBar && this.bossBar.labelHP) {
            this.bossBar.labelHP.setText('HP: ' + Math.max(0, this.bossHP) + '/' + CONFIG.BOSS_HP);
          }
          if (bossDead) {
            this.score += CONFIG.BOSS_SCORE_BONUS;
            this._updateHUD();
            this._showBossDefeated();
            this.enemyManager.killBoss(() => {
              this._destroyBossBar();
              this.bossActive = false;
              this.bossHP = 0;
              this.inputDisabled = false;
              this._refreshQueueText();
            });
          } else {
            // Boss survives — assign a new unique question for the next hit
            const nextQ = this.mathEngine.generateBossQuestion();
            if (this.enemyManager.bossSlime) {
              this.enemyManager.bossSlime.setData('question', nextQ);
            }
            this.inputDisabled = false;
            this._refreshQueueText();
          }
        } else {
          // Regular slime
          this.enemyManager.killSlime(target, () => {
            this.inputDisabled = false;
            this._refreshQueueText();
          });
        }
      }
    });

    // Player attack animation
    if (this.anims.exists('player_attack_anim')) {
      this.player.play('player_attack_anim');
      this.player.once('animationcomplete', () => {
        if (!this.gameOver) this.player.play('player_idle_anim');
      });
    }
  }

  _wrongAnswerFeedback() {
    const el = this.domInput && this.domInput.node;
    if (!el) return;
    el.value = '';

    this.wrongAttempts++;

    if (this.wrongAttempts === 1) {
      // First wrong: shake + flash red, show warning, update indicator
      el.style.borderColor     = '#ff8800';
      el.style.backgroundColor = '#330011';
      let step = 0;
      this.time.addEvent({
        delay: 55, repeat: 7,
        callback: () => {
          step++;
          el.style.marginLeft = step % 2 === 0 ? '6px' : '-6px';
          if (step >= 8) {
            el.style.marginLeft      = '0px';
            el.style.borderColor     = '#ff8800';
            el.style.backgroundColor = '#1a0033';
          }
        }
      });

      this._updateAttemptIndicator();

      const warn = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.PANEL_Y + 42,
        '⚠ 1 ATTEMPT REMAINING!', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '11px',
          color: '#ff8800'
        }).setOrigin(0.5, 0.5).setDepth(28).setAlpha(0);
      this.tweens.add({
        targets: warn, alpha: 1, duration: 200,
        onComplete: () => {
          this.tweens.add({
            targets: warn, alpha: 0, duration: 300, delay: 1500,
            onComplete: () => warn.destroy()
          });
        }
      });

    } else {
      // Second wrong: lose 1 HP, hurt animation, screen flash, reset counter
      this.wrongAttempts = 0;
      this._updateAttemptIndicator();

      el.style.borderColor     = '#ff0000';
      el.style.backgroundColor = '#440000';
      let step = 0;
      this.time.addEvent({
        delay: 55, repeat: 7,
        callback: () => {
          step++;
          el.style.marginLeft = step % 2 === 0 ? '8px' : '-8px';
          if (step >= 8) {
            el.style.marginLeft      = '0px';
            el.style.borderColor     = '#aa44ff';
            el.style.backgroundColor = '#1a0033';
          }
        }
      });

      this.hp = Math.max(0, this.hp - 1);
      this._updateHUD();

      const flash = this.add.graphics().setDepth(50);
      flash.fillStyle(0xff0000, 0.40);
      flash.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
      this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
      this.cameras.main.shake(200, 0.009);

      if (this.anims.exists('player_hurt_anim')) {
        this.player.play('player_hurt_anim');
        this.player.once('animationcomplete', () => {
          if (!this.gameOver) this.player.play('player_idle_anim');
        });
      }

      if (this.hp <= 0) this._triggerGameOver();
    }
  }

  _updateAttemptIndicator() {
    if (!this.attemptIndicator) return;
    if (this.wrongAttempts === 0) {
      this.attemptIndicator.setText('● ●').setColor('#44ff88');
    } else {
      this.attemptIndicator.setText('● ○').setColor('#ff8800');
    }
  }

  _onSlimeReachedPlayer() {
    if (this.gameOver) return;
    // Don't damage player if boss is currently on screen (boss has separate handling)
    if (this.enemyManager.getBossSlime()) return;

    this.wrongAttempts = 0;
    this._updateAttemptIndicator();
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

    // Player hurt animation
    if (this.anims.exists('player_hurt_anim')) {
      this.player.play('player_hurt_anim');
      this.player.once('animationcomplete', () => {
        if (!this.gameOver) this.player.play('player_idle_anim');
      });
    }

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

  // ── Pause ────────────────────────────────────────────────────────────────────

  _setupPauseKey() {
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => {
      if (this.gameOver) return;
      if (this.isPaused) this._resumeGame();
      else this._pauseGame();
    });
  }

  _pauseGame() {
    if (this.isPaused || this.gameOver) return;
    this.isPaused = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    this._createPauseOverlay();
  }

  _resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this._destroyPauseOverlay();
    if (this.domInput && this.domInput.node) this.domInput.node.focus();
  }

  _createPauseOverlay() {
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;

    const overlay = this.add.graphics().setDepth(80);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, W, H);

    const title = this.add.text(W / 2, H / 2 - 75, 'PAUSED', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '44px',
      color: '#ffffff',
      stroke: '#aa44ff',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5).setDepth(82);

    const hint = this.add.text(W / 2, H / 2 + 118, 'Press ESC to resume', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '13px',
      color: '#887799'
    }).setOrigin(0.5, 0.5).setDepth(82);

    const resumeObjs = this._makePauseButton(W / 2, H / 2 - 10, 'RESUME', () => this._resumeGame());
    const menuObjs   = this._makePauseButton(W / 2, H / 2 + 54, 'MAIN MENU', () => {
      this._resumeGame();
      if (this.domInput) this.domInput.destroy();
      this.scene.start('MenuScene');
    });

    this.pauseOverlayObjects = [overlay, title, hint, ...resumeObjs, ...menuObjs];
  }

  _makePauseButton(x, y, label, onClick) {
    const w = 190, h = 46;
    const bg  = this.add.graphics().setDepth(82);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(84);

    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(0x330055);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(2, 0xaa44ff);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x550088);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(2, 0xdd88ff);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    };

    drawNormal();
    const zone = this.add.zone(x, y, w, h).setInteractive().setDepth(85);
    zone.on('pointerover', drawHover);
    zone.on('pointerout',  drawNormal);
    zone.on('pointerdown', onClick);

    return [bg, txt, zone];
  }

  _destroyPauseOverlay() {
    this.pauseOverlayObjects.forEach(obj => { if (obj && obj.active) obj.destroy(); });
    this.pauseOverlayObjects = [];
  }

  shutdown() {
    this.events.off('slimeReachedPlayer', this._onSlimeReachedPlayer, this);
    this.events.off('bossTriggered',      this._onBossTriggered,      this);
    this.events.off('bossReachedPlayer',   this._onBossReachedPlayer,   this);
    if (this.escKey) this.escKey.removeAllListeners();
    if (this.domInput) this.domInput.destroy();
    this.projectiles.forEach(p => { if (p && p.active) p.destroy(); });
    this.projectiles = [];
  }
}
