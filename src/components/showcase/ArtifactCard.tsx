import type { Artifact } from "../../types/artifact";
import { GRADE_COLORS } from "../../types/artifact";
import scoreIconImg from "../../assets/svg/ico-score.svg";
import { useState } from "react";

const ENKA_UI_BASE = "https://enka.network/ui";

interface ArtifactCardProps {
  artifact: Artifact;
}

function formatStatValue(value: number, isPercentage: boolean): string {
  if (isPercentage) return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString();
}

// ── Chevron icon for roll indicators (Fribbels-style) ──
function RollChevrons({ count, color }: { count: number; color: string }) {
  if (count <= 0) return null;
  return (
    <svg width={Math.min(count * 5 + 4, 24)} height="8" viewBox={`0 0 ${Math.min(count * 5 + 4, 24)} 8`} style={{ opacity: 0.75 }}>
      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
        <g key={i} transform={`translate(${i * 5 + 1} 0) scale(0.35)`}>
          <g transform="translate(24 1) scale(-1 1)">
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" d="M8 12L15 5M8 12L15 19" />
          </g>
        </g>
      ))}
    </svg>
  );
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const [iconError, setIconError] = useState(false);
  const gradeColor = GRADE_COLORS[artifact.score.grade] ?? "#6b7280";
  const artIconUrl = artifact.icon ? `${ENKA_UI_BASE}/${artifact.icon}.png` : null;

  return (
    <div
      className="flex flex-col rounded-lg p-3 gap-1.5 flex-1 min-w-[180px] max-w-[260px]"
      style={{
        backgroundColor: "var(--showcase-card-bg, rgb(15,17,23))",
        border: "1px solid var(--showcase-card-border, rgba(255,255,255,0.08))",
        borderRadius: "6px",
      }}
    >
      {/* Top row: icon + level */}
      <div className="flex items-center justify-between">
        <div className="w-18 h-18 rounded-md overflow-hidden bg-dark-bg border border-dark-border/40 flex-shrink-0">
          {artIconUrl && !iconError ? (
            <img src={artIconUrl} alt={artifact.setName} className="w-full h-full object-cover" loading="lazy" onError={() => setIconError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-dark-muted font-mono">
              {artifact.slot.slice(0, 2)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: gradeColor }}>
            <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z" />
          </svg>
          <span className="text-md font-mono font-semibold text-white">+{artifact.level}</span>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-dark-border/30" />

      {/* Main stat */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-dark-muted truncate">{artifact.mainStat.displayName}</span>
        <span className="text-sm font-mono font-bold text-white">
          {formatStatValue(artifact.mainStat.value, artifact.mainStat.isPercentage)}
        </span>
      </div>

      {/* Divider */}
      <hr className="border-dark-border/30" />

      {/* Substats */}
      <div className="flex flex-col gap-0.5">
        {artifact.substats.map((sub) => {
          const rolls = Math.round(sub.rollCount);
          const rollColor = rolls >= 4 ? "#4ade80" : rolls >= 3 ? "#facc15" : rolls >= 2 ? "#fb923c" : "#6b7280";
          return (
            <div key={sub.statKey} className="flex items-center justify-between">
              <span className="text-[11px] text-dark-muted/80 truncate flex-1 min-w-0">{sub.displayName}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span style={{ color: rollColor }}>
                  <RollChevrons count={rolls} color={rollColor} />
                </span>
                <span className="text-[11px] font-mono text-white/80 tabular-nums text-right w-[50px]">
                  {formatStatValue(sub.value, sub.isPercentage)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <hr className="border-dark-border/30" />

      {/* Score footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <img src={scoreIconImg} alt="" className="w-3 h-3 opacity-60" />
          <span className="text-[10px] text-dark-muted">Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-white">{artifact.score.total.toFixed(1)}</span>
          <span className="text-[10px] font-extrabold px-1 py-0.5 rounded" style={{ backgroundColor: `${gradeColor}22`, color: gradeColor }}>
            {artifact.score.grade}
          </span>
        </div>
      </div>
    </div>
  );
}
