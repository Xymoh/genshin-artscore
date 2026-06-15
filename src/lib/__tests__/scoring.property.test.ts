import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { ArtifactSubstat } from "../../types/artifact";
import type { ScoringWeights } from "../../types/scoring";
import type { FightProp } from "../../types/enka";
import {
  computeWeightedPotential,
  computeIdealPotential,
  computePotentialPercent,
  getGrade,
} from "../scoring";
import { POTENTIAL_SCALES, MAX_ROLL_VALUES } from "../constants";

// ── Shared Constants for Generators ──

/** Substat keys that can appear on artifacts (non-zero max roll values) */
const SUBSTAT_KEYS: FightProp[] = [
  "FIGHT_PROP_HP",
  "FIGHT_PROP_HP_PERCENT",
  "FIGHT_PROP_ATTACK",
  "FIGHT_PROP_ATTACK_PERCENT",
  "FIGHT_PROP_DEFENSE",
  "FIGHT_PROP_DEFENSE_PERCENT",
  "FIGHT_PROP_CRITICAL",
  "FIGHT_PROP_CRITICAL_HURT",
  "FIGHT_PROP_ELEMENT_MASTERY",
  "FIGHT_PROP_CHARGE_EFFICIENCY",
];

/** Main stat keys for selectable slots */
const MAIN_STAT_KEYS: FightProp[] = [
  "FIGHT_PROP_HP_PERCENT",
  "FIGHT_PROP_ATTACK_PERCENT",
  "FIGHT_PROP_DEFENSE_PERCENT",
  "FIGHT_PROP_ELEMENT_MASTERY",
  "FIGHT_PROP_CHARGE_EFFICIENCY",
  "FIGHT_PROP_CRITICAL",
  "FIGHT_PROP_CRITICAL_HURT",
  "FIGHT_PROP_HEAL_ADD",
  "FIGHT_PROP_PHYSICAL_ADD_HURT",
  "FIGHT_PROP_FIRE_ADD_HURT",
  "FIGHT_PROP_ELEC_ADD_HURT",
  "FIGHT_PROP_WATER_ADD_HURT",
  "FIGHT_PROP_WIND_ADD_HURT",
  "FIGHT_PROP_ICE_ADD_HURT",
  "FIGHT_PROP_ROCK_ADD_HURT",
  "FIGHT_PROP_GRASS_ADD_HURT",
];

// ── Arbitraries / Generators ──

/** Generate a random substat with a valid key, value between 0 and 4× max roll */
const arbSubstat: fc.Arbitrary<ArtifactSubstat> = fc
  .record({
    statKey: fc.constantFrom(...SUBSTAT_KEYS),
    rollMultiplier: fc.double({ min: 0.7, max: 2.5, noNaN: true }),
  })
  .map(({ statKey, rollMultiplier }) => {
    const maxRoll = MAX_ROLL_VALUES[statKey] ?? 0;
    const value = maxRoll * rollMultiplier;
    return {
      statKey,
      displayName: statKey,
      shortName: statKey,
      value,
      isPercentage: !statKey.includes("FIGHT_PROP_HP") || statKey.includes("PERCENT"),
      maxRoll,
      rollCount: rollMultiplier,
      rollQuality: "high" as const,
    };
  });

/** Generate an array of 1–4 unique substats */
const arbSubstats: fc.Arbitrary<ArtifactSubstat[]> = fc
  .uniqueArray(arbSubstat, { minLength: 1, maxLength: 4, comparator: (a, b) => a.statKey === b.statKey })

/** Generate ScoringWeights with values between 0.0 and 1.5 */
const arbScoringWeights: fc.Arbitrary<ScoringWeights> = fc.record({
  CRIT_RATE: fc.double({ min: 0, max: 1.5, noNaN: true }),
  CRIT_DMG: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ATK_PERCENT: fc.double({ min: 0, max: 1.5, noNaN: true }),
  HP_PERCENT: fc.double({ min: 0, max: 1.5, noNaN: true }),
  DEF_PERCENT: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ELEMENTAL_MASTERY: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ENERGY_RECHARGE: fc.double({ min: 0, max: 1.5, noNaN: true }),
  HEALING_BONUS: fc.double({ min: 0, max: 1.5, noNaN: true }),
  PHYSICAL_DMG: fc.double({ min: 0, max: 1.5, noNaN: true }),
  ELEMENTAL_DMG: fc.double({ min: 0, max: 1.5, noNaN: true }),
  FLAT_ATK: fc.double({ min: 0, max: 1.5, noNaN: true }),
  FLAT_HP: fc.double({ min: 0, max: 1.5, noNaN: true }),
  FLAT_DEF: fc.double({ min: 0, max: 1.5, noNaN: true }),
});

/** Generate ScoringWeights with at least one non-zero weight */
const arbNonZeroWeights: fc.Arbitrary<ScoringWeights> = arbScoringWeights.filter(
  (w) => Object.values(w).some((v) => v > 0)
);

/** Generate a main stat key */
const arbMainStatKey: fc.Arbitrary<FightProp> = fc.constantFrom(...MAIN_STAT_KEYS);

// ── Property Test Suite ──

describe("Scoring Engine - Property-Based Tests", () => {
  it("placeholder: test infrastructure is working", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (n) => {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(100);
      }),
      { numRuns: 10 },
    );
  });
});
