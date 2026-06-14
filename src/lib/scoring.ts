import type { Artifact, ScoreGrade, ArtifactSubstat } from "../types/artifact";
import type { CharacterData, BuildScore } from "../types/character";
import type { ScoringWeights, CharacterBuildConfig } from "../types/scoring";
import type { FightProp } from "../types/enka";
import {
  MAX_ROLL_VALUES,
  TOTAL_ROLLS_5_STAR,
  MAX_CV,
  SCORE_WEIGHTS,
  GRADE_THRESHOLDS,
  ELEMENT_DMG_MAP,
} from "./constants";
import characterBuildsData from "../data/character-builds.json";
import goProcessedData from "../../genshin_optimizer_processed_data.json";

// ── Character entry shape from the GO processed data ───────────────
interface GOCharacterEntry {
  name: string;
  display_name: string;
  element: string;
  weapon_type: string;
  rarity: number;
  avatar_id: string | null;
  scaling_attribute: string;
  scaling_stat: string;
  ascension_stat: string;
  ascension_bonus_curve: number[];
  substat_weights: ScoringWeights | null;
  main_stats_ideal: CharacterBuildConfig["main_stats_ideal"] | null;
  recommended_sets: string[];
  er_threshold: number | null;
  base_stats: { hp_base: number | null; atk_base: number | null; def_base: number | null };
  region: string | null;
  source: string;
  data_version: string;
}

type GOProcessedData = Record<string, GOCharacterEntry>;

const GO_DATA = goProcessedData as GOProcessedData;

// ── Build avatar-id → GO entry lookup ──────────────────────────────
const goByAvatarId = new Map<string, GOCharacterEntry>();
for (const entry of Object.values(GO_DATA)) {
  if (entry.avatar_id) {
    goByAvatarId.set(entry.avatar_id, entry);
  }
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  CRIT_RATE: 1.0,
  CRIT_DMG: 1.0,
  ATK_PERCENT: 0.5,
  HP_PERCENT: 0.0,
  DEF_PERCENT: 0.0,
  ELEMENTAL_MASTERY: 0.0,
  ENERGY_RECHARGE: 0.0,
  HEALING_BONUS: 0.0,
  PHYSICAL_DMG: 0.0,
  ELEMENTAL_DMG: 0.0,
  FLAT_ATK: 0.1,
  FLAT_HP: 0.0,
  FLAT_DEF: 0.0,
};

// ── Max roll lookup ──

export function getMaxRoll(statKey: string): number {
  return MAX_ROLL_VALUES[statKey] ?? 0;
}

// ── Roll quality ──

export function computeRollQuality(value: number, max: number): ArtifactSubstat["rollQuality"] {
  if (max <= 0) return "medium";
  const ratio = value / (max * 4); // rough ratio against 4 max rolls
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}

// ── Roll Value (RV) ──

export function computeRV(substats: ArtifactSubstat[]): number {
  let totalRolls = 0;
  for (const sub of substats) {
    if (sub.maxRoll > 0) {
      totalRolls += sub.value / sub.maxRoll;
    }
  }
  return (totalRolls / TOTAL_ROLLS_5_STAR) * 100;
}

// ── Crit Value (CV) ──

export function computeCV(substats: ArtifactSubstat[]): number {
  let cv = 0;
  for (const sub of substats) {
    if (sub.statKey === "FIGHT_PROP_CRITICAL") {
      cv += sub.value * 2;
    } else if (sub.statKey === "FIGHT_PROP_CRITICAL_HURT") {
      cv += sub.value;
    }
  }
  return cv;
}

// ── Weighted Substats Efficiency (WSE) ──

function resolveWeightKey(statKey: string): keyof ScoringWeights | null {
  const mapping: Record<string, keyof ScoringWeights> = {
    FIGHT_PROP_CRITICAL: "CRIT_RATE",
    FIGHT_PROP_CRITICAL_HURT: "CRIT_DMG",
    FIGHT_PROP_ATTACK_PERCENT: "ATK_PERCENT",
    FIGHT_PROP_HP_PERCENT: "HP_PERCENT",
    FIGHT_PROP_DEFENSE_PERCENT: "DEF_PERCENT",
    FIGHT_PROP_ELEMENT_MASTERY: "ELEMENTAL_MASTERY",
    FIGHT_PROP_CHARGE_EFFICIENCY: "ENERGY_RECHARGE",
    FIGHT_PROP_HEAL_ADD: "HEALING_BONUS",
    FIGHT_PROP_PHYSICAL_ADD_HURT: "PHYSICAL_DMG",
    FIGHT_PROP_FIRE_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ELEC_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_WATER_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_WIND_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ICE_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ROCK_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_GRASS_ADD_HURT: "ELEMENTAL_DMG",
    FIGHT_PROP_ATTACK: "FLAT_ATK",
    FIGHT_PROP_HP: "FLAT_HP",
    FIGHT_PROP_DEFENSE: "FLAT_DEF",
  };
  return mapping[statKey] ?? null;
}

