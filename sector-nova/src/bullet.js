// ============================================================
// SECTOR NOVA - Bullets
// ============================================================

/**
 * Player bullet - moves upward
 */
class PlayerBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx || 0;
    this.vy = vy || -PLAYER_BULLET_SPEED;
    this.radius = 3;
    this.alive = true;
    this.damage = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Remove if off screen
    if (this.y < -10 || this.x < -10 || this.x > CANVAS_WIDTH + 10) {
      this.alive = false;
    }
  }

  draw(ctx) {
    // Glow effect
    ctx.fillStyle = COLORS.PLAYER_BULLET_GLOW;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Core
    ctx.fillStyle = COLORS.PLAYER_BULLET;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Enemy bullet - moves in a specified direction
 */
class EnemyBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 3;
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Remove if off screen (generous margin)
    if (this.y < -20 || this.y > CANVAS_HEIGHT + 20 ||
        this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.alive = false;
    }
  }

  draw(ctx) {
    // Glow
    ctx.fillStyle = COLORS.ENEMY_BULLET_GLOW;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Core
    ctx.fillStyle = COLORS.ENEMY_BULLET;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Boss bullet - distinct appearance
 */
class BossBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 4;
    this.alive = true;
    this.frame = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.frame++;
    if (this.y < -20 || this.y > CANVAS_HEIGHT + 20 ||
        this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.alive = false;
    }
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.2) * 0.2;

    // Glow
    ctx.fillStyle = COLORS.BOSS_BULLET_GLOW;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.radius + 4) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Core
    ctx.fillStyle = COLORS.BOSS_BULLET;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Center
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
