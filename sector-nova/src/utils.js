// ============================================================
// SECTOR NOVA - Utils & Constants
// ============================================================

// --- Debug ---
// Master switch for development-only helpers (e.g. weapon/shield hotkeys 1-5).
// Set to false before shipping a release build.
const DEBUG_MODE = true;

// --- Canvas ---
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;

// --- Touch controls ---
const TOUCH_PLAYER_OFFSET_Y = 35;
const TOUCH_PAUSE_BUTTON_X = 262;
const TOUCH_PAUSE_BUTTON_Y = 8;
const TOUCH_PAUSE_BUTTON_W = 50;
const TOUCH_PAUSE_BUTTON_H = 22;

// --- Colors ---
const COLORS = {
  BG_DARK: '#0a0a1a',
  BG_NEBULA: '#0d0d2b',
  STAR_DIM: '#555577',
  STAR_BRIGHT: '#aaaadd',
  STAR_WHITE: '#ffffff',
  PLAYER_BODY: '#3399ff',
  PLAYER_WING: '#2266cc',
  PLAYER_ENGINE: '#ff6633',
  PLAYER_COCKPIT: '#66ccff',
  PLAYER_BULLET: '#66eeff',
  PLAYER_BULLET_GLOW: '#33aacc',
  ENEMY_A: '#cc3333',
  ENEMY_A_DARK: '#881111',
  ENEMY_B: '#33cc66',
  ENEMY_B_DARK: '#118833',
  ENEMY_C: '#cc66ff',
  ENEMY_C_DARK: '#8833aa',
  ENEMY_BULLET: '#ff4466',
  ENEMY_BULLET_GLOW: '#cc2244',
  BOSS_CORE: '#ff3366',
  BOSS_ARMOR: '#6644aa',
  BOSS_ARMOR_DARK: '#442277',
  BOSS_GLOW: '#ff66aa',
  BOSS_BULLET: '#ffaa33',
  BOSS_BULLET_GLOW: '#cc7711',
  EXPLOSION_INNER: '#ffffff',
  EXPLOSION_MID: '#ffaa33',
  EXPLOSION_OUTER: '#ff4411',
  HIT_FLASH: '#ffffff',
  UI_WHITE: '#ffffff',
  UI_BLUE: '#88bbff',
  UI_YELLOW: '#ffdd44',
  UI_RED: '#ff4444',
  UI_GREEN: '#44ff88',
  UI_DIM: '#667788',
  POWERUP_GLOW: '#ffff44',
  POWERUP_BODY: '#44ddff',
  // Weapon / special item colors
  ITEM_TRIPLE: '#cc66ff',     // purple - TRIPLE BEAM
  ITEM_PIERCE: '#44aaff',     // blue - PIERCE LASER
  ITEM_FLAME: '#ff5544',      // red - FLAME VORTEX
  ITEM_SHIELD: '#44ff88',     // green - SHIELD BARRIER
  ITEM_LIFE: '#ffdd44',       // yellow - LIFE RECOVER
  ITEM_MAX_LIFE: '#ff66cc',   // pink - MAX LIFE UP
  LASER_BODY: '#66ddff',
  LASER_GLOW: '#2299ff',
  FLAME_BODY: '#ff7744',
  FLAME_GLOW: '#ffbb55',
  SHIELD_BODY: '#66ffaa',
  SHIELD_GLOW: '#33cc77',
  // New enemy colors
  ENEMY_SHIELD: '#dddd55',
  ENEMY_SHIELD_DARK: '#888822',
  ENEMY_SHIELD_PLATE: '#bbbbcc',
  ENEMY_SPLIT: '#ff8844',
  ENEMY_SPLIT_DARK: '#aa5522',
  ENEMY_FORM: '#55ddcc',
  ENEMY_FORM_DARK: '#229988',
  ENEMY_RUSH: '#ff5599',
  ENEMY_RUSH_DARK: '#aa2266',
  ENEMY_TURRET: '#aa88cc',
  ENEMY_TURRET_DARK: '#664488',
};

// --- Player ---
const PLAYER_SPEED = 4;
const PLAYER_MAX_LIVES = 3;
const PLAYER_STAGE_MAX_LIVES = 5;
const PLAYER_FIRE_INTERVAL = 8; // frames between shots
const PLAYER_BULLET_SPEED = 8;
const PLAYER_HIT_RADIUS = 6; // smaller than visual
const PLAYER_INVINCIBLE_FRAMES = 90; // 1.5 seconds at 60fps
const PLAYER_BLINK_INTERVAL = 4;

// --- Enemies ---
const ENEMY_A_HP = 1;
const ENEMY_A_SCORE = 100;
const ENEMY_A_SPEED = 2;
const ENEMY_A_RADIUS = 10;

const ENEMY_B_HP = 2;
const ENEMY_B_SCORE = 200;
const ENEMY_B_SPEED = 1.5;
const ENEMY_B_RADIUS = 12;
const ENEMY_B_WAVE_AMP = 40;
const ENEMY_B_WAVE_FREQ = 0.03;

