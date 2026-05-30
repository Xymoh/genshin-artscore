/**
 * Max roll values for 5-star artifact substats.
 * These represent the highest possible value for a single substat roll at level 0.
 * Source: Genshin community datamining (Genshin Optimizer)
 */
export const MAX_ROLL_VALUES: Record<string, number> = {
  FIGHT_PROP_ATTACK_PERCENT: 5.83,
  FIGHT_PROP_HP_PERCENT: 5.83,
  FIGHT_PROP_DEFENSE_PERCENT: 7.29,
  FIGHT_PROP_CRITICAL: 3.89,
  FIGHT_PROP_CRITICAL_HURT: 7.77,
  FIGHT_PROP_ELEMENT_MASTERY: 23.31,
  FIGHT_PROP_CHARGE_EFFICIENCY: 6.48,
  FIGHT_PROP_HEAL_ADD: 4.49,
  FIGHT_PROP_PHYSICAL_ADD_HURT: 0, // Main stat only, not a substat
  FIGHT_PROP_FIRE_ADD_HURT: 0,
  FIGHT_PROP_ELEC_ADD_HURT: 0,
  FIGHT_PROP_WATER_ADD_HURT: 0,
  FIGHT_PROP_WIND_ADD_HURT: 0,
  FIGHT_PROP_ICE_ADD_HURT: 0,
  FIGHT_PROP_ROCK_ADD_HURT: 0,
  FIGHT_PROP_GRASS_ADD_HURT: 0,
  FIGHT_PROP_ATTACK: 19.45,
  FIGHT_PROP_HP: 298.75,
  FIGHT_PROP_DEFENSE: 23.15,
};

/** Number of substat upgrades a 5-star artifact gets (4 subs at +0 → 5 upgrades at +4/+8/+12/+16/+20) */
export const TOTAL_ROLLS_5_STAR = 9;

/** Max CV value for normalization (50 CV = god piece) */
export const MAX_CV = 50;

/** Scoring formula weights */
export const SCORE_WEIGHTS = {
  RV: 0.3,
  CV: 0.15,
  WSE: 0.4,
  MAIN_STAT: 0.0, // applied as multiplier, not additive weight
  SET_BONUS: 0.0, // applied as multiplier
} as const;

/** Score grade thresholds mimicking Fribbels HSR Optimizer */
export const GRADE_THRESHOLDS: Array<{ grade: string; min: number; color: string }> = [
  { grade: "WTF", min: 60, color: "#1fe03f" }, // Often a custom color or rainbow, we'll use bright neon green
  { grade: "OP", min: 50, color: "#de3a35" },  // Fribbels uses Red for OP
  { grade: "SSS", min: 45, color: "#ff8c00" }, // Orange/Gold
  { grade: "SS", min: 40, color: "#ffbd59" },  // Light Orange
  { grade: "S", min: 35, color: "#ffd700" },   // Yellow
  { grade: "A", min: 30, color: "#a855f7" },   // Purple
  { grade: "B", min: 24, color: "#3b82f6" },   // Blue
  { grade: "C", min: 16, color: "#22c55e" },   // Green
  { grade: "D", min: 8, color: "#6b7280" },   // Gray
  { grade: "F", min: 0, color: "#4b5563" },
];

/** Map Enka equipType to our slot name */
export const SLOT_MAP: Record<string, string> = {
  EQUIP_BRACER: "FLOWER",
  EQUIP_NECKLACE: "PLUME",
  EQUIP_SHOES: "SANDS",
  EQUIP_RING: "GOBLET",
  EQUIP_DRESS: "CIRCLET",
};

/** Slot display order */
export const SLOT_ORDER = ["FLOWER", "PLUME", "SANDS", "GOBLET", "CIRCLET"] as const;

/** Map element DMG bonus props to a canonical element name */
export const ELEMENT_DMG_MAP: Record<string, string> = {
  FIGHT_PROP_FIRE_ADD_HURT: "Pyro",
  FIGHT_PROP_ELEC_ADD_HURT: "Electro",
  FIGHT_PROP_WATER_ADD_HURT: "Hydro",
  FIGHT_PROP_WIND_ADD_HURT: "Anemo",
  FIGHT_PROP_ICE_ADD_HURT: "Cryo",
  FIGHT_PROP_ROCK_ADD_HURT: "Geo",
  FIGHT_PROP_GRASS_ADD_HURT: "Dendro",
};