function getBuildConfig(avatarId: number): CharacterBuildConfig | null {
  const idStr = String(avatarId);

  // ── 1. Primary: GO processed data (authoritative + merged build configs) ──
  const goEntry = goByAvatarId.get(idStr);
  if (goEntry?.substat_weights) {
    return {
      name: goEntry.display_name,
      substat_weights: goEntry.substat_weights,
      main_stats_ideal: goEntry.main_stats_ideal ?? {},
      recommended_sets: goEntry.recommended_sets,
      er_threshold: goEntry.er_threshold ?? undefined,
    };
  }

  // ── 2. Fallback: GO data is present but build config is not filled yet ──
  //    We still return metadata-rich info so that the scoring can use default
  //    weights informed by the character's scaling_attribute.
  if (goEntry) {
    return {
      name: goEntry.display_name,
      substat_weights: deriveWeightsFromScaling(goEntry),
      main_stats_ideal: {},
      recommended_sets: [],
      er_threshold: undefined,
    };
  }

  // ── 3. Legacy fallback: old character-builds.json ──
  const builds = characterBuildsData as Record<string, CharacterBuildConfig>;
  return builds[idStr] ?? null;
}

/**
 * Derive sensible default substat weights when no explicit build config
 * is available.  Uses the character's ascension scaling stat to bias
 * weights in the right direction.
 */
function deriveWeightsFromScaling(entry: GOCharacterEntry): ScoringWeights {
  const weights = { ...DEFAULT_WEIGHTS };

  // Every DPS-oriented character benefits from crit
  weights.CRIT_RATE = 1.0;
  weights.CRIT_DMG = 1.0;

  switch (entry.scaling_stat) {
    case "HP_PERCENT":
      weights.HP_PERCENT = 0.8;
      weights.FLAT_HP = 0.15;
      break;
    case "DEF_PERCENT":
      weights.DEF_PERCENT = 0.8;
      weights.FLAT_DEF = 0.15;
      break;
    case "ELEMENTAL_MASTERY":
      weights.ELEMENTAL_MASTERY = 1.0;
      weights.ATK_PERCENT = 0.3;
      break;
    case "ENERGY_RECHARGE":
      weights.ENERGY_RECHARGE = 0.8;
      weights.ATK_PERCENT = 0.4;
      break;
    case "HEALING_BONUS":
      weights.HEALING_BONUS = 0.7;
      weights.HP_PERCENT = 0.6;
      weights.ATK_PERCENT = 0.4;
      break;
    default:
      // ATK_PERCENT, CRIT_RATE, CRIT_DMG, elemental DMG → ATK scaling
      weights.ATK_PERCENT = 0.7;
      weights.FLAT_ATK = 0.15;
      break;
  }

  return weights;
}

export function computeWSE(substats: ArtifactSubstat[], avatarId: number): number {
  const config = getBuildConfig(avatarId);
  const weights = config?.substat_weights ?? DEFAULT_WEIGHTS;

  let weightedRolls = 0;
  let maxWeightedRolls = 0;

  for (const sub of substats) {
    if (sub.maxRoll <= 0) continue;

    const weightKey = resolveWeightKey(sub.statKey);
    const weight = weightKey ? (weights[weightKey] ?? 0) : 0;
    const rolls = sub.value / sub.maxRoll;

    weightedRolls += rolls * weight;
    // Max possible: 2.25 perfect rolls scaled by this stat's weight
    maxWeightedRolls += 2.25 * weight;
  }

  if (maxWeightedRolls === 0) return 0;
  return (weightedRolls / maxWeightedRolls) * 100;
}

// ── Main Stat Correctness ──

export function checkMainStat(
  slot: string,
  mainStatKey: FightProp,
  avatarId: number,
): number {
  const config = getBuildConfig(avatarId);
  if (!config?.main_stats_ideal) return 1.0; // No config → assume correct

  const idealSlot = config.main_stats_ideal as Record<string, string[] | undefined>;
  const ideal = idealSlot[slot];

  if (!ideal) return 1.0; // Flower/Plume always "correct"

  // Build a list of stat keys to match against
  const statKeysToCheck: string[] = [mainStatKey];
  const mappedKey = resolveWeightKey(mainStatKey);
  if (mappedKey) statKeysToCheck.push(mappedKey);

  // If main stat is an elemental damage bonus, also check without the element prefix
  if (mainStatKey in ELEMENT_DMG_MAP) {
    statKeysToCheck.push("ELEMENTAL_DMG");
    statKeysToCheck.push(`${ELEMENT_DMG_MAP[mainStatKey].toUpperCase()}_DMG`);
  }

  for (const key of statKeysToCheck) {
    if (ideal.includes(key)) return 1.0;
  }

  // Check if stat is "usable" (ATK%, DEF%, HP% when char scales off something else)
  const usableFallbacks = ["ATK_PERCENT", "DEF_PERCENT", "HP_PERCENT"];
  for (const key of statKeysToCheck) {
    if (usableFallbacks.includes(key as string)) return 0.6;
  }

  return 0.3;
}

// ── Set Bonus Multiplier ──