const ENEMY_C_HP = 3;
const ENEMY_C_SCORE = 300;
const ENEMY_C_SPEED = 1;
const ENEMY_C_RADIUS = 14;
const ENEMY_C_FIRE_INTERVAL = 120; // frames
const ENEMY_C_BULLET_SPEED = 2.5;

// --- Boss ---
const BOSS_MAX_HP = 100;
const BOSS_SPEED = 1;
const BOSS_RADIUS = 40;
const BOSS_FIRE_INTERVAL_NORMAL = 60;
const BOSS_FIRE_INTERVAL_ENRAGED = 35;
const BOSS_ENRAGE_HP_THRESHOLD = 0.5;
const BOSS_BULLET_SPEED = 3;
const BOSS_APPEAR_TIME = 60; // seconds

// --- Spawn ---
const SPAWN_INTERVAL_MIN = 48; // frames (~0.8s)
const SPAWN_INTERVAL_MAX = 90; // frames (~1.5s)

// --- Game States ---
const STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
  STAGE_CLEAR: 'stageclear',
  CAMPAIGN_COMPLETE: 'campaigncomplete',
};

// --- Powerup ---
const POWERUP_DROP_CHANCE = 0.08; // 8% chance on enemy kill (Stage1 default; stages can override)
const POWERUP_SPEED = 1.5;
const POWERUP_RADIUS = 8;

// --- Weapons ---
const WEAPON_NORMAL = 'normal';
const WEAPON_TRIPLE = 'tripleBeam';
const WEAPON_PIERCE = 'pierceLaser';
const WEAPON_FLAME = 'flameVortex';
const ITEM_SHIELD = 'shieldBarrier';
const ITEM_LIFE = 'lifeRecover';
const ITEM_MAX_LIFE = 'maxLifeUp';
const WEAPON_DURATION = 20 * 60; // 20 seconds at 60fps
const SHIELD_DURATION = 20 * 60; // 20 seconds at 60fps

// TRIPLE BEAM
const TRIPLE_FIRE_INTERVAL = 10;
const TRIPLE_SIDE_SPEED = 2;

// PIERCE LASER
const LASER_FIRE_INTERVAL = 14;
const LASER_BULLET_SPEED = 11;
const LASER_DAMAGE = 2;
const LASER_BOSS_DAMAGE = 2;
const LASER_MOVE_PENALTY = 0.65; // player moves slower while equipped

// FLAME VORTEX
const FLAME_FIRE_INTERVAL = 12;
const FLAME_BULLET_SPEED = 5.6;
const FLAME_BULLET_RADIUS = 4;
const FLAME_DAMAGE = 1;
const FLAME_LIFE = 58;

// SHIELD BARRIER
const SHIELD_RADIUS = 34;

// --- New Enemies ---
const ENEMY_SHIELD_HP = 4;
const ENEMY_SHIELD_SCORE = 250;
const ENEMY_SHIELD_SPEED = 1.2;
const ENEMY_SHIELD_RADIUS = 13;
const ENEMY_SHIELD_FRONT_REDUCTION = 0.25; // frontal hits do 25% damage

const ENEMY_SPLIT_HP = 3;
const ENEMY_SPLIT_SCORE = 200;
const ENEMY_SPLIT_SPEED = 1.3;
const ENEMY_SPLIT_RADIUS = 13;
const ENEMY_SPLITLING_HP = 1;
const ENEMY_SPLITLING_SCORE = 50;
const ENEMY_SPLITLING_SPEED = 2.2;
const ENEMY_SPLITLING_RADIUS = 7;

const ENEMY_FORM_HP = 2;
const ENEMY_FORM_SCORE = 150;
const ENEMY_FORM_SPEED = 1.6;
const ENEMY_FORM_RADIUS = 10;

const ENEMY_RUSH_HP = 2;
const ENEMY_RUSH_SCORE = 250;
const ENEMY_RUSH_SPEED = 0.8;
const ENEMY_RUSH_RADIUS = 11;
const ENEMY_RUSH_CHARGE_TIME = 70;  // frames before dashing
const ENEMY_RUSH_DASH_SPEED = 6;

const ENEMY_TURRET_HP = 5;
const ENEMY_TURRET_SCORE = 300;
const ENEMY_TURRET_SPEED = 1;
const ENEMY_TURRET_RADIUS = 13;
const ENEMY_TURRET_STOP_Y = 60;     // settles near top
const ENEMY_TURRET_FIRE_INTERVAL = 90;
const ENEMY_TURRET_BULLET_SPEED = 2.6;

// --- Utility Functions ---

/**
 * Calculate distance between two points
 */
function dist(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check circle-circle collision
 */
function circleCollision(x1, y1, r1, x2, y2, r2) {
  return dist(x1, y1, x2, y2) < r1 + r2;
}

/**
 * Clamp a value between min and max
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Random integer between min (inclusive) and max (inclusive)
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Calculate angle from (x1,y1) to (x2,y2)
 */
function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Linear interpolation
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}
