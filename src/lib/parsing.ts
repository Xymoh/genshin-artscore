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
import type { CharacterData, CharacterWeapon, CharacterStats, ShowcaseData, GenshinElement } from "../types/character";
import { SLOT_MAP, SLOT_ORDER } from "./constants";
import statKeysData from "../data/stat-keys.json";
import charactersData from "../data/characters.json";
import artifactsData from "../data/artifacts.json";
import weaponsData from "../data/weapons.json";
import enkaLocaleData from "../data/enka-locale.json";
import { computeRollQuality, getMaxRoll } from "./scoring";

// ── Lookup tables ──

const STAT_KEYS = statKeysData as Record<string, { displayName: string; shortName: string; isPercentage: boolean }>;
const CHARACTERS = charactersData as Record<string, { name: string; element: string; weapon: string; icon: string }>;
const ARTIFACTS = artifactsData as Record<string, { name: string; pieces: number }>;
const WEAPONS = weaponsData as Record<string, string>;
const ENKA_LOCALE = enkaLocaleData as Record<string, string>;

// ── Weapon name lookup (hash-based with icon suffix fallback) ──
// The Enka API provides `flat.nameTextMapHash` for all equipment items.
// Weapon name resolution using itemId (most reliable, same approach as Enka.network).
// Icon suffixes and nameTextMapHash are both unreliable due to internal reuse.
const WEAPON_IDS: Record<number, string> = {
  // 5-star Swords
  11501: "Aquila Favonia", 11502: "Skyward Blade", 11503: "Freedom-Sworn", 11504: "Summit Shaper",
  11505: "Primordial Jade Cutter", 11509: "Mistsplitter Reforged", 11510: "Haran Geppaku Futsu",
  11511: "Key of Khaj-Nisut", 11512: "Light of Foliar Incision", 11513: "Splendor of Tranquil Waters",
  11514: "Uraku Misugiri", 11515: "Absolution", 11516: "Peak Patrol Song",
  11517: "Silken Moon's Serenade", 11518: "Dryas's Nocturne", 11519: "Bright Dawn Overture",
  // 4-star Swords
  11401: "Favonius Sword", 11402: "The Flute", 11403: "Sacrificial Sword", 11404: "Royal Longsword",
  11405: "Lion's Roar", 11406: "Prototype Rancour", 11407: "Iron Sting", 11408: "Blackcliff Longsword",
  11409: "The Black Sword", 11410: "The Alley Flash", 11412: "Sword of Descension",
  11413: "Festering Desire", 11414: "Amenoma Kageuchi", 11415: "Cinnabar Spindle",
  11416: "Kagotsurube Isshin", 11417: "Sapwood Blade", 11418: "Xiphos' Moonlight",
  11419: "Toukabou Shigure", 11420: "Wolf-Fang", 11421: "Finale of the Deep",
  11422: "Fleuve Cendre Ferryman", 11424: "The Dockhand's Assistant",
  11425: "Sword of Narzissenkreuz", 11426: "Sturdy Bone",
  // 3-star Swords
  11301: "Cool Steel", 11302: "Harbinger of Dawn", 11303: "Traveler's Handy Sword",
  11304: "Dark Iron Sword", 11305: "Fillet Blade", 11306: "Skyrider Sword",
  // 5-star Claymores
  12501: "Skyward Pride", 12502: "Wolf's Gravestone", 12503: "Song of Broken Pines",
  12504: "The Unforged", 12510: "Redhorn Stonethresher", 12511: "Beacon of the Reed Sea",
  12512: "Verdict", 12513: "A Thousand Blazing Suns", 12514: "Fang of the Mountain King",
  // 4-star Claymores
  12401: "Favonius Greatsword", 12402: "The Bell", 12403: "Sacrificial Greatsword",
  12404: "Royal Greatsword", 12405: "Rainslasher", 12406: "Prototype Archaic",
  12407: "Whiteblind", 12408: "Blackcliff Slasher", 12409: "Serpent Spine",
  12410: "Lithic Blade", 12411: "Snow-Tombed Starsilver", 12412: "Luxurious Sea-Lord",
  12414: "Katsuragikiri Nagamasa", 12415: "Makhaira Aquamarine", 12416: "Akuoumaru",
  12417: "Talking Stick", 12418: "Tidal Shadow", 12419: "Portable Power Saw",
  12424: "Ultimate Overlord's Mega Magic Sword", 12425: "Earth Shaker", 12426: "Fruitful Hook",
  // 5-star Polearms
  13501: "Staff of Homa", 13502: "Skyward Spine", 13504: "Vortex Vanquisher",
  13505: "Primordial Jade Winged-Spear", 13507: "Calamity Queller", 13509: "Engulfing Lightning",
  13511: "Staff of the Scarlet Sands", 13512: "Crimson Moon's Semblance",
  13513: "Lumidouce Elegy", 13514: "Ring of Yaxche", 13515: "Footprint of the Rainbow",
  13516: "Seasoned Symphony", 13517: "Disaster and Remorse", 13518: "Tupac's Grip",
  13519: "Calamity of Eshu", 13520: "Bloodsoaked Ruins",
  // 4-star Polearms
  13401: "Dragon's Bane", 13402: "Prototype Starglitter", 13403: "Crescent Pike",
  13404: "Blackcliff Pole", 13405: "Deathmatch", 13406: "Lithic Spear",
  13407: "Favonius Lance", 13408: "Royal Spear", 13409: "Dragonspine Spear",
  13414: "Kitain Cross Spear", 13415: "\"The Catch\"", 13416: "Wavebreaker's Fin",
  13417: "Moonpiercer", 13419: "Missive Windspear", 13420: "Ballad of the Fjords",
  13421: "Rightful Reward", 13422: "Prospector's Drill", 13424: "Dialogues of the Desert Sages",
  // 3-star Polearms
  13301: "White Tassel", 13302: "Halberd", 13303: "Black Tassel",
  // 5-star Bows
  15501: "Skyward Harp", 15502: "Amos' Bow", 15503: "Elegy for the End",
  15507: "Thundering Pulse", 15508: "Polar Star", 15509: "Aqua Simulacra",
  15511: "Hunter's Path", 15512: "The First Great Magic", 15513: "Silvershower Heartstrings",
  15514: "Astral Vulture's Crimson Plumage", 15515: "Chain Breaker", 15516: "Wavesplitter",
  // 4-star Bows
  15401: "Favonius Warbow", 15402: "The Stringless", 15403: "Sacrificial Bow",
  15404: "Royal Bow", 15405: "Rust", 15406: "Prototype Crescent",
  15407: "Compound Bow", 15408: "Blackcliff Warbow", 15409: "The Viridescent Hunt",
  15410: "The Alley Flash", 15411: "Windblume Ode", 15412: "Mitternachts Waltz",
  15413: "Predator", 15414: "Mouun's Moon", 15415: "Fading Twilight",
  15416: "Hamayumi", 15417: "King's Squire", 15418: "End of the Line",
  15419: "Ibis Piercer", 15420: "Scion of the Blazing Sun", 15421: "Song of Stillness",
  15422: "Range Gauge", 15424: "Cloudforged",
  // 5-star Catalysts
  14501: "Skyward Atlas", 14502: "Lost Prayer to the Sacred Winds", 14504: "Memory of Dust",
  14506: "Everlasting Moonglow", 14509: "Kagura's Verity",
  14511: "A Thousand Floating Dreams", 14512: "Tulaytullah's Remembrance",
  14513: "Cashflow Supervision", 14514: "Jadefall's Splendor",
  14515: "Tome of the Eternal Flow", 14516: "Crane's Echoing Call", 14517: "Surf's Up",
  14518: "Ring of Ceiba", 14519: "Strum of Sea Foam", 14520: "Many Oaths of Dawn and Dusk",
  14521: "Ode Beyond Time", 14522: "Etherlight Spindlelute",
  // 4-star Catalysts
  14401: "Favonius Codex", 14402: "The Widsith", 14403: "Sacrificial Fragments",
  14404: "Royal Grimoire", 14405: "Solar Pearl", 14406: "Prototype Amber",
  14407: "Mappa Mare", 14408: "Blackcliff Agate", 14409: "Eye of Perception",
  14410: "Wine and Song", 14412: "Dodoco Tales", 14413: "Hakushin Ring",
  14414: "Oathsworn Eye", 14415: "Wandering Evenstar", 14416: "Frostbearer",
  14417: "Flowing Purity", 14418: "Ballad of the Boundless Blue",
  14419: "Sacrificial Jade", 14424: "Vivid Notions",
  // 3-star Catalysts
  14301: "Magic Guide", 14302: "Thrilling Tales of Dragon Slayers", 14303: "Otherworldly Story",
  14304: "Emerald Orb", 14305: "Twin Nephrite",
};