export function computeSetBonusMultiplier(setId: string, slot: string): number {
  // Only Goblet can be off-set without penalty in Genshin (common practice)
  if (slot === "GOBLET") return 1.0;
  // Flower, Plume, Sands, Circlet are penalized if off-set
  return 1.0; // We don't penalize yet — set bonus detection is done at build level
}

// ── Grade mapping ──

export function getGrade(score: number): ScoreGrade {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.grade as ScoreGrade;
    }
  }
  return "F";
}

// ── Aggregate artifact score ──

export function scoreArtifact(
  artifact: Artifact,
  avatarId: number,
): Artifact {
  const config = getBuildConfig(avatarId);
  const weights = { ...(config?.substat_weights ?? DEFAULT_WEIGHTS) };

  // ── Main stat exclusion (Fribbels-style) ──
  // If the main stat is a weighted stat, it CANNOT appear as a substat.
  // Zero out its weight so the piece isn't penalized for missing an impossible substat.
  const mainStatWeightKey = resolveWeightKey(artifact.mainStat.statKey);
  if (mainStatWeightKey && weights[mainStatWeightKey] !== undefined) {
    weights[mainStatWeightKey] = 0;
  }

  let fribbelsScore = 0;
  // Fribbels uses 6.48 in HSR. But for Genshin, using 7.8 (the max CV of a single roll)
  // maps the raw score precisely out to the community recognized "Crit Value equivalent".
  const FRIBBELS_CONSTANT = 7.8;

  for (const sub of artifact.substats) {
    if (sub.maxRoll <= 0) continue;

    const weightKey = resolveWeightKey(sub.statKey);
    const weight = weightKey ? (weights[weightKey] ?? 0) : 0;
    
    // Number of max rolls this substat represents
    const rolls = sub.value / sub.maxRoll;
    fribbelsScore += rolls * weight * FRIBBELS_CONSTANT;
  }

  const rv = computeRV(artifact.substats);
  const cv = computeCV(artifact.substats);
  const cvNormalized = Math.min(cv / MAX_CV, 1.0);
  const wse = (fribbelsScore / (9 * FRIBBELS_CONSTANT)) * 100;
  const mainStatMultiplier = checkMainStat(artifact.slot, artifact.mainStat.statKey, avatarId);
  const setBonusMultiplier = computeSetBonusMultiplier(artifact.setId, artifact.slot);

  // In Fribbels, Sands/Goblet/Circlet naturally have lower possible substat combos
  // when their main stat takes up a highly weighted stat pool slot (e.g. ATK% Sands).
  // We offset this by adding exactly 1 max roll of score (7.8) if the main stat is ideal.
  if (["SANDS", "GOBLET", "CIRCLET"].includes(artifact.slot) && mainStatMultiplier === 1.0) {
    fribbelsScore += FRIBBELS_CONSTANT;
  }

  const adjustedTotal = fribbelsScore * mainStatMultiplier * setBonusMultiplier;
  const grade = getGrade(adjustedTotal);

  return {
    ...artifact,
    mainStat: {
      ...artifact.mainStat,
      isCorrect: mainStatMultiplier === 1.0,
      isRecommended: mainStatMultiplier >= 0.6,
    },
    score: {
      rv,
      cv,
      cvNormalized,
      wse,
      mainStatMultiplier,
      setBonusMultiplier,
      total: Math.round(adjustedTotal * 10) / 10,
      grade,
    },
  };
}

// ── Build score ──

export function scoreBuild(character: CharacterData): BuildScore {
  const artifactCount = character.artifacts.length;

  if (artifactCount === 0) {
    return { total: 0, grade: "F", artifactCount: 0 };
  }

  const avgScore = character.artifacts.reduce((sum, art) => sum + art.score.total, 0) / artifactCount;

  // ── Set bonus multiplier ──
  // Reward builds that use the character's recommended artifact sets.
  let setMultiplier = 1.0;
  const config = getBuildConfig(character.avatarId);
  if (config?.recommended_sets && config.recommended_sets.length > 0) {
    // Count pieces per set
    const setCounts = new Map<string, number>();
    for (const art of character.artifacts) {
      setCounts.set(art.setId, (setCounts.get(art.setId) ?? 0) + 1);
    }

    // Check how many pieces match recommended sets
    const matchingCount = config.recommended_sets.reduce((sum, setId) =>
      sum + (setCounts.get(setId) ?? 0), 0
    );

    // Check if the character has any 4pc set at all
    const hasAny4pc = Array.from(setCounts.values()).some(c => c >= 4);

    if (matchingCount >= 4) {
      setMultiplier = 1.0;   // 4pc of recommended set — full score
    } else if (matchingCount >= 2) {
      setMultiplier = 0.93;  // 2pc of recommended set
    } else if (hasAny4pc) {
      setMultiplier = 0.88;  // 4pc of some set (not recommended but still complete)
    } else if (matchingCount > 0) {
      setMultiplier = 0.85;  // 1 pc match
    } else {
      setMultiplier = 0.82;  // No matching pieces at all
    }
  }

  const total = Math.round(avgScore * setMultiplier * 10) / 10;

  return {
    total,
    grade: getGrade(total),
    artifactCount,
  };
}
