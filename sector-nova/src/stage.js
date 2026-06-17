// ============================================================
// SECTOR NOVA - Stage Management
// ------------------------------------------------------------
// Each stage describes how it plays: its name, background, enemy
// spawn profile, item drop rate, boss and clear condition.
//
// Stage 1-5 are implemented using the shared enemy, item, boss,
// and stage-flow systems.
// ============================================================

const STAGES = {
  // --------------------------------------------------------
  // Stage 1: NEBULA GATE - the original basic stage.
  // Clearable with the normal shot alone.
  // --------------------------------------------------------
  1: {
    stageNumber: 1,
    stageName: 'NEBULA GATE',
    backgroundType: 'nebula',
    itemDropRate: 0.08,
    powerupWeights: {
      [WEAPON_TRIPLE]: 0.20,
      [WEAPON_PIERCE]: 0.18,
      [WEAPON_FLAME]: 0.14,
      [ITEM_SHIELD]: 0.28,
      [ITEM_LIFE]: 0.12,
      [ITEM_MAX_LIFE]: 0.08,
    },
    bossType: 'orbCore',
    bossAppearTime: 60, // seconds of survival before the boss arrives
    clearCondition: { type: 'defeatBoss' },
    implemented: true,
    enemySpawnPattern: {
      weights: { A: 0.55, B: 0.30, C: 0.15 },
      intervalMin: SPAWN_INTERVAL_MIN,
      intervalMax: SPAWN_INTERVAL_MAX,
      pairChance: 0.3,
      formationChance: 0,
    },
  },

  // --------------------------------------------------------
  // Stage 2: METEOR BELT - introduces items, special weapons,
  // and the shield barrier. Sprinkles in the new enemy types and
  // uses a higher drop rate.
  // --------------------------------------------------------
  2: {
    stageNumber: 2,
    stageName: 'METEOR BELT',
    backgroundType: 'meteor',
    itemDropRate: 0.20,
    powerupWeights: {
      [WEAPON_TRIPLE]: 0.18,
      [WEAPON_PIERCE]: 0.18,
      [WEAPON_FLAME]: 0.14,
      [ITEM_SHIELD]: 0.30,
      [ITEM_LIFE]: 0.12,
      [ITEM_MAX_LIFE]: 0.08,
    },
    bossType: 'meteorGuardian',
    bossAppearTime: 55,
    clearCondition: { type: 'defeatBoss' },
    implemented: true,
    enemySpawnPattern: {
      weights: { A: 0.34, B: 0.16, C: 0.10, SPLIT: 0.16, FORM: 0.10, RUSH: 0.08, TURRET: 0.06 },
      intervalMin: 34,   // denser than Stage 1
      intervalMax: 60,
      pairChance: 0.5,
      formationChance: 0.12,
    },
  },

  // --------------------------------------------------------
  // Stage 3: IRON SWARM - durable enemies, splitters, formations.
  // --------------------------------------------------------
  3: {
    stageNumber: 3,
    stageName: 'IRON SWARM',
    backgroundType: 'iron',
    itemDropRate: 0.22,
    powerupWeights: {
      [WEAPON_TRIPLE]: 0.20,
      [WEAPON_PIERCE]: 0.22,
      [WEAPON_FLAME]: 0.12,
      [ITEM_SHIELD]: 0.25,
      [ITEM_LIFE]: 0.13,
      [ITEM_MAX_LIFE]: 0.08,
    },
    bossType: 'shieldCarrier',
    bossAppearTime: 60,
    clearCondition: { type: 'defeatBoss' },
    implemented: true,
    enemySpawnPattern: {
      weights: { A: 0.15, B: 0.10, SHIELD: 0.28, SPLIT: 0.22, FORM: 0.20, C: 0.05 },
      intervalMin: 34,
      intervalMax: 58,
      pairChance: 0.35,
      formationChance: 0.25,
    },
  },

  // --------------------------------------------------------
  // Stage 4: STORM ZONE - aimed fire, rushers, and turrets.
  // --------------------------------------------------------
  4: {
    stageNumber: 4,
    stageName: 'STORM ZONE',
    backgroundType: 'storm',
    itemDropRate: 0.24,
    powerupWeights: {
      [WEAPON_TRIPLE]: 0.16,
      [WEAPON_PIERCE]: 0.16,
      [WEAPON_FLAME]: 0.16,
      [ITEM_SHIELD]: 0.30,
      [ITEM_LIFE]: 0.14,
      [ITEM_MAX_LIFE]: 0.08,
    },
    bossType: 'stormCore',
    bossAppearTime: 65,
    clearCondition: { type: 'defeatBoss' },
    implemented: true,
    enemySpawnPattern: {
      weights: { A: 0.10, B: 0.10, C: 0.22, RUSH: 0.25, TURRET: 0.23, FORM: 0.10 },
      intervalMin: 32,
      intervalMax: 54,
      pairChance: 0.35,
      formationChance: 0.15,
    },
  },

  // --------------------------------------------------------
  // Stage 5: NEBULA HEART - full campaign mix, final boss.
  // --------------------------------------------------------
  5: {
    stageNumber: 5,
    stageName: 'NEBULA HEART',
    backgroundType: 'core',
    itemDropRate: 0.26,
    powerupWeights: {
      [WEAPON_TRIPLE]: 0.17,
      [WEAPON_PIERCE]: 0.17,
      [WEAPON_FLAME]: 0.16,
      [ITEM_SHIELD]: 0.28,
      [ITEM_LIFE]: 0.14,
      [ITEM_MAX_LIFE]: 0.08,
    },
    bossType: 'nebulaHeart',
    bossAppearTime: 70,
    clearCondition: { type: 'defeatBoss' },
    implemented: true,
    enemySpawnPattern: {
      weights: { A: 0.12, B: 0.08, C: 0.12, SHIELD: 0.14, SPLIT: 0.14, FORM: 0.14, RUSH: 0.14, TURRET: 0.12 },
      intervalMin: 30,
      intervalMax: 52,
      pairChance: 0.45,
      formationChance: 0.2,
    },
  },
};

