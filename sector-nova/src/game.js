// ============================================================
// SECTOR NOVA - Game Logic & State Machine
// ============================================================

/**
 * Scrolling star background with parallax layers
 */
class StarField {
  constructor() {
    this.layers = [];
    // 3 layers: far (slow, dim), mid, near (fast, bright)
    const configs = [
      { count: 40, speed: 0.3, minSize: 0.5, maxSize: 1, color: COLORS.STAR_DIM },
      { count: 25, speed: 0.8, minSize: 0.8, maxSize: 1.5, color: COLORS.STAR_BRIGHT },
      { count: 15, speed: 1.5, minSize: 1, maxSize: 2, color: COLORS.STAR_WHITE },
    ];
    for (const cfg of configs) {
      const stars = [];
      for (let i = 0; i < cfg.count; i++) {
        stars.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          size: randFloat(cfg.minSize, cfg.maxSize),
          speed: cfg.speed + randFloat(-0.1, 0.1),
          twinkle: Math.random() * Math.PI * 2,
        });
      }
      this.layers.push({ stars, color: cfg.color });
    }

    // Nebula clouds (subtle colored patches)
    this.nebulae = [];
    for (let i = 0; i < 3; i++) {
      this.nebulae.push({
        x: randFloat(0, CANVAS_WIDTH),
        y: randFloat(0, CANVAS_HEIGHT),
        radius: randFloat(60, 120),
        color: ['#1a0a30', '#0a1a30', '#0a0a20'][i],
        speed: 0.15,
      });
    }
  }

  update() {
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        star.y += star.speed;
        star.twinkle += 0.03;
        if (star.y > CANVAS_HEIGHT + 5) {
          star.y = -5;
          star.x = Math.random() * CANVAS_WIDTH;
        }
      }
    }
    for (const n of this.nebulae) {
      n.y += n.speed;
      if (n.y > CANVAS_HEIGHT + n.radius) {
        n.y = -n.radius;
        n.x = randFloat(0, CANVAS_WIDTH);
      }
    }
  }

  draw(ctx) {
    // Nebula clouds
    for (const n of this.nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
    }

    // Stars
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        const alpha = 0.5 + Math.sin(star.twinkle) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = layer.color;
        ctx.fillRect(
          Math.floor(star.x),
          Math.floor(star.y),
          Math.ceil(star.size),
          Math.ceil(star.size)
        );
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// Main Game Class
// ============================================================
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new InputHandler(canvas);

    // Game objects
    this.player = new Player();
    this.playerBullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.bossBullets = [];
    this.powerups = [];
    this.boss = null;
    this.effects = new EffectsManager();
    this.spawner = new EnemySpawner();
    this.starField = new StarField();
    this.stageManager = new StageManager();

    // Game state
    this.state = STATE.TITLE;
    this.score = 0;
    this.playTime = 0; // frames since current stage started
    this.bossWarningTimer = 0;
    this.stageClearTimer = 0;
    this.campaignComplete = false;
    this.scoreSaved = false;
    this.newBestScore = false;
    this.newBestClearScore = false;

    // Title screen animation
    this.titleFrame = 0;
  }

  get stage() {
    return this.stageManager.config;
  }

  get unlockedStage() {
    return getUnlockedStage();
  }

  get bestScore() {
    return loadBestScore();
  }

  get bestClearScore() {
    return loadBestClearScore();
  }

  /**
   * Full reset: new run from Stage 1.
   */
  reset() {
    this.startFromStage(1);
  }

  /**
   * Start a clean run from a specific implemented, unlocked stage.
   */
  startFromStage(stageNumber) {
    const unlocked = this.unlockedStage;
    if (stageNumber > unlocked) return false;
    if (!this.stageManager.setStage(stageNumber)) return false;

    this.player = new Player();
    this.score = 0;
    this.campaignComplete = false;
    this.scoreSaved = false;
    this.newBestScore = false;
    this.newBestClearScore = false;
    this.beginStage();
    this.state = STATE.PLAYING;
    return true;
  }

  /**
   * Return to the title screen without touching stage-unlock save data.
   */
  returnToTitle() {
    this.player = new Player();
    this.playerBullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.bossBullets = [];
    this.powerups = [];
    this.boss = null;
    this.effects.clear();
    this.spawner.reset();
    this.score = 0;
    this.playTime = 0;
    this.bossWarningTimer = 0;
    this.stageClearTimer = 0;
    this.campaignComplete = false;
    this.scoreSaved = false;
    this.newBestScore = false;
    this.newBestClearScore = false;
    this.state = STATE.TITLE;
  }

  recordGameOverScore() {
    if (this.scoreSaved) return;
    this.newBestScore = saveBestScore(this.score);
    this.newBestClearScore = false;
    this.scoreSaved = true;
  }

  recordCampaignCompleteScore() {
    if (this.scoreSaved) return;
    this.newBestScore = saveBestScore(this.score);
    this.newBestClearScore = saveBestClearScore(this.score);
    this.scoreSaved = true;
  }

  /**
   * Prepare the entities for the current stage. Keeps score for normal
   * progression, but resets player condition for a clean stage start.
   */
  beginStage() {
    this.playerBullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.bossBullets = [];
    this.powerups = [];
    this.boss = null;
    this.effects.clear();
    this.spawner.reset();
    this.spawner.setProfile(this.stage.enemySpawnPattern);
    this.playTime = 0;
    this.bossWarningTimer = 0;
    this.stageClearTimer = 0;
    // Clean stage start: no carried-over weapon, shield, or damage state.
    this.player.x = CANVAS_WIDTH / 2;
    this.player.y = CANVAS_HEIGHT - 60;
    this.player.maxLives = PLAYER_MAX_LIVES;
    this.player.lives = this.player.maxLives;
    this.player.alive = true;
    this.player.weaponType = WEAPON_NORMAL;
    this.player.weaponTimer = 0;
    this.player.shieldActive = false;
    this.player.shieldTimer = 0;
    this.player.fireTimer = 0;
    this.player.invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update() {
    this.input.update();
    this.titleFrame++;

    switch (this.state) {
      case STATE.TITLE:
        this.updateTitle();
        break;
      case STATE.PLAYING:
        this.updatePlaying();
        break;
      case STATE.PAUSED:
        this.updatePaused();
        break;
      case STATE.GAME_OVER:
        this.updateGameOver();
        break;
      case STATE.STAGE_CLEAR:
        this.updateStageClear();
        break;
      case STATE.CAMPAIGN_COMPLETE:
        this.updateCampaignComplete();
        break;
    }
  }

  updateTitle() {
    this.starField.update();
    if (this.input.touchStart) {
      this.handleTitleTouch(this.input.touchStartX, this.input.touchStartY);
      return;
    }
    if (this.input.enter) {
      this.reset();
      return;
    }
    if (this.input.isJustPressed('KeyC')) {
      this.startFromStage(this.unlockedStage);
      return;
    }
    if (this.input.isJustPressed('Digit1')) {
      this.startFromStage(1);
      return;
    }
    if (this.input.isJustPressed('Digit2')) {
      this.startFromStage(2);
      return;
    }
    if (this.input.isJustPressed('Digit3')) {
      this.startFromStage(3);
      return;
    }
    if (this.input.isJustPressed('Digit4')) {
      this.startFromStage(4);
      return;
    }
    if (this.input.isJustPressed('Digit5')) {
      this.startFromStage(5);
    }
  }

  getTitleButtons() {
    const buttons = [
      { label: 'NEW GAME', action: 'newGame', x: 62, y: 276, w: 92, h: 22, enabled: true },
      { label: 'CONTINUE', action: 'continue', x: 166, y: 276, w: 92, h: 22, enabled: true },
    ];

    const startX = 42;
    const y = 350;
    const size = 36;
    const gap = 8;
    const unlocked = this.unlockedStage;
    for (let stage = 1; stage <= MAX_STAGE; stage++) {
      buttons.push({
        label: String(stage),
        action: 'stage',
        stage,
        x: startX + (stage - 1) * (size + gap),
        y,
        w: size,
        h: 24,
        enabled: stage <= unlocked,
        isCurrentUnlock: stage === unlocked,
      });
    }
    return buttons;
  }

  handleTitleTouch(x, y) {
    const button = this.getTitleButtons().find(b =>
      x >= b.x && x <= b.x + b.w &&
      y >= b.y && y <= b.y + b.h
    );
    if (!button || !button.enabled) return false;

    this.input.endTouch();
    if (button.action === 'newGame') return this.startFromStage(1);
    if (button.action === 'continue') return this.startFromStage(this.unlockedStage);
    if (button.action === 'stage') return this.startFromStage(button.stage);
    return false;
  }

  updatePaused() {
    if (this.input.pause) {
      this.state = STATE.PLAYING;
    }
  }

  updateGameOver() {
    this.starField.update();
    this.effects.update();
    if (this.input.enter || this.input.touchStart) {
      this.returnToTitle();
    }
  }

  updateStageClear() {
    this.starField.update();
    this.effects.update();
    this.stageClearTimer++;
    if ((this.input.enter || this.input.touchStart) && this.stageClearTimer > 120) {
      // STAGE_CLEAR is only reached when a next stage exists; advance to it.
      // (The final stage routes straight to CAMPAIGN_COMPLETE instead.)
      const next = this.stageManager.advance();
      if (next) {
        this.beginStage();
        this.state = STATE.PLAYING;
      } else {
        this.state = STATE.CAMPAIGN_COMPLETE;
      }
    }
  }

  updateCampaignComplete() {
    this.starField.update();
    this.effects.update();
    this.stageClearTimer++;
    if ((this.input.enter || this.input.touchStart) && this.stageClearTimer > 90) {
      this.campaignComplete = true;
      this.state = STATE.TITLE;
    }
  }

  updatePlaying() {
    // Pause check
    if (this.input.pause) {
      this.state = STATE.PAUSED;
      return;
    }

    this.playTime++;
    this.starField.update();

    // --- DEBUG: weapon/shield hotkeys (1-5). Remove for release. ---
    this.handleDebugKeys();

    // --- Player ---
    this.player.update(this.input);
    if (this.input.shoot) {
      const newBullets = this.player.shoot();
      this.playerBullets.push(...newBullets);
    }

    // --- Player bullets ---
    for (const b of this.playerBullets) b.update();
    this.playerBullets = this.playerBullets.filter(b => b.alive);

    // --- Enemy spawning ---
    const bossActive = this.boss !== null;
    const newEnemies = this.spawner.update(bossActive);
    this.enemies.push(...newEnemies);

    // --- Enemies ---
    for (const e of this.enemies) {
      e.update(this.player);
      // Any enemy flagged canFire shoots at the player.
      if (e.canFire && e.alive) {
        const bullet = e.tryFire(this.player.x, this.player.y);
        if (bullet) this.enemyBullets.push(bullet);
      }
    }
    this.enemies = this.enemies.filter(e => e.alive);

    // --- Enemy bullets ---
    for (const b of this.enemyBullets) b.update();
    this.enemyBullets = this.enemyBullets.filter(b => b.alive);

    // --- Boss logic ---
    const bossTime = (this.stage.bossAppearTime || BOSS_APPEAR_TIME) * 60; // frames
    if (!this.boss && this.playTime >= bossTime) {
      this.boss = new Boss(this.stage.bossType);
      this.bossWarningTimer = 120; // 2 seconds of warning
    }

    if (this.bossWarningTimer > 0) {
      this.bossWarningTimer--;
    }

    if (this.boss) {
      this.boss.update();

      // Boss fires
      if (this.boss.active && !this.boss.dying) {
        const bullets = this.boss.tryFire(this.player.x, this.player.y);
        this.bossBullets.push(...bullets);
      }

      // Boss death sequence
      if (this.boss.dying) {
        // Random explosions during death
        if (this.boss.deathTimer % 8 === 0) {
          this.effects.explode(
            this.boss.x + randFloat(-40, 40),
            this.boss.y + randFloat(-30, 30),
            8
          );
        }
        if (this.boss.isDead) {
          this.effects.bigExplode(this.boss.x, this.boss.y);
          this.score += 5000;
          this.boss = null;
          this.bossBullets = [];
          this.stageClearTimer = 0;
          const hasNextStage = this.stageManager.hasNextImplemented();
          if (hasNextStage) {
            saveUnlockedStage(this.stageManager.current + 1);
          } else {
            this.recordCampaignCompleteScore();
          }
          // Final implemented stage cleared -> campaign complete screen.
          this.state = hasNextStage
            ? STATE.STAGE_CLEAR
            : STATE.CAMPAIGN_COMPLETE;
          return;
        }
      }
    }

    // --- Boss bullets ---
    for (const b of this.bossBullets) b.update();
    this.bossBullets = this.bossBullets.filter(b => b.alive);

    // --- Powerups ---
    for (const p of this.powerups) p.update();
    this.powerups = this.powerups.filter(p => p.alive);

    // Collect enemies spawned this frame (e.g. Split minions) so we
    // never mutate the list mid-iteration. Filled by destroyEnemy().
    this.pendingEnemies = [];

    // --- Collisions ---
    this.checkCollisions();
    // Flush any enemies queued during collisions (e.g. Split minions).
    if (this.pendingEnemies.length) {
      this.enemies.push(...this.pendingEnemies);
      this.pendingEnemies = [];
    }
    this.enemies = this.enemies.filter(e => e.alive);

    // --- Effects ---
    this.effects.update();

    // --- Game Over check ---
    if (!this.player.alive) {
      this.recordGameOverScore();
      this.state = STATE.GAME_OVER;
    }
  }

  // ============================================================
  // COLLISIONS
  // ============================================================
  checkCollisions() {
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.hitRadius;

    // --- Player bullets vs enemies ---
    for (const bullet of this.playerBullets) {
      if (!bullet.alive) continue;

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;

        if (circleCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
          if (bullet.kind === 'laser') {
            // PIERCE LASER: damage each enemy once, keep travelling.
            if (bullet.hitSet.indexOf(enemy) !== -1) continue;
            bullet.hitSet.push(enemy);
            enemy.applyDamage(bullet.damage, 'laser');
            this.effects.hitSpark(bullet.x, bullet.y);
            if (enemy.hp <= 0) this.destroyEnemy(enemy);
            // No break: the beam pierces through.
          } else if (bullet.kind === 'flame') {
            bullet.alive = false;
            enemy.applyDamage(bullet.damage, 'bullet');
            this.effects.explode(bullet.x, bullet.y, 6, 2.2);
            if (enemy.hp <= 0) this.destroyEnemy(enemy);
            break;
          } else {
            // NORMAL bullet.
            bullet.alive = false;
            enemy.applyDamage(bullet.damage, 'bullet');
            this.effects.hitSpark(bullet.x, bullet.y);
            if (enemy.hp <= 0) this.destroyEnemy(enemy);
            break; // Each bullet hits only one enemy
          }
        }
      }
    }

    // --- Player bullets vs boss ---
    if (this.boss && this.boss.active && !this.boss.dying) {
      for (const bullet of this.playerBullets) {
        if (!bullet.alive) continue;

        if (circleCollision(bullet.x, bullet.y, bullet.radius, this.boss.x, this.boss.y, this.boss.radius)) {
          if (bullet.kind === 'laser') {
            if (bullet.hitSet.indexOf(this.boss) !== -1) continue;
            bullet.hitSet.push(this.boss);
            this.boss.takeDamage(LASER_BOSS_DAMAGE);
            this.effects.hitSpark(bullet.x, bullet.y);
            this.score += 10;
          } else if (bullet.kind === 'flame') {
            bullet.alive = false;
            this.effects.explode(bullet.x, bullet.y, 6, 2.2);
            this.boss.takeDamage(bullet.damage);
            this.score += 10;
          } else {
            bullet.alive = false;
            this.effects.hitSpark(bullet.x, bullet.y);
            this.boss.takeDamage(bullet.damage);
            this.score += 10;
          }
        }
      }
    }

    // --- Powerups vs player ---
    // Invincibility only blocks damage; living players can still collect items.
    if (this.player.alive) {
      for (const p of this.powerups) {
        if (!p.alive) continue;

        if (circleCollision(px, py, pr + 8, p.x, p.y, p.radius)) {
          p.alive = false;
          if (p.type === ITEM_SHIELD) {
            this.player.setShield();
            this.score += 500;
          } else if (p.type === ITEM_LIFE) {
            if (!this.player.heal(1)) {
              this.score += 1000;
            }
          } else if (p.type === ITEM_MAX_LIFE) {
            if (!this.player.increaseMaxLives(1)) {
              this.score += 1500;
            }
          } else {
            this.player.setWeapon(p.type); // equip / overwrite special weapon
            this.score += 500;
          }
          this.effects.powerupPickup(p.x, p.y);
        }
      }
    }

    // Skip damage collision checks if invincible or dead
    if (!this.player.alive || this.player.isInvincible) return;

    // --- Enemies vs player ---
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      if (circleCollision(px, py, pr, enemy.x, enemy.y, enemy.radius)) {
        enemy.alive = false;
        this.effects.explode(enemy.x, enemy.y);
        const dead = this.damagePlayer(px, py);
        if (dead) {
          this.effects.explode(px, py, 20, 5);
        }
      }
    }

    // --- Enemy bullets vs player ---
    for (const bullet of this.enemyBullets) {
      if (!bullet.alive) continue;

      if (circleCollision(px, py, pr, bullet.x, bullet.y, bullet.radius)) {
        bullet.alive = false;
        this.effects.hitSpark(bullet.x, bullet.y);
        const dead = this.damagePlayer(px, py);
        if (dead) {
          this.effects.explode(px, py, 20, 5);
        }
      }
    }

    // --- Boss bullets vs player ---
    for (const bullet of this.bossBullets) {
      if (!bullet.alive) continue;

      if (circleCollision(px, py, pr, bullet.x, bullet.y, bullet.radius)) {
        bullet.alive = false;
        this.effects.hitSpark(bullet.x, bullet.y);
        const dead = this.damagePlayer(px, py);
        if (dead) {
          this.effects.explode(px, py, 20, 5);
        }
      }
    }
  }

  // ============================================================
  // KILL / WEAPON HELPERS
  // ============================================================

  /**
   * Apply player damage, letting SHIELD BARRIER block one hit first.
   */
  damagePlayer(x, y) {
    if (this.player.blockHitWithShield()) {
      this.effects.hitSpark(x, y);
      this.effects.explode(x, y, 8, 2.5);
      return false;
    }
    return this.player.takeDamage();
  }

  /**
   * DEBUG: number keys 1-4 instantly equip a weapon; 5 grants the
   * shield without changing the current weapon.
   *   1 = NORMAL  2 = TRIPLE  3 = LASER  4 = FLAME  5 = SHIELD
   */
  handleDebugKeys() {
    if (!DEBUG_MODE) return;
    if (this.input.isJustPressed('Digit1')) this.player.setWeapon(WEAPON_NORMAL);
    if (this.input.isJustPressed('Digit2')) this.player.setWeapon(WEAPON_TRIPLE);
    if (this.input.isJustPressed('Digit3')) this.player.setWeapon(WEAPON_PIERCE);
    if (this.input.isJustPressed('Digit4')) this.player.setWeapon(WEAPON_FLAME);
    if (this.input.isJustPressed('Digit5')) this.player.setShield();
  }

  /**
   * Handle an enemy that has been reduced to 0 HP: score, explosion,
   * item drop, and any split offspring. Queued minions are flushed
   * after the collision pass to avoid mutating the list mid-loop.
   */
  destroyEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    this.score += enemy.score;
    this.effects.explode(enemy.x, enemy.y);

    // Split enemies spawn offspring.
    const spawned = enemy.onDeath();
    if (spawned && spawned.length) {
      if (!this.pendingEnemies) this.pendingEnemies = [];
      this.pendingEnemies.push(...spawned);
    }

    // Item drop, rate driven by the current stage.
    const dropRate = this.stage.itemDropRate || POWERUP_DROP_CHANCE;
    if (Math.random() < dropRate) {
      this.powerups.push(new Powerup(enemy.x, enemy.y, null, this.stage.powerupWeights));
    }
  }

  // ============================================================
  // DRAW
  // ============================================================
  draw() {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = COLORS.BG_DARK;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, COLORS.BG_NEBULA);
    bgGrad.addColorStop(1, COLORS.BG_DARK);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars (always drawn)
    this.starField.draw(ctx);

    switch (this.state) {
      case STATE.TITLE:
        this.drawTitle(ctx);
        break;
      case STATE.PLAYING:
      case STATE.PAUSED:
        this.drawGameplay(ctx);
        if (this.state === STATE.PAUSED) this.drawPaused(ctx);
        this.drawTouchPauseButton(ctx);
        break;
      case STATE.GAME_OVER:
        this.drawGameplay(ctx);
        this.drawGameOver(ctx);
        break;
      case STATE.STAGE_CLEAR:
        this.drawGameplay(ctx);
        this.drawStageClear(ctx);
        break;
      case STATE.CAMPAIGN_COMPLETE:
        this.drawCampaignComplete(ctx);
        break;
    }
  }

  drawGameplay(ctx) {
    // --- Powerups ---
    for (const p of this.powerups) p.draw(ctx);

    // --- Enemies ---
    for (const e of this.enemies) e.draw(ctx);

    // --- Boss ---
    if (this.boss) this.boss.draw(ctx);

    // --- Shield barrier (drawn under the ship) ---
    if (this.player.shieldActive && this.player.alive) {
      drawShieldBarrier(ctx, this.player.x, this.player.y, this.playTime);
    }

    // --- Player ---
    this.player.draw(ctx);

    // --- Bullets ---
    for (const b of this.playerBullets) b.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);
    for (const b of this.bossBullets) b.draw(ctx);

    // --- Effects ---
    this.effects.draw(ctx);

    // --- HUD ---
    this.drawHUD(ctx);

    // --- Boss Warning ---
    if (this.bossWarningTimer > 0) {
      this.drawBossWarning(ctx);
    }
  }

  // ============================================================
  // HUD
  // ============================================================
  drawHUD(ctx) {
    ctx.save();

    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 22);

    ctx.font = '10px monospace';

    // Score
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 4, 10);
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText(String(this.score).padStart(8, '0'), 42, 10);

    // Lives
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.textAlign = 'left';
    ctx.fillText('LIFE', 130, 10);
    for (let i = 0; i < this.player.maxLives; i++) {
      ctx.fillStyle = i < this.player.lives ? COLORS.UI_RED : '#332233';
      ctx.fillRect(160 + i * 10, 4, 7, 7);
      if (i < this.player.lives) {
        ctx.fillStyle = COLORS.UI_YELLOW;
        ctx.fillRect(161 + i * 10, 5, 5, 5);
      } else {
        ctx.strokeStyle = COLORS.UI_DIM;
        ctx.lineWidth = 1;
        ctx.strokeRect(160 + i * 10, 4, 7, 7);
      }
    }

    // Time
    const seconds = Math.floor(this.playTime / 60);
    const timeStr = String(seconds).padStart(3, '0');
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.textAlign = 'right';
    ctx.fillText('TIME ' + timeStr, CANVAS_WIDTH - 4, 10);

    // Stage label (top-center) while no boss is on screen.
    if (!this.boss) {
      ctx.font = '8px monospace';
      ctx.fillStyle = COLORS.UI_DIM;
      ctx.textAlign = 'center';
      ctx.fillText(
        'STAGE ' + this.stage.stageNumber + '  ' + this.stage.stageName,
        CANVAS_WIDTH / 2, 32
      );
    }

    // Weapon indicator (bottom-left): name + remaining-time bar.
    this.drawWeaponHUD(ctx);

    // Boss HP bar
    if (this.boss && !this.boss.dying) {
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.textAlign = 'center';
      ctx.fillText(this.boss.name, CANVAS_WIDTH / 2, 32);

      // HP bar background
      const barX = 40;
      const barY = 36;
      const barW = CANVAS_WIDTH - 80;
      const barH = 6;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);

      // HP bar fill
      const hpFill = barW * this.boss.hpPercent;
      const hpColor = this.boss.isEnraged ? COLORS.UI_RED : COLORS.UI_GREEN;
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, hpFill, barH);

      // HP bar border
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }

  /**
   * Bottom-left weapon/shield panel.
   */
  drawWeaponHUD(ctx) {
    const def = this.player.weaponDef;
    const x = 6;
    const y = CANVAS_HEIGHT - 34;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    let weaponName = def.name;
    if (this.player.weaponType === WEAPON_TRIPLE) weaponName = 'TRIPLE';
    if (this.player.weaponType === WEAPON_PIERCE) weaponName = 'LASER';
    if (this.player.weaponType === WEAPON_FLAME) weaponName = 'FLAME';

    // Weapon line
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('WPN:', x, y);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = def.color;
    ctx.fillText(weaponName, x + 25, y);
    if (this.player.weaponType !== WEAPON_NORMAL && this.player.weaponTimer > 0) {
      ctx.font = '8px monospace';
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.fillText(this.player.weaponSecondsLeft + 's', x + 70, y);
    }

    // Timer bar for special weapons.
    if (this.player.weaponType !== WEAPON_NORMAL && this.player.weaponTimer > 0) {
      const barW = 90;
      const barH = 4;
      const by = y + 4;
      const pct = this.player.weaponTimer / WEAPON_DURATION;

      ctx.fillStyle = '#222';
      ctx.fillRect(x, by, barW, barH);
      // Flash the bar when time is almost up.
      const low = this.player.weaponTimer < 180;
      ctx.fillStyle = (low && Math.floor(this.titleFrame / 6) % 2 === 0)
        ? COLORS.UI_RED : def.color;
      ctx.fillRect(x, by, barW * pct, barH);
    }

    // Shield line
    const shieldY = y + 18;
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('SHD:', x, shieldY);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = this.player.shieldActive ? COLORS.ITEM_SHIELD : COLORS.UI_DIM;
    ctx.fillText(this.player.shieldActive ? 'ON' : 'OFF', x + 25, shieldY);
    if (this.player.shieldActive && this.player.shieldTimer > 0) {
      ctx.font = '8px monospace';
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.fillText(this.player.shieldSecondsLeft + 's', x + 48, shieldY);
    }

    ctx.restore();
  }

  // ============================================================
  // TITLE SCREEN
  // ============================================================
  drawTitle(ctx) {
    ctx.save();

    // Darkened overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    const titleY = 140 + Math.sin(this.titleFrame * 0.03) * 5;
    ctx.textAlign = 'center';

    // Title glow
    ctx.fillStyle = COLORS.PLAYER_BULLET;
    ctx.globalAlpha = 0.3;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('SECTOR', CANVAS_WIDTH / 2, titleY);
    ctx.fillText('NOVA', CANVAS_WIDTH / 2, titleY + 36);
    ctx.globalAlpha = 1;

    // Title text
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 30px monospace';
    ctx.fillText('SECTOR', CANVAS_WIDTH / 2, titleY);
    ctx.fillText('NOVA', CANVAS_WIDTH / 2, titleY + 36);

    // Subtitle
    ctx.fillStyle = COLORS.UI_BLUE;
    ctx.font = '9px monospace';
    ctx.fillText('- ORB CORE -', CANVAS_WIDTH / 2, titleY + 58);

    // Decorative line
    ctx.strokeStyle = COLORS.UI_BLUE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(60, titleY + 68);
    ctx.lineTo(CANVAS_WIDTH - 60, titleY + 68);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Saved scores
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px monospace';
    ctx.fillText('BEST SCORE: ' + String(this.bestScore).padStart(8, '0'), CANVAS_WIDTH / 2, 238);
    ctx.fillText('BEST CLEAR: ' + String(this.bestClearScore).padStart(8, '0'), CANVAS_WIDTH / 2, 252);

    if (this.input.shouldShowTouchUi) {
      this.drawTitleTouchMenu(ctx);
    } else {
      // Controls
      const ctrlY = 266;
      ctx.fillStyle = COLORS.UI_DIM;
      ctx.font = '8px monospace';
      ctx.fillText('--- CONTROLS ---', CANVAS_WIDTH / 2, ctrlY);

      ctx.fillStyle = COLORS.UI_BLUE;
      ctx.font = '8px monospace';
      const controls = [
        'ARROWS / WASD : MOVE',
        'SPACE : SHOOT',
        'P : PAUSE',
        'ENTER : NEW GAME',
        'C : CONTINUE',
        '1-5 : SELECT STAGE',
      ];
      if (DEBUG_MODE) controls.push('IN GAME 1-5 : DEBUG');
      for (let i = 0; i < controls.length; i++) {
        ctx.fillText(controls[i], CANVAS_WIDTH / 2, ctrlY + 16 + i * 14);
      }

      // Start prompts
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText('PRESS ENTER - NEW GAME', CANVAS_WIDTH / 2, 382);
      ctx.fillStyle = COLORS.UI_BLUE;
      ctx.fillText('PRESS C - CONTINUE', CANVAS_WIDTH / 2, 396);
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.fillText('UNLOCKED STAGE: ' + this.unlockedStage, CANVAS_WIDTH / 2, 410);
      ctx.fillStyle = COLORS.UI_DIM;
      ctx.font = '8px monospace';
      ctx.fillText('PRESS 1-5 - SELECT STAGE', CANVAS_WIDTH / 2, 424);
    }

    // Blink a small ready marker.
    if (Math.floor(this.titleFrame / 30) % 2 === 0) {
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.font = 'bold 10px monospace';
      ctx.fillText('READY', CANVAS_WIDTH / 2, 442);
    }

    // Credit
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '7px monospace';
    ctx.fillText('AI GAME DEV EXPERIMENT', CANVAS_WIDTH / 2, 460);

    ctx.restore();
  }

  drawTitleTouchMenu(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px monospace';
    ctx.fillText('TOUCH: DRAG TO MOVE / AUTO SHOT', CANVAS_WIDTH / 2, 266);

    const buttons = this.getTitleButtons();
    for (const button of buttons) {
      const enabled = button.enabled;
      const isStage = button.action === 'stage';
      const isCurrent = button.isCurrentUnlock;
      ctx.globalAlpha = enabled ? 1 : 0.45;
      ctx.fillStyle = 'rgba(0, 0, 20, 0.72)';
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.strokeStyle = enabled
        ? (isCurrent ? COLORS.UI_YELLOW : COLORS.UI_BLUE)
        : COLORS.UI_DIM;
      ctx.lineWidth = 1;
      ctx.strokeRect(button.x + 0.5, button.y + 0.5, button.w - 1, button.h - 1);

      ctx.fillStyle = enabled
        ? (isStage && isCurrent ? COLORS.UI_YELLOW : COLORS.UI_WHITE)
        : COLORS.UI_DIM;
      ctx.font = isStage ? 'bold 10px monospace' : 'bold 8px monospace';
      ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px monospace';
    ctx.fillText('UNLOCKED STAGE: ' + this.unlockedStage, CANVAS_WIDTH / 2, 320);
    ctx.fillStyle = COLORS.UI_BLUE;
    ctx.font = 'bold 8px monospace';
    ctx.fillText('STAGE SELECT', CANVAS_WIDTH / 2, 338);
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '7px monospace';
    ctx.fillText('LOCKED STAGES ARE DIMMED', CANVAS_WIDTH / 2, 386);

    ctx.restore();
  }

  // ============================================================
  // PAUSE OVERLAY
  // ============================================================
  drawPaused(ctx) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    ctx.fillStyle = COLORS.UI_BLUE;
    ctx.font = '10px monospace';
    ctx.fillText('PRESS P TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.restore();
  }

  drawTouchPauseButton(ctx) {
    if (!this.input.shouldShowTouchUi) return;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(0, 0, 20, 0.75)';
    ctx.fillRect(TOUCH_PAUSE_BUTTON_X, TOUCH_PAUSE_BUTTON_Y, TOUCH_PAUSE_BUTTON_W, TOUCH_PAUSE_BUTTON_H);
    ctx.strokeStyle = COLORS.UI_BLUE;
    ctx.lineWidth = 1;
    ctx.strokeRect(TOUCH_PAUSE_BUTTON_X + 0.5, TOUCH_PAUSE_BUTTON_Y + 0.5, TOUCH_PAUSE_BUTTON_W - 1, TOUCH_PAUSE_BUTTON_H - 1);

    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 8px monospace';
    ctx.fillText(
      this.state === STATE.PAUSED ? 'PLAY' : 'PAUSE',
      TOUCH_PAUSE_BUTTON_X + TOUCH_PAUSE_BUTTON_W / 2,
      TOUCH_PAUSE_BUTTON_Y + TOUCH_PAUSE_BUTTON_H / 2 + 1
    );
    ctx.restore();
  }

  // ============================================================
  // GAME OVER
  // ============================================================
  drawGameOver(ctx) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.UI_RED;
    ctx.font = 'bold 28px monospace';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 42);

    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.font = '12px monospace';
    ctx.fillText('SCORE: ' + String(this.score).padStart(8, '0'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 2);
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = '10px monospace';
    ctx.fillText('BEST : ' + String(this.bestScore).padStart(8, '0'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    if (this.newBestScore) {
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.font = 'bold 10px monospace';
      ctx.fillText('NEW BEST!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 38);
    }

    if (Math.floor(this.titleFrame / 30) % 2 === 0) {
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.font = '10px monospace';
      ctx.fillText('PRESS ENTER TO TITLE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 64);
      ctx.fillStyle = COLORS.UI_DIM;
      ctx.font = '8px monospace';
      ctx.fillText('CONTINUE FROM TITLE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }

    ctx.restore();
  }

  // ============================================================
  // STAGE CLEAR
  // ============================================================
  drawStageClear(ctx) {
    ctx.save();

    const alpha = Math.min(this.stageClearTimer / 60, 1);
    ctx.fillStyle = `rgba(0, 0, 20, ${alpha * 0.6})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.stageClearTimer > 30) {
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.UI_GREEN;
      ctx.font = 'bold 24px monospace';
      ctx.fillText('STAGE CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.font = '14px monospace';
      ctx.fillText('SCORE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = 'bold 18px monospace';
      ctx.fillText(String(this.score).padStart(8, '0'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    }

    // Next-stage banner (or campaign complete).
    if (this.stageClearTimer > 60) {
      ctx.textAlign = 'center';
      const next = STAGES[this.stageManager.current + 1];
      if (next && next.implemented) {
        ctx.fillStyle = COLORS.UI_BLUE;
        ctx.font = '10px monospace';
        ctx.fillText('NEXT: STAGE ' + next.stageNumber, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 48);
        ctx.fillStyle = COLORS.UI_WHITE;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(next.stageName, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 64);
      } else {
        ctx.fillStyle = COLORS.UI_GREEN;
        ctx.font = 'bold 12px monospace';
        ctx.fillText('ALL STAGES CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 56);
      }
    }

    if (this.stageClearTimer > 120 && Math.floor(this.titleFrame / 30) % 2 === 0) {
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.font = '10px monospace';
      ctx.fillText('PRESS ENTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 84);
    }

    ctx.restore();
  }

  // ============================================================
  // CAMPAIGN COMPLETE (final stage cleared)
  // ============================================================
  drawCampaignComplete(ctx) {
    ctx.save();

    // Deep-space backdrop over the stars (already drawn underneath).
    const alpha = Math.min(this.stageClearTimer / 60, 1);
    ctx.fillStyle = `rgba(4, 2, 24, ${alpha * 0.8})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    // Celebratory sparks rising
    const cx = CANVAS_WIDTH / 2;
    const topY = 120;

    // "CAMPAIGN" / "COMPLETE"
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.globalAlpha = 0.35;
    ctx.font = 'bold 26px monospace';
    ctx.fillText('CAMPAIGN', cx, topY);
    ctx.fillText('COMPLETE', cx, topY + 30);
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('CAMPAIGN', cx, topY);
    ctx.fillText('COMPLETE', cx, topY + 30);

    // Decorative line
    ctx.strokeStyle = COLORS.UI_YELLOW;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(50, topY + 48);
    ctx.lineTo(CANVAS_WIDTH - 50, topY + 48);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.UI_BLUE;
    ctx.font = '10px monospace';
    ctx.fillText('THANK YOU FOR PLAYING', cx, topY + 70);
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px monospace';
    ctx.fillText('SECTOR NOVA: ORB CORE', cx, topY + 86);

    // TOTAL SCORE
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.font = '14px monospace';
    ctx.fillText('TOTAL SCORE', cx, topY + 132);
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(String(this.score).padStart(8, '0'), cx, topY + 158);

    ctx.fillStyle = COLORS.UI_BLUE;
    ctx.font = '12px monospace';
    ctx.fillText('BEST CLEAR', cx, topY + 188);
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(String(this.bestClearScore).padStart(8, '0'), cx, topY + 212);
    if (this.newBestClearScore) {
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.font = 'bold 10px monospace';
      ctx.fillText('NEW CLEAR BEST!', cx, topY + 232);
    }

    // Prompt (blinking, after a short beat)
    if (this.stageClearTimer > 90 && Math.floor(this.titleFrame / 30) % 2 === 0) {
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.font = '10px monospace';
      ctx.fillText('PRESS ENTER TO TITLE', cx, topY + 258);
    }

    ctx.restore();
  }

  // ============================================================
  // BOSS WARNING
  // ============================================================
  drawBossWarning(ctx) {
    ctx.save();

    const flash = Math.floor(this.bossWarningTimer / 10) % 2 === 0;
    if (flash) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = flash ? COLORS.UI_RED : COLORS.UI_YELLOW;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('WARNING', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = '10px monospace';
    ctx.fillText((this.boss ? this.boss.name : 'BOSS') + ' APPROACHING', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);

    ctx.restore();
  }
}
