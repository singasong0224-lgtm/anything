// ============================================================
// SECTOR NOVA - Player
// ============================================================

class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT - 60;
    this.maxLives = PLAYER_MAX_LIVES;
    this.lives = this.maxLives;
    this.hitRadius = PLAYER_HIT_RADIUS;
    this.fireTimer = 0;
    this.invincibleTimer = 0;
    this.alive = true;
    this.engineFrame = 0;
    // --- Weapon system ---
    this.weaponType = WEAPON_NORMAL;
    this.weaponTimer = 0; // frames remaining on a special weapon
    // --- Defensive item system ---
    this.shieldActive = false;
    this.shieldTimer = 0;
  }

  /**
   * Equip a special weapon (from item pickup). Overwrites any current
   * special weapon and resets its 20s timer. Normal has no timer.
   */
  setWeapon(type) {
    this.weaponType = type;
    this.weaponTimer = (type === WEAPON_NORMAL) ? 0 : WEAPON_DURATION;
    this.fireTimer = 0; // allow an immediate shot with the new weapon
  }

  /**
   * Grant a one-hit shield without changing the current weapon.
   */
  setShield() {
    this.shieldActive = true;
    this.shieldTimer = SHIELD_DURATION;
  }

  get weaponDef() {
    return WEAPONS[this.weaponType] || WEAPONS[WEAPON_NORMAL];
  }

  /** Seconds left on the current special weapon (0 for normal). */
  get weaponSecondsLeft() {
    return Math.ceil(this.weaponTimer / 60);
  }

  get shieldSecondsLeft() {
    return Math.ceil(this.shieldTimer / 60);
  }

  update(input) {
    if (!this.alive) return;

    // --- Movement ---
    // PIERCE LASER slows the ship slightly while equipped.
    const speed = this.weaponType === WEAPON_PIERCE
      ? PLAYER_SPEED * LASER_MOVE_PENALTY
      : PLAYER_SPEED;
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= speed;
    if (input.right) dx += speed;
    if (input.up) dy -= speed;
    if (input.down) dy += speed;

    // Diagonal movement normalization
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    if (input.touchActive) {
      this.x = input.touchTargetX;
      this.y = input.touchTargetY;
    } else {
      this.x += dx;
      this.y += dy;
    }

    // Clamp to screen bounds (with padding for visual size)
    this.x = clamp(this.x, 12, CANVAS_WIDTH - 12);
    this.y = clamp(this.y, 12, CANVAS_HEIGHT - 12);

    // --- Fire rate ---
    if (this.fireTimer > 0) this.fireTimer--;

    // --- Invincibility ---
    if (this.invincibleTimer > 0) this.invincibleTimer--;

    // --- Weapon timer ---
    if (this.weaponTimer > 0) {
      this.weaponTimer--;
      if (this.weaponTimer <= 0) {
        this.weaponType = WEAPON_NORMAL;
      }
    }

    // --- Shield timer ---
    if (this.shieldTimer > 0) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
      }
    }

    // --- Engine animation ---
    this.engineFrame++;
  }

  /**
   * Fire bullets according to the current weapon.
   */
  shoot() {
    if (!this.alive || this.fireTimer > 0) return [];

    const def = this.weaponDef;
    this.fireTimer = def.fireInterval;
    return def.fire(this);
  }

  /**
   * Take damage. Returns true if player died.
   */
  takeDamage() {
    if (this.invincibleTimer > 0) return false;
    if (this.blockHitWithShield()) return false;

    this.lives--;
    this.invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
    // Getting hit knocks the player back to the normal weapon.
    this.weaponType = WEAPON_NORMAL;
    this.weaponTimer = 0;

    if (this.lives <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  /**
   * Consume the shield to block one hit. The active weapon is unchanged.
   */
  blockHitWithShield() {
    if (!this.shieldActive) return false;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
    return true;
  }

  heal(amount) {
    amount = amount || 1;
    const before = this.lives;
    this.lives = Math.min(this.maxLives, this.lives + amount);
    return this.lives > before;
  }

  increaseMaxLives(amount) {
    amount = amount || 1;
    const beforeMax = this.maxLives;
    const beforeLives = this.lives;
    this.maxLives = Math.min(PLAYER_STAGE_MAX_LIVES, this.maxLives + amount);
    const maxIncreased = this.maxLives > beforeMax;
    this.lives = this.maxLives;
    return maxIncreased || this.lives > beforeLives;
  }

  get isInvincible() {
    return this.invincibleTimer > 0;
  }

  draw(ctx) {
    if (!this.alive) return;

    // Blinking when invincible
    if (this.isInvincible && Math.floor(this.invincibleTimer / PLAYER_BLINK_INTERVAL) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // --- Engine flame ---
    const flicker = Math.sin(this.engineFrame * 0.5) * 2;
    const flameLen = 8 + flicker;

    // Outer flame glow
    ctx.fillStyle = COLORS.PLAYER_ENGINE;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 10, 6 + flicker * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Main flame
    ctx.fillStyle = COLORS.PLAYER_ENGINE;
    ctx.beginPath();
    ctx.moveTo(-4, 6);
    ctx.lineTo(0, 6 + flameLen);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();

    // Inner flame (bright)
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.beginPath();
    ctx.moveTo(-2, 6);
    ctx.lineTo(0, 6 + flameLen * 0.6);
    ctx.lineTo(2, 6);
    ctx.closePath();
    ctx.fill();

    // --- Ship body ---
    // Wings
    ctx.fillStyle = COLORS.PLAYER_WING;
    ctx.beginPath();
    ctx.moveTo(-12, 4);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-3, 6);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, 4);
    ctx.lineTo(6, -4);
    ctx.lineTo(3, 6);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();

    // Main body
    ctx.fillStyle = COLORS.PLAYER_BODY;
    ctx.beginPath();
    ctx.moveTo(0, -12);      // nose
    ctx.lineTo(-5, -2);
    ctx.lineTo(-6, 6);
    ctx.lineTo(0, 8);
    ctx.lineTo(6, 6);
    ctx.lineTo(5, -2);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = COLORS.PLAYER_COCKPIT;
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit highlight
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-1, -3, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Nose highlight
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(-1, -11, 2, 4);
    ctx.globalAlpha = 1;

    // Wing tips (small accents)
    ctx.fillStyle = COLORS.PLAYER_ENGINE;
    ctx.fillRect(-12, 3, 2, 3);
    ctx.fillRect(10, 3, 2, 3);

    ctx.restore();
  }
}