const MAX_STAGE = 5;
const STAGE_SAVE_KEY = 'sectorNova_unlockedStage';
const BEST_SCORE_KEY = 'sectorNova_bestScore';
const BEST_CLEAR_SCORE_KEY = 'sectorNova_bestClearScore';

function highestImplementedStage() {
  let highest = 1;
  for (const key in STAGES) {
    const stage = STAGES[key];
    if (stage.implemented) {
      highest = Math.max(highest, stage.stageNumber);
    }
  }
  return highest;
}

function loadUnlockedStage() {
  try {
    const saved = window.localStorage.getItem(STAGE_SAVE_KEY);
    const parsed = parseInt(saved, 10);
    if (!Number.isFinite(parsed)) return 1;
    return clamp(parsed, 1, highestImplementedStage());
  } catch (e) {
    return 1;
  }
}

function saveUnlockedStage(stageNumber) {
  const unlocked = clamp(stageNumber, 1, highestImplementedStage());
  try {
    window.localStorage.setItem(STAGE_SAVE_KEY, String(unlocked));
  } catch (e) {
    // localStorage can be unavailable in private or restricted contexts.
  }
  return unlocked;
}

function getUnlockedStage() {
  return loadUnlockedStage();
}

function loadScore(key) {
  try {
    const saved = window.localStorage.getItem(key);
    const parsed = parseInt(saved, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
  } catch (e) {
    return 0;
  }
}

function saveScoreIfHigher(key, score) {
  const normalized = Math.max(0, Math.floor(Number(score) || 0));
  const current = loadScore(key);
  if (normalized <= current) return false;

  try {
    window.localStorage.setItem(key, String(normalized));
  } catch (e) {
    // localStorage can be unavailable in private or restricted contexts.
  }
  return true;
}

function loadBestScore() {
  return loadScore(BEST_SCORE_KEY);
}

function saveBestScore(score) {
  return saveScoreIfHigher(BEST_SCORE_KEY, score);
}

function loadBestClearScore() {
  return loadScore(BEST_CLEAR_SCORE_KEY);
}

function saveBestClearScore(score) {
  return saveScoreIfHigher(BEST_CLEAR_SCORE_KEY, score);
}

/**
 * Tracks which stage is active and exposes its config.
 */
class StageManager {
  constructor() {
    this.current = 1;
  }

  reset() {
    this.current = 1;
  }

  setStage(stageNumber) {
    const stage = STAGES[stageNumber];
    if (!stage || !stage.implemented) return false;
    this.current = stageNumber;
    return true;
  }

  get config() {
    return STAGES[this.current];
  }

  /**
   * True if a *next* playable (implemented) stage exists.
   */
  hasNextImplemented() {
    const next = STAGES[this.current + 1];
    return !!(next && next.implemented);
  }

  /**
   * Advance to the next stage. Returns the new config, or null if
   * there is no further implemented stage (campaign complete).
   */
  advance() {
    if (this.hasNextImplemented()) {
      this.current++;
      return this.config;
    }
    return null;
  }
}
