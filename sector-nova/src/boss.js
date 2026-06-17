// ============================================================
// SECTOR NOVA - Bosses
// ============================================================

// ============================================================
// Boss type definitions. All bosses share the compact SFC-style
// core structure with distinct stats and palettes.
// ============================================================
const BOSS_TYPES = {
  orbCore: {
    name: 'ORB CORE',
    maxHp: 80,
    fireIntervalNormal: 85,
    fireIntervalEnraged: 60,
    extraSideBullets: false,
    bulletSpeedScale: 0.85,
    colors: {
      core: COLORS.BOSS_CORE,
      armor: COLORS.BOSS_ARMOR,
      armorDark: COLORS.BOSS_ARMOR_DARK,
      glow: COLORS.BOSS_GLOW,
    },
  },
  meteorGuardian: {
    name: 'METEOR GUARDIAN',
    maxHp: 140,
    fireIntervalNormal: 100,
    fireIntervalEnraged: 60,
    extraSideBullets: false,
    bulletSpeedScale: 0.9,
    colors: {
      core: '#ff8833',      // molten orange
      armor: '#8a6a4a',     // rocky brown
      armorDark: '#5a4330',
      glow: '#ffcc55',
    },
  },
  shieldCarrier: {
    name: 'SHIELD CARRIER',
    maxHp: 160,
    fireIntervalNormal: 90,
    fireIntervalEnraged: 55,
    extraSideBullets: false,
    bulletSpeedScale: 0.95,
    colors: {
      core: '#dddd55',
      armor: '#889099',
      armorDark: '#4d555d',
      glow: '#fff088',
    },
  },
  stormCore: {
    name: 'STORM CORE',
    maxHp: 180,
    fireIntervalNormal: 85,
    fireIntervalEnraged: 50,
    extraSideBullets: true,
    bulletSpeedScale: 0.85,
    colors: {
      core: '#55ddff',
      armor: '#4455aa',
      armorDark: '#222b66',
      glow: '#ff6688',
    },
  },
  nebulaHeart: {
    name: 'NEBULA HEART',
    maxHp: 220,
    fireIntervalNormal: 90,
    fireIntervalEnraged: 55,
    extraSideBullets: true,
    bulletSpeedScale: 0.9,
    colors: {
      core: '#cc66ff',
      armor: '#7755aa',
      armorDark: '#3d2866',
      glow: '#ffdd88',
    },
  },
};

class Boss {
  constructor(typeKey) {
    const def = BOSS_TYPES[typeKey] || BOSS_TYPES.orbCore;
    this.typeKey = BOSS_TYPES[typeKey] ? typeKey : 'orbCore';
    this.name = def.name;
    this.colors = def.colors;

    this.x = CANVAS_WIDTH / 2;
    this.y = -60; // Start off screen
    this.targetY = 60; // Final position
    this.hp = def.maxHp;
    this.maxHp = def.maxHp;
    this.fireIntervalNormal = def.fireIntervalNormal;
    this.fireIntervalEnraged = def.fireIntervalEnraged;
    this.extraSideBullets = def.extraSideBullets;
    this.bulletSpeedScale = def.bulletSpeedScale || 1.0;
    this.radius = BOSS_RADIUS;
    this.alive = true;
    this.active = false; // becomes true when in position
    this.speed = BOSS_SPEED;
    this.moveDir = 1; // 1 = right, -1 = left
    this.fireTimer = this.fireIntervalNormal;
    this.frame = 0;
    this.entering = true;
    this.deathTimer = 0; // countdown after death for effects
    this.dying = false;
    this.armorAngle = 0;
  }

  get hpPercent() {
    return this.hp / this.maxHp;
  }

  get isEnraged() {
    return this.hpPercent <= BOSS_ENRAGE_HP_THRESHOLD;
  }

  get fireInterval() {
    return this.isEnraged ? this.fireIntervalEnraged : this.fireIntervalNormal;
  }

  update() {
    if (this.dying) {
      this.deathTimer--;
      return;
    }

    this.frame++;
    this.armorAngle += 0.02;

    // Entry animation
    if (this.entering) {
      this.y = lerp(this.y, this.targetY, 0.03);
      if (Math.abs(this.y - this.targetY) < 1) {
        this.y = this.targetY;
        this.entering = false;
        this.active = true;
      }
      return;
    }

    // Horizontal movement
    this.x += this.speed * this.moveDir;
    if (this.x > CANVAS_WIDTH - 50) this.moveDir = -1;
    if (this.x < 50) this.moveDir = 1;

    // Enraged movement is faster
    if (this.isEnraged) {
      this.x += this.speed * this.moveDir * 0.5;
    }

    // Fire timer
    if (this.fireTimer > 0) this.fireTimer--;
  }

