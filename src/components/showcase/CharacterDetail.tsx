import type { CharacterData } from "../../types/character";
import { ELEMENT_COLORS } from "../../types/character";
import { GRADE_COLORS } from "../../types/artifact";
import type { ArtifactSlot } from "../../types/artifact";
import { ArtifactRow } from "./ArtifactRow";
import { SetBonusRow } from "../ui/SetBonusRow";
import { BuildScoreBar } from "../ui/BuildScoreBar";

const ENKA_UI_BASE = "https://enka.network/ui";

interface CharacterDetailProps {
  character: CharacterData;
}

const SLOT_ORDER: ArtifactSlot[] = ["FLOWER", "PLUME", "SANDS", "GOBLET", "CIRCLET"];

const SLOT_NAMES: Record<ArtifactSlot, string> = {
  FLOWER: "Flower",
  PLUME: "Plume",
  SANDS: "Sands",
  GOBLET: "Goblet",
  CIRCLET: "Circlet",
};

const SLOT_ICONS: Record<ArtifactSlot, string> = {
  FLOWER: "\u{1F490}",   // bouquet
  PLUME: "\u{1FAB6}",    // feather
  SANDS: "\u{23F0}",     // alarm clock
  GOBLET: "\u{1F943}",   // wine glass
  CIRCLET: "\u{1F452}",  // crown/hat
};

export function CharacterDetail({ character }: CharacterDetailProps) {
  const elementColor = ELEMENT_COLORS[character.element] ?? "#6b7280";
  const hasIcon = character.icon.length > 0;
  const gradeColor = GRADE_COLORS[character.buildScore.grade] ?? "#6b7280";
  const missingSlots = 5 - character.artifacts.length;

  const splashUrl = hasIcon
    ? `${ENKA_UI_BASE}/${character.icon.replace("AvatarIcon", "Gacha_AvatarImg")}.png`
    : null;

  const avatarUrl = hasIcon
    ? `${ENKA_UI_BASE}/${character.icon}.png`
    : null;

  // Build a map of slot -> artifact for quick lookup
  const artifactMap = new Map<ArtifactSlot, typeof character.artifacts[number]>();
  for (const art of character.artifacts) {
    artifactMap.set(art.slot, art);
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Hero section — large portrait + key info */}
      <div
        className="relative rounded-xl overflow-hidden border"
        style={{
          borderColor: `${elementColor}44`,
          background: `linear-gradient(135deg, ${elementColor}18 0%, ${elementColor}06 50%, transparent 100%)`,
        }}
      >
        {/* Background glow */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-[0.07] blur-3xl pointer-events-none"
          style={{ background: elementColor }}
        />

        <div className="relative flex items-center gap-6 px-6 py-6 sm:px-8 sm:py-6">
          {/* Large portrait — Fribbels-scale: 160px */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-dark-card border-[3px] flex-shrink-0"
            style={{ borderColor: `${elementColor}55` }}>
            {splashUrl ? (
              <img
                src={splashUrl}
                alt={character.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  if (avatarUrl) {
                    e.currentTarget.src = avatarUrl;
                  }
                }}
              />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={character.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-3xl font-bold"
                style={{ color: elementColor }}
              >
                {character.name.charAt(0)}
              </div>
            )}

            {/* Grade badge overlay — larger: 56px badge */}
            <div
              className="absolute -bottom-2.5 -right-2.5 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-xl font-extrabold shadow-lg border-[3px] border-dark-bg"
              style={{
                background: `linear-gradient(135deg, ${gradeColor}, ${gradeColor}cc)`,
                color: "#000",
                textShadow: "none",
              }}
            >
              {character.buildScore.grade}
            </div>
          </div>

          {/* Character info — upscaled */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-dark-text truncate">
              {character.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm sm:text-base text-dark-muted">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold"
                style={{ backgroundColor: `${elementColor}22`, color: elementColor }}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: elementColor }} />
                {character.element}
              </span>
              <span>Lv.{character.level}</span>
              <span>C{character.constellation}</span>
              <span>{character.weaponType}</span>
            </div>

            {/* Score summary line */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm text-dark-muted">Score</span>
                <span
                  className="text-2xl font-bold font-mono"
                  style={{ color: gradeColor }}
                >
                  {character.buildScore.total.toFixed(1)}
                </span>
              </div>
              <div className="w-px h-5 bg-dark-border" />
              <div className="text-sm text-dark-muted">
                {character.buildScore.artifactCount}/5 artifacts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artifact table — wider, upscaled */}
      <div className="rounded-xl overflow-hidden border border-dark-border bg-dark-card/40">
        {/* Table header — larger columns */}
        <div className="grid grid-cols-[44px_1fr_1fr_1.5fr_96px] sm:grid-cols-[48px_130px_140px_1fr_110px] items-center gap-3 px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-dark-muted bg-dark-card/60 border-b border-dark-border">
          <span className="justify-self-center">#</span>
          <span>Slot</span>
          <span className="hidden sm:block">Set</span>
          <span>Main Stat</span>
          <span className="text-right">Score</span>
        </div>

        {/* Artifact rows — in SLOT_ORDER */}
        <div className="divide-y divide-dark-border/60">
          {SLOT_ORDER.map((slot, i) => {
            const artifact = artifactMap.get(slot);
            if (artifact) {
              return (
                <ArtifactRow
                  key={artifact.id}
                  artifact={artifact}
                  index={i}
                />
              );
            }
            // Placeholder row for missing slot
            return (
              <ArtifactRow
                key={`placeholder-${slot}`}
                index={i}
                isPlaceholder={true}
              />
            );
          })}
        </div>
      </div>

      {/* Missing slots notice */}
      {missingSlots > 0 && (
        <div className="px-5 py-3.5 text-center text-sm text-dark-muted bg-dark-card/30 rounded-xl border border-dashed border-dark-border">
          {missingSlots} artifact slot{missingSlots !== 1 ? "s" : ""} missing &middot; score based on {character.buildScore.artifactCount}/5 pieces
        </div>
      )}

      {/* Set bonuses */}
      <div className="rounded-xl border border-dark-border bg-dark-card/40 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-muted mb-3.5">
          Set Bonuses
        </h3>
        <SetBonusRow
          artifacts={character.artifacts}
          activeSetBonuses={character.activeSetBonuses}
        />
      </div>

      {/* Build score bar */}
      <BuildScoreBar
        score={character.buildScore.total}
        grade={character.buildScore.grade}
        artifactCount={character.buildScore.artifactCount}
      />
    </div>
  );
}
