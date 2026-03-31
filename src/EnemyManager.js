class EnemyManager {
  // getQuestion: () => {question,answer,choices,operation} — called on each spawn
  constructor(scene, getQuestion) {
    this.scene       = scene;
    this.getQuestion = getQuestion || (() => ({ question:'?', answer:0, choices:[0,1,2,3], operation:'+' }));
    this.getBossQuestion = () => null;
    this.activeSlimes    = [];
    this.bossSlime       = null;
    this.bossSpawned     = false;
    this.currentSpeed          = CONFIG.SLIME_BASE_SPEED;
    this.maxSimultaneousSlimes = CONFIG.MAX_SLIMES_START;
    this.spawnInterval         = CONFIG.SPAWN_INTERVAL_BASE;

    this._setupSpawnTimer();
    this._setupSpeedTimer();
  }

  _setupSpawnTimer() {
    if (this._spawnTimer) this._spawnTimer.remove(false);
    this._spawnTimer = this.scene.time.addEvent({
      delay: this.spawnInterval,
      callback: this._spawnSlime,
      callbackScope: this,
      loop: true
    });
  }

  _setupSpeedTimer() {
    if (this._speedTimer) this._speedTimer.remove(false);
    this._speedTimer = this.scene.time.addEvent({
      delay: CONFIG.SLIME_SPEED_INCREMENT_INTERVAL,
      callback: this._incrementSpeed,
      callbackScope: this,
      loop: true
    });
  }

  _incrementSpeed() {
    this.currentSpeed = Math.min(
      this.currentSpeed + CONFIG.SLIME_SPEED_INCREMENT,
      CONFIG.SLIME_SPEED_MAX
    );
  }

  _spawnSlime() {
    if (this.activeSlimes.length >= this.maxSimultaneousSlimes) return;
    if (this.bossSpawned) return; // pause regular spawns once boss is triggered (including entrance delay)

    const question = this.getQuestion();
    const op       = question ? question.operation : '+';
    const x        = CONFIG.GAME_WIDTH + 50;
    const y        = CONFIG.GROUND_Y - 32;
    const wave     = Math.floor(this.scene.correctAnswers / CONFIG.SLIMES_SCALE_THRESHOLD) + 1;
    const slime    = SpriteManager.createSlime(this.scene, x, y, op, wave);

    slime.setData('alive',     true);
    slime.setData('question',  question);
    slime.setData('operation', op);
    slime.setData('wave',      wave);
    slime.setDepth(10);

    this.activeSlimes.push(slime);
  }

  spawnBoss(variant, getBossQuestion) {
    if (this.bossSlime && this.bossSlime.getData('alive')) return;

    const question = getBossQuestion ? getBossQuestion() : null;
    const x        = CONFIG.GAME_WIDTH + 100;
    const y        = CONFIG.GROUND_Y - 32;
    const boss     = SpriteManager.createBossSlime(this.scene, x, y, variant);

    // Fade in as boss walks on from the right edge naturally
    boss.x = CONFIG.GAME_WIDTH + 120;
    boss.alpha = 0;
    this.scene.tweens.add({
      targets: boss,
      alpha: 1,
      duration: 600,
      ease: 'Cubic.easeOut'
    });

    boss.setData('alive',    true);
    boss.setData('question', question);
    boss.setData('isBoss',   true);
    boss.setData('hp',       CONFIG.BOSS_HP);
    boss.setDepth(12);

    this.bossSlime = boss;
  }

  damageBoss() {
    if (!this.bossSlime || !this.bossSlime.getData('alive')) return false;
    const hp = this.bossSlime.getData('hp') - 1;
    this.bossSlime.setData('hp', hp);
    return hp <= 0;
  }

  killBoss(onComplete) {
    if (!this.bossSlime || !this.bossSlime.active) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    this.scene.tweens.killTweensOf(this.bossSlime);
    this.scene.tweens.add({
      targets: this.bossSlime,
      scaleX: 3.2,
      scaleY: 3.2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.scene._emitKillParticles(this.bossSlime.x, this.bossSlime.y);
        if (this.bossSlime && this.bossSlime.active) this.bossSlime.destroy();
        this.bossSlime   = null;
        this.bossSpawned = false; // allow next boss trigger after defeat
        if (typeof onComplete === 'function') onComplete();
      }
    });
  }

  update(time, delta) {
    const moveAmount = this.currentSpeed * (delta / 1000);

    // Update regular slimes
    for (let i = this.activeSlimes.length - 1; i >= 0; i--) {
      const slime = this.activeSlimes[i];
      if (!slime || !slime.active) {
        this.activeSlimes.splice(i, 1);
        continue;
      }
      slime.x -= moveAmount;

      if (slime.x < CONFIG.PLAYER_X + 35 && slime.getData('alive')) {
        this._onSlimeReachedPlayer(slime);
      }
    }

    // Update boss (moves very slowly)
    if (this.bossSlime && this.bossSlime.active && this.bossSlime.getData('alive')) {
      const bossSpeed = CONFIG.BOSS_SPEED * (delta / 1000);
      this.bossSlime.x -= bossSpeed;

      if (this.bossSlime.x < CONFIG.PLAYER_X + 35) {
        this._onBossReachedPlayer();
      }
    }
  }

  getActiveSlimes() {
    return this.activeSlimes.filter(s => s && s.active && s.getData('alive'));
  }

  getBossSlime() {
    return this.bossSlime && this.bossSlime.active && this.bossSlime.getData('alive') ? this.bossSlime : null;
  }

  getSlimeCount() { return this.activeSlimes.length; }

  killSlime(slime, onComplete) {
    if (!slime || !slime.active || !slime.getData('alive')) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    slime.setData('alive', false);
    const idx = this.activeSlimes.indexOf(slime);
    if (idx !== -1) this.activeSlimes.splice(idx, 1);

    this.scene.tweens.killTweensOf(slime);

    this.scene.tweens.add({
      targets: slime,
      scaleX: 2.8,
      scaleY: 2.8,
      alpha: 0,
      duration: 320,
      ease: 'Power2',
      onComplete: () => {
        this._emitKillParticles(slime.x, slime.y);
        if (slime.active) slime.destroy();
        if (typeof onComplete === 'function') onComplete();
      }
    });
  }

  _emitKillParticles(x, y) {
    try {
      const emitter = this.scene.add.particles(x, y, 'projectile', {
        speed: { min: 60, max: 150 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 580,
        tint: [0x44cc44, 0xffee00, 0x88ff44, 0xffffff],
        quantity: 12,
        emitting: false
      });
      emitter.explode(12, x, y);
      this.scene.time.delayedCall(700, () => {
        if (emitter && emitter.active) emitter.destroy();
      });
    } catch (e) { /* particles unavailable */ }
  }

  _onSlimeReachedPlayer(slime) {
    slime.setData('alive', false);
    const idx = this.activeSlimes.indexOf(slime);
    if (idx !== -1) this.activeSlimes.splice(idx, 1);

    this.scene.events.emit('slimeReachedPlayer', slime);

    this.scene.tweens.killTweensOf(slime);
    if (slime.active) slime.destroy();
  }

  _onBossReachedPlayer() {
    if (!this.bossSlime || !this.bossSlime.getData('alive')) return;
    this.scene.events.emit('bossReachedPlayer', this.bossSlime);
  }

  onCorrectAnswers(totalCorrect) {
    // Check for boss trigger
    if (totalCorrect > 0 && totalCorrect % CONFIG.BOSS_TRIGGER === 0 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.scene.events.emit('bossTriggered');
      return;
    }

    this.maxSimultaneousSlimes = Math.min(
      CONFIG.MAX_SLIMES_START + Math.floor(totalCorrect / CONFIG.SLIMES_SCALE_THRESHOLD),
      CONFIG.MAX_SLIMES_CAP
    );

    const newInterval = Math.max(
      CONFIG.SPAWN_INTERVAL_BASE - totalCorrect * 40,
      CONFIG.SPAWN_INTERVAL_MIN
    );
    if (newInterval !== this.spawnInterval) {
      this.spawnInterval = newInterval;
      this._setupSpawnTimer();
    }
  }

  reset() {
    for (let i = this.activeSlimes.length - 1; i >= 0; i--) {
      const s = this.activeSlimes[i];
      if (s && s.active) { this.scene.tweens.killTweensOf(s); s.destroy(); }
    }
    if (this.bossSlime && this.bossSlime.active) {
      this.scene.tweens.killTweensOf(this.bossSlime);
      this.bossSlime.destroy();
    }
    this.activeSlimes    = [];
    this.bossSlime       = null;
    this.bossSpawned     = false;
    this.currentSpeed          = CONFIG.SLIME_BASE_SPEED;
    this.maxSimultaneousSlimes = CONFIG.MAX_SLIMES_START;
    this.spawnInterval         = CONFIG.SPAWN_INTERVAL_BASE;

    if (this._spawnTimer) this._spawnTimer.remove(false);
    if (this._speedTimer) this._speedTimer.remove(false);

    this._setupSpawnTimer();
    this._setupSpeedTimer();
  }

  getCurrentSpeed()    { return this.currentSpeed; }
  getCurrentMaxSlimes(){ return this.maxSimultaneousSlimes; }
}