  /**
   * Try to fire. Returns array of BossBullets or empty array.
   */
  tryFire(playerX, playerY) {
    if (!this.active || this.fireTimer > 0 || this.dying) return [];

    this.fireTimer = this.fireInterval;

    const bullets = [];
    const baseAngle = angleTo(this.x, this.y, playerX, playerY);

    // 3-way spread
    const spread = this.isEnraged ? 0.4 : 0.3;
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * spread;
      const speed = (BOSS_BULLET_SPEED + (this.isEnraged ? 0.5 : 0)) * this.bulletSpeedScale;
      bullets.push(new BossBullet(
        this.x, this.y + 30,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      ));
    }

    // Extra side bullets when enraged
    if (this.extraSideBullets && this.isEnraged && this.frame % 2 === 0) {
      bullets.push(new BossBullet(
        this.x - 30, this.y + 20,
        Math.cos(baseAngle - 0.1) * BOSS_BULLET_SPEED * this.bulletSpeedScale,
        Math.sin(baseAngle - 0.1) * BOSS_BULLET_SPEED * this.bulletSpeedScale
      ));
      bullets.push(new BossBullet(
        this.x + 30, this.y + 20,
        Math.cos(baseAngle + 0.1) * BOSS_BULLET_SPEED * this.bulletSpeedScale,
        Math.sin(baseAngle + 0.1) * BOSS_BULLET_SPEED * this.bulletSpeedScale
      ));
    }

    return bullets;
  }

  /**
   * Take damage. Returns true if boss is destroyed.
   */
  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathTimer = 90; // ~1.5s death animation
      return true;
    }
    return false;
  }

  get isDead() {
    return this.dying && this.deathTimer <= 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = 1 + Math.sin(this.frame * 0.05) * 0.05;
    const corePulse = 1 + Math.sin(this.frame * 0.1) * 0.15;

    // Death animation - shake and flicker
    if (this.dying) {
      const shake = (90 - this.deathTimer) * 0.3;
      ctx.translate(randFloat(-shake, shake), randFloat(-shake, shake));
      if (Math.random() < 0.3) {
        ctx.restore();
        return; // Flicker
      }
    }

    // Per-boss palette.
    const cCore = this.colors.core;
    const cArmor = this.colors.armor;
    const cArmorDark = this.colors.armorDark;
    const cGlow = this.colors.glow;

    // --- Outer shield ring ---
    if (!this.dying) {
      ctx.strokeStyle = this.isEnraged ? cGlow : cArmor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3 + Math.sin(this.frame * 0.03) * 0.1;
      ctx.beginPath();
      ctx.arc(0, 0, 48 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // --- Rotating armor plates ---
    for (let i = 0; i < 4; i++) {
      const angle = this.armorAngle + (Math.PI / 2) * i;
      const ax = Math.cos(angle) * 28 * pulse;
      const ay = Math.sin(angle) * 28 * pulse;

      ctx.fillStyle = cArmor;
      ctx.beginPath();
      ctx.arc(ax, ay, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cArmorDark;
      ctx.beginPath();
      ctx.arc(ax, ay, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Left armor ---
    ctx.fillStyle = cArmor;
    ctx.beginPath();
    ctx.moveTo(-35, -10);
    ctx.lineTo(-20, -20);
    ctx.lineTo(-15, 0);
    ctx.lineTo(-20, 15);
    ctx.lineTo(-35, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cArmorDark;
    ctx.beginPath();
    ctx.moveTo(-32, -6);
    ctx.lineTo(-22, -14);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-22, 10);
    ctx.lineTo(-32, 6);
    ctx.closePath();
    ctx.fill();

    // --- Right armor ---
    ctx.fillStyle = cArmor;
    ctx.beginPath();
    ctx.moveTo(35, -10);
    ctx.lineTo(20, -20);
    ctx.lineTo(15, 0);
    ctx.lineTo(20, 15);
    ctx.lineTo(35, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cArmorDark;
    ctx.beginPath();
    ctx.moveTo(32, -6);
    ctx.lineTo(22, -14);
    ctx.lineTo(18, 0);
    ctx.lineTo(22, 10);
    ctx.lineTo(32, 6);
    ctx.closePath();
    ctx.fill();

    // --- Main core body ---
    ctx.fillStyle = cCore;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner core gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * pulse);
    gradient.addColorStop(0, COLORS.UI_WHITE);
    gradient.addColorStop(0.3, cGlow);
    gradient.addColorStop(1, cCore);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 16 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Core center bright point
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.8 + Math.sin(this.frame * 0.15) * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // --- Bottom cannon ---
    ctx.fillStyle = cArmor;
    ctx.fillRect(-4, 18, 8, 14);
    ctx.fillStyle = this.isEnraged ? cGlow : cCore;
    ctx.beginPath();
    ctx.arc(0, 32, 4, 0, Math.PI * 2);
    ctx.fill();

    // --- Enrage indicators ---
    if (this.isEnraged) {
      // Pulsing red glow
      ctx.strokeStyle = COLORS.UI_RED;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4 + Math.sin(this.frame * 0.2) * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, 36 * corePulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
