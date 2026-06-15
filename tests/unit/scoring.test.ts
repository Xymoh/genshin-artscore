import { describe, it, expect } from "vitest";
import { computeRV, computeCV, computeWSE, getGrade } from "../../src/lib/scoring";
import type { ArtifactSubstat } from "../../src/types/artifact";

function makeSubstat(
  key: string,
  value: number,
  maxRoll: number,
): ArtifactSubstat {
  return {
    statKey: key as ArtifactSubstat["statKey"],
    displayName: key,
    shortName: key,
    value,
    isPercentage: true,
    maxRoll,
    rollCount: maxRoll > 0 ? value / maxRoll : 0,
    rollQuality: "high",
  };
}

describe("computeRV", () => {
  it("returns 100 for a perfect artifact", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2.25, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2.25, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83 * 2.25, 5.83),
      makeSubstat("FIGHT_PROP_CHARGE_EFFICIENCY", 6.48 * 2.25, 6.48),
    ];
    // Each stat = 2.25 rolls, total = 9.0, RV = 9/9 * 100
    const rv = computeRV(substats);
    expect(rv).toBeCloseTo(100, 0);
  });

  it("returns ~65 for the example in the spec", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 7.8, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 15.5, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.3, 5.83),
      makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", 23.0, 23.31),
    ];
    const rv = computeRV(substats);
    // Rolls: 7.8/3.89≈2.0 + 15.5/7.77≈1.99 + 5.3/5.83≈0.91 + 23/23.31≈0.99 = 5.89
    // RV = 5.89/9*100 ≈ 65.4
    expect(rv).toBeCloseTo(65.5, 1);
  });

  it("returns 0 for empty substats", () => {
    expect(computeRV([])).toBe(0);
  });
});

describe("computeCV", () => {
  it("computes CV = CR*2 + CDMG", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 10.0, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 20.0, 7.77),
    ];
    expect(computeCV(substats)).toBeCloseTo(40.0, 1);
  });

  it("returns 0 for no crit substats", () => {
    const substats = [makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 10.0, 5.83)];
    expect(computeCV(substats)).toBe(0);
  });
});

describe("computeWSE", () => {
  it("returns high score for Diluc with perfect crit substats", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2.25, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2.25, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83 * 2.25, 5.83),
      makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", 23.31 * 2.25, 23.31),
    ];
    const wse = computeWSE(substats, 10000016); // Diluc
    // Diluc weights: CR=1.0, CD=1.0, ATK%=0.7, EM=0.5
    // Max possible ≈ 2.25*(1.0+1.0+0.7+0.5) = 2.25*3.2 = 7.2
    // Actual ≈ 2.25*1.0 + 2.25*1.0 + 2.25*0.7 + 2.25*0.5 = 2.25*3.2 = 7.2
    // WSE = 100%
    expect(wse).toBeCloseTo(100, 0);
  });

  it("returns low score for Sucrose with crit substats", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83, 5.83),
      makeSubstat("FIGHT_PROP_ELEMENT_MASTERY", 23.31, 23.31),
    ];
    const wse = computeWSE(substats, 10000043); // Sucrose (only cares about EM)
    // WSE should be very low since CR=0 weight, CD=0 weight, ATK%=0, EM=1.0
    expect(wse).toBeLessThan(50);
  });

  it("uses default weights for unknown character", () => {
    const substats: ArtifactSubstat[] = [
      makeSubstat("FIGHT_PROP_CRITICAL", 3.89 * 2, 3.89),
      makeSubstat("FIGHT_PROP_CRITICAL_HURT", 7.77 * 2, 7.77),
      makeSubstat("FIGHT_PROP_ATTACK_PERCENT", 5.83, 5.83),
      makeSubstat("FIGHT_PROP_HP_PERCENT", 10.0, 5.83),
    ];
    // Unknown character: generic weights (CR=1, CD=1, ATK%=0.5, HP%=0)
    const wse = computeWSE(substats, 99999999);
    expect(wse).toBeGreaterThan(0);
    expect(wse).toBeLessThan(100);
  });
});

describe("getGrade", () => {
  it("returns correct grades", () => {
    expect(getGrade(180)).toBe("WTF+");
    expect(getGrade(165)).toBe("WTF");
    expect(getGrade(155)).toBe("SSS+");
    expect(getGrade(145)).toBe("SSS");
    expect(getGrade(135)).toBe("SS+");
    expect(getGrade(125)).toBe("SS");
    expect(getGrade(115)).toBe("S+");
    expect(getGrade(105)).toBe("S");
    expect(getGrade(95)).toBe("A+");
    expect(getGrade(85)).toBe("A");
    expect(getGrade(75)).toBe("B+");
    expect(getGrade(65)).toBe("B");
    expect(getGrade(55)).toBe("C+");
    expect(getGrade(45)).toBe("C");
    expect(getGrade(35)).toBe("D+");
    expect(getGrade(25)).toBe("D");
    expect(getGrade(15)).toBe("F+");
    expect(getGrade(5)).toBe("F");
  });

  it("handles boundary values", () => {
    expect(getGrade(170)).toBe("WTF+");
    expect(getGrade(160)).toBe("WTF");
    expect(getGrade(150)).toBe("SSS+");
    expect(getGrade(140)).toBe("SSS");
    expect(getGrade(130)).toBe("SS+");
    expect(getGrade(120)).toBe("SS");
    expect(getGrade(110)).toBe("S+");
    expect(getGrade(100)).toBe("S");
    expect(getGrade(90)).toBe("A+");
    expect(getGrade(80)).toBe("A");
    expect(getGrade(70)).toBe("B+");
    expect(getGrade(60)).toBe("B");
    expect(getGrade(50)).toBe("C+");
    expect(getGrade(40)).toBe("C");
    expect(getGrade(30)).toBe("D+");
    expect(getGrade(20)).toBe("D");
    expect(getGrade(10)).toBe("F+");
    expect(getGrade(0)).toBe("F");
  });
});
