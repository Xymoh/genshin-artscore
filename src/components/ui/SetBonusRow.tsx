import type { Artifact } from "../../types/artifact";
import type { SetBonusResult } from "../../types/character";

interface SetBonusRowProps {
  artifacts: Artifact[];
  setBonus: SetBonusResult;
}

const SET_COLORS = [
  "#d4a853",
  "#a855f7",
  "#3b82f6",
  "#22c55e",
  "#f97316",
];

const SLOT_SHORT: Record<string, string> = {
  FLOWER: "F",
  PLUME: "P",
  SANDS: "S",
  GOBLET: "G",
  CIRCLET: "C",
};

function MatchStatusIndicator({ matchStatus }: { matchStatus: SetBonusResult["matchStatus"] }) {
  switch (matchStatus) {
    case "full_match":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400" title="Full set match">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Full Match
        </span>
      );
    case "partial_match":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400" title="Partial set match">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4" />
          </svg>
          Partial Match
        </span>
      );
    case "no_match":
    case "no_recommendation":
      return null;
  }
}

export function SetBonusRow({ artifacts, setBonus }: SetBonusRowProps) {
  if (artifacts.length === 0) return null;

  // Assign colors
  const setColors = new Map<string, string>();
  for (const art of artifacts) {
    if (!setColors.has(art.setId)) {
      setColors.set(art.setId, SET_COLORS[setColors.size % SET_COLORS.length]);
    }
  }

  const activeSetIds = setBonus.activeSets.map((s) => s.setId);

  return (
    <div className="rounded-xl border border-dark-border overflow-hidden">
      {/* Slot grid: show optional compact slot indicators */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        {artifacts.map((art) => {
          const color = setColors.get(art.setId) ?? "#6b7280";
          const isActive = activeSetIds.includes(art.setId);
          return (
            <div
              key={art.slot}
              className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-mono font-bold transition-all ${
                isActive ? "opacity-100" : "opacity-25"
              }`}
              style={{ borderColor: color, color }}
              title={`${art.setName} — ${art.slot}`}
            >
              {SLOT_SHORT[art.slot] ?? art.slot.slice(0, 1)}
            </div>
          );
        })}
      </div>

      {/* Active bonus labels */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
        {setBonus.activeSets.length === 0 ? (
          <span className="text-xs text-dark-muted/50">No set bonuses active</span>
        ) : (
          <>
            {setBonus.activeSets.map((activeSet) => {
              const color = setColors.get(activeSet.setId) ?? "#6b7280";
              return (
                <span
                  key={activeSet.setId}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: color, color, backgroundColor: `${color}12` }}
                >
                  {activeSet.setName}
                  <span
                    className="rounded-full px-1.5 py-[1px] text-[10px] font-bold"
                    style={{ backgroundColor: color, color: "#0f1117" }}
                  >
                    {activeSet.pieces}pc
                  </span>
                </span>
              );
            })}
            {setBonus.matchStatus !== "no_recommendation" && (
              <MatchStatusIndicator matchStatus={setBonus.matchStatus} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
