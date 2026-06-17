// ============================================================
// SECTOR NOVA - Weapon System
// ------------------------------------------------------------
// Player carries a `weaponType`. The normal weapon is always
// available; special weapons are granted by item pickup, last
// WEAPON_DURATION frames, and revert to normal on hit.
//
// Each weapon entry defines:
//   - name         : label shown in the HUD
//   - color        : HUD accent color
//   - fireInterval : frames between shots
//   - fire(player) : returns an array of bullet objects
//
// Special projectiles live in the same playerBullets array as
// normal bullets and are told apart by their `kind` field
// ('normal' | 'laser' | 'flame').
// ============================================================

/**
 * FLAME VORTEX projectile: short-range fire bullet that wavers
 * left and right as it moves forward.
 */
class FlameVortexBullet {
  constructor(x, y, vx, phase) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = -FLAME_BULLET_SPEED;
    this.radius = FLAME_BULLET_RADIUS;
    this.alive = true;
    this.kind = 'flame';
    this.damage = FLAME_DAMAGE;
    this.frame = 0;
    this.phase = phase;
  }

  update() {
    this.x += this.vx + Math.sin(this.frame * 0.22 + this.phase) * 0.7;
    this.y += this.vy;
    this.frame++;
    if (this.frame > FLAME_LIFE || this.y < -12 || this.x < -12 || this.x > CANVAS_WIDTH + 12) {
      this.alive = false;
    }
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.35 + this.phase) * 0.18;

    // Outer glow
    ctx.fillStyle = COLORS.FLAME_GLOW;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.radius + 4) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body
    ctx.fillStyle = COLORS.FLAME_BODY;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Hot core
    ctx.fillStyle = COLORS.EXPLOSION_MID;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * PIERCE LASER projectile: thick short beam that pierces enemies.
 * Each enemy is damaged only once (tracked in `hitSet`).
 */
class PierceLaserBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = -LASER_BULLET_SPEED;
    this.radius = 6;        // collision half-width
    this.halfLen = 16;      // visual half-length
    this.alive = true;
    this.kind = 'laser';
    this.damage = LASER_DAMAGE;
    this.hitSet = [];       // enemies/boss already damaged
    this.frame = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.frame++;
    if (this.y < -this.halfLen - 4) this.alive = false;
  }

  draw(ctx) {
    const flick = 0.7 + Math.sin(this.frame * 0.6) * 0.3;

    // Outer beam glow
    ctx.globalAlpha = 0.35 * flick;
    ctx.fillStyle = COLORS.LASER_GLOW;
    ctx.fillRect(this.x - this.radius - 2, this.y - this.halfLen, (this.radius + 2) * 2, this.halfLen * 2);
    ctx.globalAlpha = 1;

    // Core beam
    ctx.fillStyle = COLORS.LASER_BODY;
    ctx.fillRect(this.x - this.radius * 0.5, this.y - this.halfLen, this.radius, this.halfLen * 2);

    // Bright center line
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillRect(this.x - 1, this.y - this.halfLen, 2, this.halfLen * 2);
  }
}

// ============================================================
// Weapon registry
// ============================================================
const WEAPONS = {
  [WEAPON_NORMAL]: {
    name: 'NORMAL',
    color: COLORS.PLAYER_BULLET,
    fireInterval: PLAYER_FIRE_INTERVAL,
    fire(player) {
      return [new PlayerBullet(player.x, player.y - 12)];
    },
  },

  [WEAPON_TRIPLE]: {
    name: 'TRIPLE BEAM',
    color: COLORS.ITEM_TRIPLE,
    fireInterval: TRIPLE_FIRE_INTERVAL,
    fire(player) {
      return [
        new PlayerBullet(player.x, player.y - 12),
        new PlayerBullet(player.x - 5, player.y - 9, -TRIPLE_SIDE_SPEED, -PLAYER_BULLET_SPEED),
        new PlayerBullet(player.x + 5, player.y - 9, TRIPLE_SIDE_SPEED, -PLAYER_BULLET_SPEED),
      ];
    },
  },

  [WEAPON_PIERCE]: {
    name: 'PIERCE LASER',
    color: COLORS.ITEM_PIERCE,
    fireInterval: LASER_FIRE_INTERVAL,
    fire(player) {
      // Twin thick beams from the wing tips.
      return [
        new PierceLaserBullet(player.x - 5, player.y - 12),
        new PierceLaserBullet(player.x + 5, player.y - 12),
      ];
    },
  },

  [WEAPON_FLAME]: {
    name: 'FLAME VORTEX',
    color: COLORS.ITEM_FLAME,
    fireInterval: FLAME_FIRE_INTERVAL,
    fire(player) {
      return [
        new FlameVortexBullet(player.x - 4, player.y - 12, -0.7, 0),
        new FlameVortexBullet(player.x + 4, player.y - 12, 0.7, Math.PI),
      ];
    },
  },
};

/**
 * Draw the shield barrier around the player. This reuses the old
 * circular field vocabulary visually, but it has no attack hitbox.
 */
function drawShieldBarrier(ctx, x, y, frame) {
  ctx.save();
  ctx.translate(x, y);

  // Soft field glow
  const grad = ctx.createRadialGradient(0, 0, SHIELD_RADIUS * 0.3, 0, 0, SHIELD_RADIUS);
  grad.addColorStop(0, 'rgba(102,255,170,0.05)');
  grad.addColorStop(0.7, 'rgba(102,255,170,0.18)');
  grad.addColorStop(1, 'rgba(102,255,170,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, SHIELD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Rotating arcs
  const spin = frame * 0.18;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const a = spin + (Math.PI * 2 / 3) * i;
    ctx.strokeStyle = COLORS.SHIELD_BODY;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, SHIELD_RADIUS - 6, a, a + Math.PI * 0.7);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Orbiting particles
  for (let i = 0; i < 6; i++) {
    const a = -spin * 1.6 + (Math.PI * 2 / 6) * i;
    const r = SHIELD_RADIUS - 10 + Math.sin(frame * 0.2 + i) * 4;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}
