import type {
  EnkaResponse,
  EnkaAvatarInfo,
  EnkaEquip,
  FightProp,
  EquipType,
  EnkaSubstat,
  EnkaShowAvatarInfo,
} from "../types/enka";
import type { Artifact, ArtifactSlot, ArtifactMainStat, ArtifactSubstat } from "../types/artifact";
import type { CharacterData, ShowcaseData, GenshinElement } from "../types/character";
import { SLOT_MAP, SLOT_ORDER } from "./constants";
import statKeysData from "../data/stat-keys.json";
import charactersData from "../data/characters.json";
import artifactsData from "../data/artifacts.json";
import { computeRollQuality, getMaxRoll } from "./scoring";

// ── Lookup tables ──

const STAT_KEYS = statKeysData as Record<string, { displayName: string; shortName: string; isPercentage: boolean }>;
const CHARACTERS = charactersData as Record<string, { name: string; element: string; weapon: string; icon: string }>;
const ARTIFACTS = artifactsData as Record<string, { name: string; pieces: number }>;

/**
 * Map Enka equipType enum string → our ArtifactSlot.
 */
function mapSlot(equipType: string): ArtifactSlot {
  return (SLOT_MAP[equipType] as ArtifactSlot) ?? "FLOWER";
}

function getSlotIndex(slot: ArtifactSlot): number {
  return SLOT_ORDER.indexOf(slot);
}

/**
 * Resolve a FIGHT_PROP_… string to its display metadata.
 */
function resolveStatName(propId: string): { displayName: string; shortName: string; isPercentage: boolean } {
  return STAT_KEYS[propId] ?? { displayName: propId, shortName: propId, isPercentage: false };
}

// ── Element detection from fightPropMap for fallback characters ──

const DMG_BONUS_PROPS: Record<string, GenshinElement> = {
  FIGHT_PROP_FIRE_ADD_HURT: "Pyro",
  FIGHT_PROP_ELEC_ADD_HURT: "Electro",
  FIGHT_PROP_WATER_ADD_HURT: "Hydro",
  FIGHT_PROP_WIND_ADD_HURT: "Anemo",
  FIGHT_PROP_ICE_ADD_HURT: "Cryo",
  FIGHT_PROP_ROCK_ADD_HURT: "Geo",
  FIGHT_PROP_GRASS_ADD_HURT: "Dendro",
};

function detectElement(fightPropMap: Record<string, number> | undefined): GenshinElement {
  if (!fightPropMap) return "Pyro"; // fallback
  // Check for elemental DMG bonus entry — native element gets base bonus
  for (const [prop, element] of Object.entries(DMG_BONUS_PROPS)) {
    if (fightPropMap[prop] !== undefined) return element;
  }
  return "Pyro";
}

// ── Substat building ──

function buildSubstats(raw: EnkaSubstat[] | undefined): ArtifactSubstat[] {
  if (!raw || raw.length === 0) return [];

  return raw.map((s) => {
    const statKey = s.appendPropId as FightProp;
    const meta = resolveStatName(statKey);
    const maxRoll = getMaxRoll(statKey);
    const rollCount = maxRoll > 0 ? s.statValue / maxRoll : 0;
    const quality = computeRollQuality(s.statValue, maxRoll);

    return {
      statKey,
      displayName: meta.displayName,
      shortName: meta.shortName,
      value: s.statValue,
      isPercentage: meta.isPercentage,
      maxRoll,
      rollCount,
      rollQuality: quality,
    };
  });
}

// ── Main stat ──

function buildMainStat(flat: EnkaEquip["flat"]): ArtifactMainStat | null {
  const main = flat.reliquaryMainstat;
  if (!main) return null;

  const meta = resolveStatName(main.mainPropId);
  return {
    statKey: main.mainPropId as FightProp,
    displayName: meta.displayName,
    value: main.statValue,
    isPercentage: meta.isPercentage,
    isCorrect: false,
    isRecommended: false,
  };
}

// ── Set ID extraction ──

function extractSetId(flat: EnkaEquip["flat"]): string {
  // Prefer flat.setId (exists in many API responses)
  if (flat.setId) return flat.setId;
  // Fallback: regex from icon
  const match = flat.icon.match(/UI_RelicIcon_(\d+)_/);
  return match ? match[1] : "0";
}

// ── Artifact check ──

function isArtifact(flat: EnkaEquip["flat"]): boolean {
  return flat.itemType === "ITEM_RELIQUARY";
}

// ── Character name extraction ──

function getCharacterName(avatarId: number): string {
  const entry = CHARACTERS[String(avatarId)];
  if (entry) return entry.name;
  console.warn(`[ArtScore] Unknown avatarId: ${avatarId} — name not found in characters.json`);
  return `Character #${avatarId}`;
}

function getCharacterElement(avatarId: number, fightPropMap?: Record<string, number>): GenshinElement {
  const char = CHARACTERS[String(avatarId)];
  if (char) return char.element as GenshinElement;
  console.warn(`[ArtScore] Unknown avatarId: ${avatarId} — detecting element from fightPropMap`);
  return detectElement(fightPropMap);
}

