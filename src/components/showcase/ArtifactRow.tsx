import type { Artifact } from "../../types/artifact";
import { SubstatDots } from "../ui/SubstatDots";
import { ScoreBadge } from "../ui/ScoreBadge";
import { useState } from "react";

const ENKA_UI_BASE = "https://enka.network/ui";

interface ArtifactRowProps {
  artifact?: Artifact;
  index: number;
  isPlaceholder?: boolean;
}

const SLOT_SHORT: Record<string, string> = {
  FLOWER: "Flower",
  PLUME: "Plume",
  SANDS: "Sands",
  GOBLET: "Goblet",
  CIRCLET: "Circlet",
};

const SLOT_ICONS: Record<string, string> = {
  FLOWER: "🌸",
  PLUME: "🪶",
  SANDS: "⌛",
  GOBLET: "🏺",
  CIRCLET: "👑",
};

function formatMainStatValue(value: number, isPercentage: boolean): string {
  if (isPercentage) return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString();
}

export function ArtifactRow({ artifact, index, isPlaceholder = false }: ArtifactRowProps) {
  const [iconError, setIconError] = useState(false);

  // Placeholder: no artifact data
  if (isPlaceholder || !artifact) {
    return (
      <div className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-5 py-3.5 opacity-30">
        <div className="h-12 w-12 rounded-lg border-2 border-dashed border-dark-border flex items-center justify-center text-lg text-dark-muted">
          {SLOT_ICONS[Object.keys(SLOT_SHORT)[index]] ?? "#"}
        </div>
        <div>
          <div className="text-sm text-dark-muted">{Object.values(SLOT_SHORT)[index]}</div>
          <div className="text-xs text-dark-muted/50">Empty slot</div>
        </div>
        <div className="text-xs text-dark-muted/40">—</div>
      </div>
    );
  }

  const artifactIconUrl = artifact.icon ? `${ENKA_UI_BASE}/${artifact.icon}.png` : null;
  const slotLabel = SLOT_SHORT[artifact.slot] ?? artifact.slot;
  const slotIcon = SLOT_ICONS[artifact.slot] ?? "#";

  return (
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-dark-card-hover/30 transition-colors">
      {/* Icon — 48×48px */}
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-dark-border bg-dark-bg icon-dark-bg">
        {artifactIconUrl && !iconError ? (
          <img
            src={artifactIconUrl}
            alt={artifact.setName}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setIconError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-dark-muted font-mono">
            {artifact.slot.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Details — upscaled */}
      <div className="min-w-0">
        {/* Slot + Level + Set */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-dark-text">{slotLabel}</span>
          <span className="text-xs text-dark-muted">+{artifact.level}</span>
          <span className="text-xs text-dark-muted/50">·</span>
          <span className="truncate text-xs text-dark-muted">{artifact.setName}</span>
        </div>

        {/* Main stat */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-dark-text">
            {artifact.mainStat.displayName}
          </span>
          <span className="text-sm font-mono text-accent">
            {formatMainStatValue(artifact.mainStat.value, artifact.mainStat.isPercentage)}
          </span>
          {!artifact.mainStat.isCorrect && (
            <span className="text-xs text-grade-f" title="Non-optimal main stat">⚠️</span>
          )}
        </div>

        {/* Substats — upscaled */}
        <SubstatDots substats={artifact.substats} />
      </div>

      {/* Score badge — upscaled */}
      <div className="flex-shrink-0">
        <ScoreBadge score={artifact.score.total} grade={artifact.score.grade} pulse={artifact.score.grade === "WTF" || artifact.score.grade === "WTF+" || artifact.score.grade === "SSS"} />
      </div>
    </div>
  );
}
