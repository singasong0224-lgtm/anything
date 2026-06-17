// ============================================================
// SECTOR NOVA - Powerup / Item Drops
// ------------------------------------------------------------
// Enemies have a chance to drop a colored item that grants a
// special weapon or defensive shield on pickup:
//   purple -> TRIPLE BEAM
//   blue  -> PIERCE LASER
//   red   -> FLAME VORTEX
//   green -> SHIELD BARRIER
//   yellow -> LIFE RECOVER
//   pink -> MAX LIFE UP
// Items drift slowly downward and are removed off screen.
// ============================================================

const POWERUP_TYPES = [
  { type: WEAPON_TRIPLE, color: COLORS.ITEM_TRIPLE, letter: 'T' },
  { type: WEAPON_PIERCE, color: COLORS.ITEM_PIERCE, letter: 'L' },
  { type: WEAPON_FLAME, color: COLORS.ITEM_FLAME, letter: 'F' },
  { type: ITEM_SHIELD, color: COLORS.ITEM_SHIELD, letter: 'S' },
  { type: ITEM_LIFE, color: COLORS.ITEM_LIFE, letter: '+' },
  { type: ITEM_MAX_LIFE, color: COLORS.ITEM_MAX_LIFE, letter: 'M' },
];

function powerupDefFor(type) {
  return POWERUP_TYPES.find(p => p.type === type) || POWERUP_TYPES[0];
}

/**
 * Pick a random item type.
 */
function randomPowerupType(weights) {
  if (weights) {
    let total = 0;
    for (const def of POWERUP_TYPES) {
      total += weights[def.type] || 0;
    }
    if (total > 0) {
      let roll = Math.random() * total;
      for (const def of POWERUP_TYPES) {
        roll -= weights[def.type] || 0;
        if (roll <= 0) return def.type;
      }
    }
  }
  return POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)].type;
}

class Powerup {
  constructor(x, y, type, weights) {
    this.x = x;
    this.y = y;
    this.type = type || randomPowerupType(weights);
    this.def = powerupDefFor(this.type);
    this.speed = POWERUP_SPEED;
    this.radius = POWERUP_RADIUS;
    this.alive = true;
    this.frame = 0;
  }

  update() {
    this.y += this.speed;
    // Gentle horizontal sway
    this.x += Math.sin(this.frame * 0.05) * 0.4;
    this.frame++;
    if (this.y > CANVAS_HEIGHT + 20) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = 1 + Math.sin(this.frame * 0.1) * 0.2;

    // Glow
    ctx.fillStyle = this.def.color;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, 13 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Outer ring
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Body
    ctx.fillStyle = this.def.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Letter
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.letter, 0, 1);

    ctx.restore();
  }
}
