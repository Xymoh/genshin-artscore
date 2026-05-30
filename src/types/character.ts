import type { Artifact } from "./artifact";
import type { ScoreGrade } from "./artifact";

export type GenshinElement =
  | "Pyro"
  | "Hydro"
  | "Anemo"
  | "Electro"
  | "Dendro"
  | "Cryo"
  | "Geo";

export const ELEMENT_COLORS: Record<GenshinElement, string> = {
  Pyro: "#ef4444",
  Hydro: "#3b82f6",
  Anemo: "#22d3ee",
  Electro: "#a855f7",
  Dendro: "#22c55e",
  Cryo: "#93c5fd",
  Geo: "#f59e0b",
};

export interface CharacterData {
  id: string;
  avatarId: number;
  name: string;
  element: GenshinElement;
  weaponType: string;
  level: number;
  constellation: number;
  talents: number[];
  icon: string;
  artifacts: Artifact[];
  buildScore: BuildScore;
  activeSetBonuses: string[];
}

export interface BuildScore {
  total: number;
  grade: ScoreGrade;
  artifactCount: number;
}

export interface ShowcaseData {
  playerInfo: {
    nickname: string;
    level: number;
    worldLevel: number;
    avatarIcon: string;
    signature: string;
  };
  characters: CharacterData[];
  lastUpdated: number;
}