function resolveWeaponName(flat: EnkaEquip["flat"], itemId?: number): string {
  // Primary: itemId lookup (same method Enka.network uses — most reliable)
  if (itemId && WEAPON_IDS[itemId]) {
    return WEAPON_IDS[itemId];
  }

  // Secondary: hash-based lookup from Enka locale data
  if (flat.nameTextMapHash) {
    const hashName = ENKA_LOCALE[flat.nameTextMapHash];
    if (hashName) return hashName;
  }

  // Tertiary: icon suffix from curated weapons.json
  const match = flat.icon.match(/UI_EquipIcon_(.+)/);
  if (match) {
    let iconSuffix = match[1];
    iconSuffix = iconSuffix.replace(/_Awaken$/, "");
    if (WEAPONS[iconSuffix]) {
      return WEAPONS[iconSuffix];
    }
    return iconSuffix.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  return "Unknown Weapon";
}

// ── Artifact set name lookup (hash-based) ──
// Uses `flat.setNameTextMapHash` from Enka API for reliable set name resolution.
function resolveSetName(flat: EnkaEquip["flat"]): string {
  // Primary: hash-based lookup from Enka locale data
  if (flat.setNameTextMapHash) {
    const hashName = ENKA_LOCALE[flat.setNameTextMapHash];
    if (hashName) return hashName;
  }
  // Fallback: use artifacts.json via set ID
  const setId = extractSetId(flat);
  return ARTIFACTS[setId]?.name ?? "";
}

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

// ── FightProp numeric ID mapping (Enka API uses numeric string keys) ──

const FIGHT_PROP_IDS: Record<string, string> = {
  "1": "FIGHT_PROP_BASE_HP",
  "2": "FIGHT_PROP_HP",
  "3": "FIGHT_PROP_HP_PERCENT",
  "4": "FIGHT_PROP_BASE_ATTACK",
  "5": "FIGHT_PROP_ATTACK",
  "6": "FIGHT_PROP_ATTACK_PERCENT",
  "7": "FIGHT_PROP_BASE_DEFENSE",
  "8": "FIGHT_PROP_DEFENSE",
  "9": "FIGHT_PROP_DEFENSE_PERCENT",
  "20": "FIGHT_PROP_CRITICAL",
  "22": "FIGHT_PROP_CRITICAL_HURT",
  "23": "FIGHT_PROP_ELEMENT_MASTERY",
  "26": "FIGHT_PROP_CHARGE_EFFICIENCY",
  "28": "FIGHT_PROP_HEAL_ADD",
  "29": "FIGHT_PROP_HEALED_ADD",
  "31": "FIGHT_PROP_PHYSICAL_ADD_HURT",
  "41": "FIGHT_PROP_FIRE_ADD_HURT",
  "42": "FIGHT_PROP_ELEC_ADD_HURT",
  "43": "FIGHT_PROP_WATER_ADD_HURT",
  "44": "FIGHT_PROP_GRASS_ADD_HURT",
  "45": "FIGHT_PROP_WIND_ADD_HURT",
  "46": "FIGHT_PROP_ROCK_ADD_HURT",
  "47": "FIGHT_PROP_ICE_ADD_HURT",
};

/** Try both numeric and FIGHT_PROP_ string keys from the fightPropMap */
function fpVal(fp: Record<string, number>, numKey: string, strKey: string): number {
  return fp[numKey] ?? fp[strKey] ?? 0;
}

/** Elemental DMG prop IDs → element mapping */
const DMG_BONUS_PROP_IDS: Record<string, GenshinElement> = {
  "41": "Pyro",
  "42": "Electro",
  "43": "Hydro",
  "45": "Anemo",
  "47": "Cryo",
  "46": "Geo",
  "44": "Dendro",
};

function detectElement(fightPropMap: Record<string, number> | undefined): GenshinElement {
  if (!fightPropMap) return "Pyro";
  for (const [propId, element] of Object.entries(DMG_BONUS_PROP_IDS)) {
    if ((fightPropMap[propId] ?? 0) > 0) return element;
  }
  return "Pyro";
}

/** Map a numeric/string prop ID to its FIGHT_PROP name, or return as-is */
function resolvePropId(rawId: string): string {
  return FIGHT_PROP_IDS[rawId] ?? rawId;
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

// ── Enka icon number → internal game set ID mapping ──
// The Enka API may return flat.setId OR the icon URL with a "UI_RelicIcon_XXXXX_Y" pattern.
// Both sources may use icon numbers (150XX) instead of internal game IDs (14XXX).
// This map converts icon numbers to the internal IDs used in artifacts.json.
const ICON_TO_SET_ID: Record<string, string> = {
  "15001": "14001", "15002": "14002", "15003": "14003", "15004": "14004",
  "15005": "14005", "15006": "14006", "15007": "14007", "15008": "14008",
  "15009": "14009", "15010": "14010", "15011": "14011", "15012": "14012",
  "15013": "14013", "15014": "14014", "15015": "14015", "15016": "14016",
  "15017": "14017",
  // 4-star filler sets (icon numbers 15018–15031)
  "15018": "15018", "15019": "15019", "15020": "15020", "15021": "15021",
  "15022": "15022", "15023": "15023", "15024": "15024", "15025": "15025",
  "15026": "15026", "15027": "15027", "15028": "15028", "15029": "15029",
  "15030": "15030", "15031": "15031",
  // 5-star Inazuma + newer sets
  "15032": "14018", "15033": "14019", "15034": "14020",
  "15035": "14021", "15036": "14022", "15037": "14023", "15038": "14024",
  "15039": "14025", "15040": "14026", "15041": "14027", "15042": "14028",
  "15043": "14029", "15044": "14030", "15045": "14031", "15046": "14032",
  "15047": "14033", "15048": "14034", "15049": "14035", "15050": "14036",
};

// ── Set ID extraction ──

function extractSetId(flat: EnkaEquip["flat"]): string {
  // Get raw ID: prefer flat.setId, fallback to icon regex
  let rawId: string;
  if (flat.setId) {
    rawId = flat.setId;
  } else {
    const match = flat.icon.match(/UI_RelicIcon_(\d+)_/);
    rawId = match ? match[1] : "0";
  }
  // Always try to map through ICON_TO_SET_ID, then return as-is if not found
  return ICON_TO_SET_ID[rawId] ?? rawId;
}

// ── Artifact check ──

function isArtifact(flat: EnkaEquip["flat"]): boolean {
  return flat.itemType === "ITEM_RELIQUARY";
}

// ── Character name extraction ──
// NOTE: characters.json is the authoritative source for in-game character names.
// The Genshin Optimizer (GO) repo uses pre-release codenames (e.g. "Varka" for what
// became "Lohen" in-game). If character names appear wrong, re-run
// `node scripts/fetch-go-data.js` to refresh the GO processed data, and verify
// that characters.json has the correct avatar_id → name mappings.

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

function getCharacterWeaponType(avatarId: number): string {
  return CHARACTERS[String(avatarId)]?.weapon ?? "Unknown";
}

function getCharacterIcon(avatarId: number): string {
  return CHARACTERS[String(avatarId)]?.icon ?? "";
}

/** Extract the icon suffix from avatar icon (e.g. "UI_AvatarIcon_Zibai" → "Zibai") */
function getTalentIconSuffix(avatarId: number): string {
  const icon = getCharacterIcon(avatarId);
  const match = icon.match(/UI_AvatarIcon_(.+)/);
  return match ? match[1] : String(avatarId);
}

// ── Character catalog check ──

function isCharacterKnown(avatarId: number): boolean {
  return CHARACTERS[String(avatarId)] !== undefined;
}

// ── Fight prop stat extraction ──
// Enka fightPropMap uses numeric string keys ("1","20") OR FIGHT_PROP_ strings.
//
// HP/ATK/DEF: stored as COMPONENTS (base + percent + flat).
//   Keys 1/4/7 = base, 2/5/8 = flat added, 3/6/9 = % bonus (decimal, e.g. 0.466 = 46.6%)
//   Formula: final = base * (1 + percent) + flat
//
// CRIT / ER / Elemental DMG: stored as FINAL values already including character base.
//   Keys 20/22/26 = final decimals (NO base added). e.g. 0.592 = 59.2% CRIT Rate (includes base 5%).
//   Key 23 = Elemental Mastery (flat integer).

/**
 * Compute total EM from artifact substats when fightPropMap lacks it.
 */
function computeEMFromArtifacts(artifacts: Artifact[]): number {
  let em = 0;
  for (const art of artifacts) {
    for (const sub of art.substats) {
      if (sub.statKey === "FIGHT_PROP_ELEMENT_MASTERY") {
        em += sub.value;
      }
    }
  }
  return Math.round(em);
}

function computeStats(fightPropMap: Record<string, number> | undefined, artifacts?: Artifact[]): CharacterStats {
  const fp = fightPropMap ?? {};

  // ── HP: component formula ──
  const baseHp = fpVal(fp, "1", "FIGHT_PROP_BASE_HP");
  const flatHp = fpVal(fp, "2", "FIGHT_PROP_HP");
  // HP% may be split across multiple keys (base HP% + set bonus HP%).
  // Try: key 3 (standard HP%), key 10 (alternate HP% source), key 0 (total HP%).
  const hpPercent = fpVal(fp, "3", "FIGHT_PROP_HP_PERCENT")
    || fpVal(fp, "10", "FIGHT_PROP_HP_PERCENT");
  const maxHp = Math.round(baseHp * (1 + hpPercent) + flatHp);

  // ── ATK: component formula ──
  const baseAtk = fpVal(fp, "4", "FIGHT_PROP_BASE_ATTACK");
  const flatAtk = fpVal(fp, "5", "FIGHT_PROP_ATTACK");
  const atkPercent = fpVal(fp, "6", "FIGHT_PROP_ATTACK_PERCENT");
  const atk = Math.round(baseAtk * (1 + atkPercent) + flatAtk);

  // ── DEF: component formula ──
  const baseDef = fpVal(fp, "7", "FIGHT_PROP_BASE_DEFENSE");
  const flatDef = fpVal(fp, "8", "FIGHT_PROP_DEFENSE");
  const defPercent = fpVal(fp, "9", "FIGHT_PROP_DEFENSE_PERCENT");
  const def = Math.round(baseDef * (1 + defPercent) + flatDef);

  // ── CRIT Rate/DMG: FINAL values (no base added) ──
  const critRate = parseFloat((fpVal(fp, "20", "FIGHT_PROP_CRITICAL") * 100).toFixed(1));
  const critDmg = parseFloat((fpVal(fp, "22", "FIGHT_PROP_CRITICAL_HURT") * 100).toFixed(1));

  // ── Elemental Mastery / Energy Recharge ──
  // In some Enka responses, EM and ER keys are swapped:
  //   key "23" may hold ER (decimal ~1-3) and EM is in key "28".
  // We detect by value range: EM is 0-1000 (integer-like), ER is 1.0-3.0 (decimal).
  const raw23 = fpVal(fp, "23", "FIGHT_PROP_ELEMENT_MASTERY");
  const raw26 = fpVal(fp, "26", "FIGHT_PROP_CHARGE_EFFICIENCY");
  const raw28 = fpVal(fp, "28", "FIGHT_PROP_ELEMENT_MASTERY");

  let em: number;
  let erRaw: number;

  if (raw23 > 0.9 && raw23 < 10) {
    // raw23 is actually ER (decimal 1.0–3.0), EM is in key 28 or 0
    em = Math.round(raw28);
    erRaw = raw23;
  } else {
    // Standard mapping: raw23 is EM, raw26 is ER
    em = Math.round(raw23);
    erRaw = raw26;
  }

  // EM artifact fallback
  if (em < 10 && artifacts && artifacts.length > 0) {
    const fromArts = computeEMFromArtifacts(artifacts);
    if (fromArts > 10) em = fromArts;
  }

  const er = parseFloat((erRaw * 100).toFixed(1));

  // ── Elemental DMG Bonus ──
  const dmgKeys = [
    { n: "31", s: "FIGHT_PROP_PHYSICAL_ADD_HURT" },
    { n: "41", s: "FIGHT_PROP_FIRE_ADD_HURT" },
    { n: "42", s: "FIGHT_PROP_ELEC_ADD_HURT" },
    { n: "43", s: "FIGHT_PROP_WATER_ADD_HURT" },
    { n: "44", s: "FIGHT_PROP_GRASS_ADD_HURT" },
    { n: "45", s: "FIGHT_PROP_WIND_ADD_HURT" },
    { n: "46", s: "FIGHT_PROP_ROCK_ADD_HURT" },
    { n: "47", s: "FIGHT_PROP_ICE_ADD_HURT" },
  ];
  let elementalDmg = 0;
  for (const { n, s } of dmgKeys) {
    const v = fpVal(fp, n, s);
    if (v > 0) { elementalDmg = parseFloat((v * 100).toFixed(1)); break; }
  }

  return { maxHp, atk, def, elementalMastery: em, critRate, critDmg, energyRecharge: er, elementalDmg, raw: fp };
}

// ── Weapon extraction ──

function extractWeapon(equips: EnkaEquip[]): CharacterWeapon | null {
  for (const equip of equips) {
    if (equip.flat.itemType !== "ITEM_WEAPON") continue;
    const { flat, weapon } = equip;
    const icon = flat.icon || "";

    // Main stat (base ATK) — flat value, no multiplication needed
    const mainStatValue = flat.weaponStats?.find(
      (s) => s.appendPropId === "FIGHT_PROP_BASE_ATTACK",
    );
    const mainStatName = "ATK";
    const mainStatDisplay = mainStatValue ? String(Math.round(mainStatValue.statValue)) : "?";

    // Substat (second stat, typically ATK%, CRIT, etc.)
    // Weapon stat values from Enka are already in display format (e.g. 33.1 for 33.1% CRIT Rate)
    const substats = flat.weaponStats ?? [];
    const substat = substats.find((s) => s.appendPropId !== "FIGHT_PROP_BASE_ATTACK");
    const substatMeta = substat ? STAT_KEYS[substat.appendPropId] : null;
    const substatName = substatMeta?.displayName ?? (substat?.appendPropId ?? "—");
    const substatDisplay = substat
      ? substatMeta?.isPercentage
        ? `${substat.statValue.toFixed(1)}%`
        : String(Math.round(substat.statValue))
      : "—";

    // affixMap values are 0-indexed (0 = R1, 4 = R5)
    const refinement = weapon?.affixMap
      ? (Object.values(weapon.affixMap)[0] ?? 0) + 1
      : 1;

    return {
      name: resolveWeaponName(flat, equip.itemId),
      icon,
      level: weapon?.level ?? 1,
      refinement,
      rarity: flat.rankLevel,
      mainStat: { name: mainStatName, value: mainStatDisplay },
      substat: { name: substatName, value: substatDisplay },
    };
  }
  return null;
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
  let weapon: CharacterWeapon | null = null;

  for (const equip of equips) {
    if (isArtifact(equip.flat)) {
      const artifact = parseArtifact(equip);
      if (artifact) {
        artifacts.push(artifact);
      }
    } else if (equip.flat.itemType === "ITEM_WEAPON") {
      weapon = extractWeapon([equip]);
    }
  }

  // Skip characters with no artifacts (nothing to score)
  if (artifacts.length === 0) return null;

  artifacts.sort((a, b) => a.slotIndex - b.slotIndex);

  // Constellation count: prefer constIdList, fallback to talentIdList
  // (some Enka responses put constellation talent IDs in talentIdList)
  const constIdList = avatar.constIdList ?? [];
  let constellation = constIdList.length;
  if (constellation === 0 && avatar.talentIdList && avatar.talentIdList.length > 0) {
    // talentIdList may contain constellation talent IDs (not talent levels)
    // Talent levels come from inherentProudSkillList, so if that exists,
    // talentIdList likely holds constellation data instead
    if (avatar.inherentProudSkillList && avatar.inherentProudSkillList.length > 0) {
      constellation = avatar.talentIdList.length;
    }
  }

  // Level comes from showAvatarInfoList (player-controlled), fallback to avatar prop
  const charLevel = showInfo?.level ?? avatar.level ?? 0;

  // Talents: prefer skillLevelMap (gives actual combat talent levels 1-15),
  // fallback to inherentProudSkillList, then talentIdList
  // skillLevelMap keys are skill depot derived IDs; the 3 combat talents
  // are typically the first 3 sorted entries
  let talents: number[] = [];
  if (avatar.skillLevelMap) {
    const levels = Object.values(avatar.skillLevelMap)
      .slice(0, 3)
      .map((v) => Math.round(v));
    if (levels.length > 0) {
      talents = levels;
    }
  }
  if (talents.length === 0) {
    // Fallback: inherentProudSkillList may contain raw IDs,
    // extract last 1-2 digits as talent level
    const raw = avatar.inherentProudSkillList ?? avatar.talentIdList ?? [];
    talents = raw.slice(0, 3).map((id) => {
      // IDs like 892101 → level 01 (last 2 digits), or just last digit
      const str = String(id);
      if (str.length >= 2) {
        const lastTwo = str.slice(-2);
        const parsed = parseInt(lastTwo, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      const lastOne = str.slice(-1);
      return parseInt(lastOne, 10) || 0;
    });
  }

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
    weaponType: getCharacterWeaponType(avatarId),
    level: charLevel,
    constellation,
    talents,
    talentIconSuffix: getTalentIconSuffix(avatarId),
    icon: getCharacterIcon(avatarId),
    weapon,
    artifacts,
    stats: computeStats(avatar.fightPropMap, artifacts),
    buildScore: { total: 0, grade: "F", artifactCount: artifacts.length, correctMainStats: 0, totalSelectableSlots: 0, setBonus: { activeSets: [], matchStatus: "no_recommendation" } },
    activeSetBonuses,
  };
}

function parseArtifact(equip: EnkaEquip): Artifact | null {
  const { flat, reliquary } = equip;

  const mainStat = buildMainStat(flat);
  if (!mainStat) return null;

  const slot = mapSlot(flat.equipType as EquipType);
  const setId = extractSetId(flat);
  const setName = resolveSetName(flat);

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
      potentialPercent: 0,
      weightedPotential: 0,
      idealPotential: 0,
      mainStatCorrect: true,
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
