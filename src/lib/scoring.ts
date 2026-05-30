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
  const builds = characterBuildsData as Record<string, CharacterBuildConfig>;
  return builds[String(avatarId)] ?? null;
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
  const weights = config?.substat_weights ?? DEFAULT_WEIGHTS;

  let fribbelsScore = 0;
  // Fribbels uses 6.48 in HSR. But for Genshin, using 7.8 (the max CV of a single roll)
  // maps the raw score precisely out to the community recognized "Crit Value equivalent".
  // This means a piece with only Crit stats will have a score identical to its CV.
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

  const total = character.artifacts.reduce((sum, art) => sum + art.score.total, 0) / artifactCount;

  return {
    total: Math.round(total * 10) / 10,
    grade: getGrade(total),
    artifactCount,
  };
}
