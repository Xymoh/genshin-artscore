import type { Artifact } from "../../types/artifact";
import type { SetBonusResult } from "../../types/character";

interface SetBonusGridProps {
  artifacts: Artifact[];
  setBonus: SetBonusResult;
}

/** Assign a color index to each unique set ID for visual grouping */
function assignSetColors(artifacts: Artifact[]): Map<string, string> {
  const colors = [
    "#d4a853", // gold
    "#a855f7", // purple
    "#3b82f6", // blue
    "#22c55e", // green
    "#f97316", // orange
  ];

  const seen = new Map<string, string>();
  for (const art of artifacts) {
    if (!seen.has(art.setId)) {
      seen.set(art.setId, colors[seen.size % colors.length]);
    }
  }
  return seen;
}

function MatchStatusIndicator({ matchStatus }: { matchStatus: SetBonusResult["matchStatus"] }) {
  switch (matchStatus) {
    case "full_match":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-400" title="Full set match">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Match
        </span>
      );
    case "partial_match":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400" title="Partial set match">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4" />
          </svg>
          Partial
        </span>
      );
    case "no_match":
    case "no_recommendation":
      return null;
  }
}

export function SetBonusGrid({ artifacts, setBonus }: SetBonusGridProps) {
  const setColors = assignSetColors(artifacts);
  const activeSetIds = setBonus.activeSets.map((s) => s.setId);

  return (
    <div className="space-y-2">
      {/* 5-slot grid */}
      <div className="flex items-center gap-2 justify-center">
        {artifacts.map((art) => {
          const isActive = activeSetIds.includes(art.setId);
          const color = setColors.get(art.setId) ?? "#6b7280";

          return (
            <div
              key={art.slot}
              className={`set-bonus-slot ${isActive ? "active" : ""}`}
              style={{ borderColor: color }}
              title={`${art.setName} — ${art.slot}`}
            >
              <span
                className="text-[10px] font-mono font-bold"
                style={{ color }}
              >
                {art.slot.slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active bonuses labels */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        {setBonus.activeSets.length === 0 ? (
          <span className="text-[10px] text-dark-muted">No set bonuses active</span>
        ) : (
          setBonus.activeSets.map((activeSet) => {
            const color = setColors.get(activeSet.setId) ?? "#6b7280";
            return (
              <span
                key={activeSet.setId}
                className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                style={{ borderColor: color, color }}
              >
                {activeSet.setName} ({activeSet.pieces}‑pc)
              </span>
            );
          })
        )}
        {setBonus.matchStatus !== "no_recommendation" && setBonus.activeSets.length > 0 && (
          <MatchStatusIndicator matchStatus={setBonus.matchStatus} />
        )}
      </div>
    </div>
  );
}
