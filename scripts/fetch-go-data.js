/**
 * fetch-go-data.js
 * ──────────────────────────────────────────────────────────────────
 * Fetches authoritative character stat data from the Genshin Optimizer
 * open‑source repository and merges it with community theorycrafting
 * build configurations to produce a unified JSON file for the artifact
 * scoring engine.
 *
 * Usage: node scripts/fetch-go-data.js
 * Output: genshin_optimizer_processed_data.json (workspace root)
 * ──────────────────────────────────────────────────────────────────
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Resolve paths ──────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const GO_STATS_URL =
  "https://raw.githubusercontent.com/frzyc/genshin-optimizer/master/libs/gi/stats/src/allStat_gen.json";

const OUTPUT_FILE = path.join(ROOT, "genshin_optimizer_processed_data.json");

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Fetch a URL and return the parsed JSON body.
 * Implements retry with exponential backoff (max 3 attempts).
 */
function fetchJSON(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      https
        .get(url, { headers: { "User-Agent": "genshin-artscore-fetcher/1.0" } }, (res) => {
          // Follow redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return fetchJSON(res.headers.location, remaining).then(resolve).catch(reject);
          }

          if (res.statusCode !== 200) {
            const err = new Error(`HTTP ${res.statusCode} for ${url}`);
            if (remaining > 0) {
              console.warn(`  ⚠ Retrying (${remaining} attempts left): ${err.message}`);
              setTimeout(() => attempt(remaining - 1), 1000 * (4 - remaining));
              return;
            }
            return reject(err);
          }

          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            try {
              const raw = Buffer.concat(chunks).toString("utf-8");
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
            }
          });
        })
        .on("error", (e) => {
          if (remaining > 0) {
            console.warn(`  ⚠ Network error, retrying (${remaining} left): ${e.message}`);
            setTimeout(() => attempt(remaining - 1), 1000 * (4 - remaining));
          } else {
            reject(new Error(`Network error fetching ${url}: ${e.message}`));
          }
        });
    };
    attempt(retries);
  });
}

/**
 * Read and parse a local JSON file.  Returns `null` if the file doesn't
 * exist or is unparseable.
 */
function readLocalJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Local file not found: ${filePath}`);
      return null;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`  ⚠ Failed to read/parse ${filePath}: ${e.message}`);
    return null;
  }
}

// ── Element mapping (GO internal → Genshin common name) ────────────
const GO_ELEMENT_MAP = {
  pyro: "Pyro",
  hydro: "Hydro",
  anemo: "Anemo",
  electro: "Electro",
  dendro: "Dendro",
  cryo: "Cryo",
  geo: "Geo",
};

// ── Weapon type mapping (GO internal → Genshin common name) ────────
const GO_WEAPON_MAP = {
  sword: "Sword",
  claymore: "Claymore",
  polearm: "Polearm",
  bow: "Bow",
  catalyst: "Catalyst",
};

/**
 * The ascensionBonus object in allStat_gen.json looks like:
 *   { hp: [0, …], atk: [0, …], def: [0, …], critDMG_: [0, 0, 0.096, …] }
 *
 * The "scaling attribute" is the key that is NOT hp/atk/def and whose
 * array contains at least one non‑zero value.
 */
const SCALING_STAT_MAP = {
  critRate_: "CRIT_RATE",
  critDMG_: "CRIT_DMG",
  eleMas: "ELEMENTAL_MASTERY",
  enerRech_: "ENERGY_RECHARGE",
  heal_: "HEALING_BONUS",
  physical_dmg_: "PHYSICAL_DMG",
  pyro_dmg_: "PYRO_DMG",
  hydro_dmg_: "HYDRO_DMG",
  anemo_dmg_: "ANEMO_DMG",
  electro_dmg_: "ELECTRO_DMG",
  dendro_dmg_: "DENDRO_DMG",
  cryo_dmg_: "CRYO_DMG",
  geo_dmg_: "GEO_DMG",
};

function extractScalingAttribute(ascensionBonus) {
  if (!ascensionBonus) return null;
  for (const [key, values] of Object.entries(ascensionBonus)) {
    if (key === "hp" || key === "atk" || key === "def") continue;
    if (Array.isArray(values) && values.some((v) => v > 0)) {
      return { internal: key, mapped: SCALING_STAT_MAP[key] ?? key.toUpperCase() };
    }
  }
  // Fallback: check if the character has no special ascension (rare)
  // Default to ATK_PERCENT for ATK-scaling characters
  return { internal: "atk", mapped: "ATK_PERCENT" };
}

/**
 * Derive a human‑readable "scaling_attribute" label such as
 * "ATK%", "HP%", "DEF%", "EM", "ER", etc.
 */
function scalingLabel(mappedKey) {
  const labels = {
    ATK_PERCENT: "ATK%",
    HP_PERCENT: "HP%",
    DEF_PERCENT: "DEF%",
    CRIT_RATE: "Crit Rate%",
    CRIT_DMG: "Crit DMG%",
    ELEMENTAL_MASTERY: "EM",
    ENERGY_RECHARGE: "ER%",
    HEALING_BONUS: "Healing%",
    PHYSICAL_DMG: "Physical DMG%",
    PYRO_DMG: "Pyro DMG%",
    HYDRO_DMG: "Hydro DMG%",
    ANEMO_DMG: "Anemo DMG%",
    ELECTRO_DMG: "Electro DMG%",
    DENDRO_DMG: "Dendro DMG%",
    CRYO_DMG: "Cryo DMG%",
    GEO_DMG: "Geo DMG%",
  };
  return labels[mappedKey] ?? mappedKey;
}

// ── Main pipeline ──────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Genshin Artifact Scoring — GO Data Pipeline        ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ── 1. Fetch the master stats JSON from the GO repo ────────────
  console.log("[1/4] Fetching allStat_gen.json from Genshin Optimizer repo…");
  let allStats;
  try {
    allStats = await fetchJSON(GO_STATS_URL);
    console.log(`  ✔ Downloaded (${(JSON.stringify(allStats).length / 1024 / 1024).toFixed(1)} MB)\n`);
  } catch (e) {
    console.error(`  ✖ Fatal: ${e.message}`);
    console.error("    Ensure network connectivity and try again.");
    process.exit(1);
  }

  // ── 2. Load local build configs ────────────────────────────────
  console.log("[2/4] Loading local build configuration files…");
  const localBuilds = readLocalJSON(path.join(ROOT, "src", "data", "character-builds.json"));
  const localChars = readLocalJSON(path.join(ROOT, "src", "data", "characters.json"));

  if (localBuilds) {
    console.log(`  ✔ character-builds.json loaded (${Object.keys(localBuilds).length} entries)`);
  } else {
    console.warn("  ⚠ No local builds found — substat weights will be default.");
  }
  if (localChars) {
    console.log(`  ✔ characters.json loaded (${Object.keys(localChars).length} entries)\n`);
  } else {
    console.warn("  ⚠ No local characters.json found.\n");
  }

  // ── 3. Parse character data ────────────────────────────────────
  console.log("[3/4] Parsing character data…");

  const charData = allStats?.char?.data;
  if (!charData) {
    console.error("  ✖ Fatal: Could not find 'char.data' in allStat_gen.json");
    process.exit(1);
  }

  const output = {};
  let processedCount = 0;
  let skippedCount = 0;

  for (const [charKey, sheetsData] of Object.entries(charData)) {
    // Skip travel variants — those are handled per‑element
    if (
      charKey.startsWith("Traveler") &&
      charKey !== "Traveler" &&
      !charKey.endsWith("M") &&
      !charKey.endsWith("F")
    ) {
      skippedCount++;
      continue;
    }

    const data = /** @type {any} */ (sheetsData);
    const element = GO_ELEMENT_MAP[data.ele] ?? data.ele ?? "Unknown";
    const weaponType = GO_WEAPON_MAP[data.weaponType] ?? data.weaponType ?? "Unknown";
    const rarity = data.rarity ?? 5;

    // Ascension scaling attribute
    const scaling = extractScalingAttribute(data.ascensionBonus);

    // Find the avatar ID by matching character name across our data sources
    let avatarId = null;
    let localBuild = null;

    // Strategy: enumerate localBuilds keys (avatar IDs) and match by name
    if (localBuilds) {
      for (const [id, config] of Object.entries(localBuilds)) {
        if (config.name === charKey || config.name?.toLowerCase() === charKey.toLowerCase()) {
          avatarId = String(id);
          localBuild = config;
          break;
        }
      }
    }

    // Fallback: match via characters.json
    if (!avatarId && localChars) {
      for (const [id, info] of Object.entries(localChars)) {
        // info.name like "Kamisato Ayaka", compare with charKey "KamisatoAyaka"
        const normalizedLocal = info.name?.replace(/\s+/g, "").toLowerCase();
        if (normalizedLocal === charKey.toLowerCase()) {
          avatarId = String(id);
          if (!localBuild && localBuilds) {
            localBuild = localBuilds[id] ?? null;
          }
          break;
        }
      }
    }

    // Build the unified entry
    const entry = {
      name: data.key,
      display_name: localChars?.[avatarId]?.name ?? data.key,
      element,
      weapon_type: weaponType,
      rarity,
      avatar_id: avatarId,

      // Scaling
      scaling_attribute: scalingLabel(scaling.mapped),
      scaling_stat: scaling.mapped,
      ascension_stat: scaling.internal,

      // Ascension bonus values (the full curve for reference)
      ascension_bonus_curve: data.ascensionBonus?.[scaling.internal] ?? [],

      // Substat weights from community theorycrafting
      substat_weights: localBuild?.substat_weights ?? null,

      // Ideal main stats
      main_stats_ideal: localBuild?.main_stats_ideal ?? null,

      // Recommended artifact sets
      recommended_sets: localBuild?.recommended_sets ?? [],

      // ER threshold (if defined in build config)
      er_threshold: localBuild?.er_threshold ?? null,

      // Base stats at level 90 (for reference)
      base_stats: {
        hp_base: data.lvlCurves?.find((c) => c.key === "hp")?.base ?? null,
        atk_base: data.lvlCurves?.find((c) => c.key === "atk")?.base ?? null,
        def_base: data.lvlCurves?.find((c) => c.key === "def")?.base ?? null,
      },

      // Region
      region: data.region ?? null,

      // Metadata
      source: "genshin-optimizer/frzyc",
      data_version: "allStat_gen.json — master branch",
    };

    output[charKey] = entry;
    processedCount++;
  }

  console.log(`  ✔ Processed ${processedCount} characters`);
  if (skippedCount > 0) {
    console.log(`  ℹ Skipped ${skippedCount} Traveler element variants (handled separately)`);
  }
  console.log("");

  // ── 4. Write output ─────────────────────────────────────────────
  console.log(`[4/4] Writing output to ${path.relative(ROOT, OUTPUT_FILE)}…`);
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`  ✔ Done!  Written ${(stats.size / 1024).toFixed(1)} KB\n`);
  } catch (e) {
    console.error(`  ✖ Failed to write output: ${e.message}`);
    process.exit(1);
  }

  // ── Summary ─────────────────────────────────────────────────────
  const withWeights = Object.values(output).filter((c) => c.substat_weights !== null).length;
  const withSets = Object.values(output).filter((c) => c.recommended_sets?.length > 0).length;
  const withMainStats = Object.values(output).filter((c) => c.main_stats_ideal !== null).length;

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Pipeline Summary                                   ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Total characters parsed:  ${String(processedCount).padStart(25)} ║`);
  console.log(`║  With substat weights:     ${String(withWeights).padStart(25)} ║`);
  console.log(`║  With ideal main stats:    ${String(withMainStats).padStart(25)} ║`);
  console.log(`║  With recommended sets:    ${String(withSets).padStart(25)} ║`);
  console.log("╚══════════════════════════════════════════════════════╝");
}

main().catch((e) => {
  console.error("\n  Unhandled error:", e);
  process.exit(1);
});