function getCharacterWeapon(avatarId: number): string {
  return CHARACTERS[String(avatarId)]?.weapon ?? "Unknown";
}

function getCharacterIcon(avatarId: number): string {
  return CHARACTERS[String(avatarId)]?.icon ?? "";
}

// ── Character catalog check ──

function isCharacterKnown(avatarId: number): boolean {
  return CHARACTERS[String(avatarId)] !== undefined;
}

// ═══════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════

export function parseShowcaseData(raw: EnkaResponse): ShowcaseData {
  const avatars = raw.avatarInfoList ?? [];
  const showInfoList = raw.playerInfo?.showAvatarInfoList ?? [];

  // Build a lookup map: avatarId → EnkaShowAvatarInfo (contains level, energyType)
  const showInfoMap = new Map<number, EnkaShowAvatarInfo>();
  for (const info of showInfoList) {
    showInfoMap.set(info.avatarId, info);
  }

  // Only show characters that are in the player's showcase profile
  const showcaseIds = new Set(showInfoList.map((i) => i.avatarId));

  const characters: CharacterData[] = avatars
    .filter((avatar) => showcaseIds.has(avatar.avatarId))
    .map((avatar) => parseCharacter(avatar, showInfoMap.get(avatar.avatarId)))
    .filter((c): c is CharacterData => c !== null)
    .sort((a, b) => b.buildScore.total - a.buildScore.total);

  return {
    playerInfo: {
      nickname: raw.playerInfo?.nickname ?? "Unknown",
      level: raw.playerInfo?.level ?? 0,
      worldLevel: raw.playerInfo?.worldLevel ?? 0,
      avatarIcon: raw.playerInfo?.profilePicture
        ? String(raw.playerInfo.profilePicture.avatarId)
        : "",
      signature: raw.playerInfo?.signature ?? "",
    },
    characters,
    lastUpdated: Date.now(),
  };
}

function parseCharacter(
  avatar: EnkaAvatarInfo,
  showInfo: EnkaShowAvatarInfo | undefined,
): CharacterData | null {
  const { avatarId } = avatar;

  const equips = avatar.equipList ?? [];
  const artifacts: Artifact[] = [];

  for (const equip of equips) {
    if (!isArtifact(equip.flat)) continue;

    const artifact = parseArtifact(equip);
    if (artifact) {
      artifacts.push(artifact);
    }
  }

  // Skip characters with no artifacts (nothing to score)
  if (artifacts.length === 0) return null;

  artifacts.sort((a, b) => a.slotIndex - b.slotIndex);

  // Constellation count from talent unlock list (constIdList)
  const constellation = (avatar.constIdList ?? []).length;

  // Level comes from showAvatarInfoList (player-controlled), fallback to avatar prop
  const charLevel = showInfo?.level ?? avatar.level ?? 0;

  // Talents: preferred from avatar.talentIdList, else derive from skillLevelMap
  const talents = avatar.talentIdList ?? [];

  // Compute active set bonuses
  const setCounts = new Map<string, number>();
  for (const art of artifacts) {
    setCounts.set(art.setId, (setCounts.get(art.setId) ?? 0) + 1);
  }
  const activeSetBonuses: string[] = [];
  for (const [setId, count] of setCounts) {
    if (count >= 2) activeSetBonuses.push(setId);
  }

  return {
    id: String(avatarId),
    avatarId,
    name: getCharacterName(avatarId),
    element: getCharacterElement(avatarId, avatar.fightPropMap),
    weaponType: getCharacterWeapon(avatarId),
    level: charLevel,
    constellation,
    talents,
    icon: getCharacterIcon(avatarId),
    artifacts,
    buildScore: { total: 0, grade: "F", artifactCount: artifacts.length },
    activeSetBonuses,
  };
}

function parseArtifact(equip: EnkaEquip): Artifact | null {
  const { flat, reliquary } = equip;

  const mainStat = buildMainStat(flat);
  if (!mainStat) return null;

  const slot = mapSlot(flat.equipType as EquipType);
  const setId = extractSetId(flat);
  const setName = ARTIFACTS[setId]?.name ?? `Set ${setId}`;

  // Use flat.reliquarySubstats directly (string appendPropId values)
  const substats = buildSubstats(flat.reliquarySubstats);

  // Clamp artifact level to valid range [0, 20]
  const rawLevel = reliquary?.level ?? flat.rankLevel ?? 0;
  const clampedLevel = Math.min(Math.max(rawLevel, 0), 20);

  return {
    id: `${equip.itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    setId,
    setName,
    slot,
    slotIndex: getSlotIndex(slot),
    level: clampedLevel,
    rarity: flat.rankLevel,
    icon: flat.icon,
    mainStat,
    substats,
    score: {
      rv: 0,
      cv: 0,
      cvNormalized: 0,
      wse: 0,
      mainStatMultiplier: 1.0,
      setBonusMultiplier: 1.0,
      total: 0,
      grade: "F",
    },
  };
}
