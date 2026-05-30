import type { FightProp } from "./enka";

export type ArtifactSlot = "FLOWER" | "PLUME" | "SANDS" | "GOBLET" | "CIRCLET";

export interface ArtifactSubstat {
  statKey: FightProp;
  displayName: string;
  shortName: string;
  value: number;
  isPercentage: boolean;
  maxRoll: number;
  rollCount: number;
  rollQuality: "high" | "medium" | "low";
}

export interface Artifact {
  id: string;
  setId: string;
  setName: string;
  slot: ArtifactSlot;
  slotIndex: number;
  level: number;
  rarity: number;
  icon: string;
  mainStat: ArtifactMainStat;
  substats: ArtifactSubstat[];
  score: ArtifactScore;
}

export interface ArtifactMainStat {
  statKey: FightProp;
  displayName: string;
  value: number;
  isPercentage: boolean;
  isCorrect: boolean;
  isRecommended: boolean;
}

export interface ArtifactScore {
  rv: number;        // Roll Value (0-100)
  cv: number;        // Crit Value (absolute)
  cvNormalized: number; // CV normalized to 0-1
  wse: number;       // Weighted Substat Efficiency (0-100)
  mainStatMultiplier: number;
  setBonusMultiplier: number;
  total: number;     // Aggregate score (0-100)
  grade: ScoreGrade;
}

export type ScoreGrade = "WTF" | "OP" | "SSS" | "SS" | "S" | "A" | "B" | "C" | "D" | "F";

export const GRADE_COLORS: Record<ScoreGrade, string> = {
  WTF: "#1fe03f",
  OP: "#de3a35",
  SSS: "#ff8c00",
  SS: "#ffbd59",
  S: "#ffd700",
  A: "#a855f7",
  B: "#3b82f6",
  C: "#22c55e",
  D: "#6b7280",
  F: "#4b5563",
};
