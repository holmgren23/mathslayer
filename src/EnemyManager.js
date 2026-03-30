class EnemyManager {
  // getQuestion: () => {question,answer,choices,operation} — called on each spawn
  constructor(scene, getQuestion) {
    this.scene       = scene;
    this.getQuestion = getQuestion || (() => ({ question:'?', answer:0, choices:[0,1,2,3], operation:'+' }));
    this.activeSlimes = [];
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

    const question = this.getQuestion();
    const op       = question ? question.operation : '+';
    const x        = CONFIG.GAME_WIDTH + 50;
    const y        = CONFIG.GROUND_Y - 32;   // 32 = half of 64px display height
    const slime    = SpriteManager.createSlime(this.scene, x, y, op);

    slime.setData('alive',     true);
    slime.setData('question',  question);  // full question object bound to this slime
    slime.setData('operation', op);
    slime.setDepth(10);

    // Gentle idle bob tween
    this.scene.tweens.add({
      targets: slime,
      y: y + 6,
      duration: 620,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    this.activeSlimes.push(slime);
  }

  update(time, delta) {
    const moveAmount = this.currentSpeed * (delta / 1000);

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
  }

  getActiveSlimes() {
    return this.activeSlimes.filter(s => s && s.active && s.getData('alive'));
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

  onCorrectAnswers(totalCorrect) {
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
    this.activeSlimes          = [];
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
