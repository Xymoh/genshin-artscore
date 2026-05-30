import type { Artifact } from "../../types/artifact";
import { SubstatBar } from "../ui/SubstatBar";
import { ScoreBadge } from "../ui/ScoreBadge";
import { useState } from "react";

const ENKA_UI_BASE = "https://enka.network/ui";

interface ArtifactCardProps {
  artifact: Artifact;
}

const SLOT_LABELS: Record<string, string> = {
  FLOWER: "Flower of Life",
  PLUME: "Plume of Death",
  SANDS: "Sands of Eon",
  GOBLET: "Goblet of Eonothem",
  CIRCLET: "Circlet of Logos",
};

function formatMainStatValue(value: number, isPercentage: boolean): string {
  if (isPercentage) return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString();
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const slotLabel = SLOT_LABELS[artifact.slot] ?? artifact.slot;
  const isSPlus = artifact.score.grade === "WTF" || artifact.score.grade === "OP" || artifact.score.grade === "SSS";
  const [iconError, setIconError] = useState(false);

  const artifactIconUrl = artifact.icon
    ? `${ENKA_UI_BASE}/${artifact.icon}.png`
    : null;

  return (
    <div className={`artifact-card flex flex-col p-3 rounded-lg bg-dark-bg border border-dark-border ${isSPlus ? "ring-1 ring-grade-s-plus/40" : ""}`}>
      {/* Header: slot name + level + score */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-dark-muted">{artifact.slot}</span>
        <ScoreBadge score={artifact.score.total} grade={artifact.score.grade} pulse={isSPlus} />
      </div>

      <div className="flex flex-col items-center mb-3">
        {/* Artifact icon */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-dark-card border border-dark-border/50 mb-2 relative">
          {artifactIconUrl && !iconError ? (
            <img
              src={artifactIconUrl}
              alt={artifact.setName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setIconError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-dark-muted font-mono">
              {artifact.slot.slice(0, 2)}
            </div>
          )}
          {artifact.level > 0 && (
            <span className="absolute bottom-0 right-0 bg-dark-bg/90 text-dark-text text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md">
              +{artifact.level}
            </span>
          )}
        </div>
        
        {/* Main stat */}
        <div className="text-center w-full">
          <p className="text-[10px] text-dark-muted truncate w-full px-1" title={artifact.setName}>
            {artifact.setName}
          </p>
          <div className="flex flex-col items-center justify-center mt-1">
            <span className="text-xs font-medium text-dark-text truncate max-w-full">
              {artifact.mainStat.displayName}
            </span>
            <div className="flex items-center">
              <span className="text-sm font-bold font-mono text-accent">
                {formatMainStatValue(artifact.mainStat.value, artifact.mainStat.isPercentage)}
              </span>
              {!artifact.mainStat.isCorrect && (
                <span className="ml-1 text-[10px] text-grade-f" title="Main stat may not be optimal for this character">
                  ⚠
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Substats */}
      <div className="space-y-1 mt-auto border-t border-dark-border/40 pt-2">
        {artifact.substats.map((sub) => (
          <SubstatBar key={sub.statKey} substat={sub} />
        ))}
      </div>
    </div>
  );
}
