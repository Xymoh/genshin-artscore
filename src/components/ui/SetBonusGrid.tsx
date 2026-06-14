import type { Artifact } from "../../types/artifact";
import artifactsData from "../../data/artifacts.json";

const ARTIFACTS = artifactsData as Record<string, { name: string; pieces: number }>;

interface SetBonusGridProps {
  artifacts: Artifact[];
  activeSetBonuses: string[];
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

export function SetBonusGrid({ artifacts, activeSetBonuses }: SetBonusGridProps) {
  const setColors = assignSetColors(artifacts);

  // Count pieces per set
  const setCounts = new Map<string, number>();
  for (const art of artifacts) {
    setCounts.set(art.setId, (setCounts.get(art.setId) ?? 0) + 1);
  }

  return (
    <div className="space-y-2">
      {/* 5-slot grid */}
      <div className="flex items-center gap-2 justify-center">
        {artifacts.map((art) => {
          const isActive = activeSetBonuses.includes(art.setId);
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
      <div className="flex flex-wrap gap-2 justify-center">
        {activeSetBonuses.map((setId) => {
          const count = setCounts.get(setId) ?? 0;
          const color = setColors.get(setId) ?? "#6b7280";
          const name = ARTIFACTS[setId]?.name;
          const bonuses: string[] = [];
          if (count >= 4) bonuses.push("4‑pc");
          if (count >= 2) bonuses.push("2‑pc");

          return (
            <span
              key={setId}
              className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
              style={{ borderColor: color, color }}
            >
              {name ?? `Set (${bonuses.join(" + ")})`}
            </span>
          );
        })}
        {activeSetBonuses.length === 0 && (
          <span className="text-[10px] text-dark-muted">No set bonuses active</span>
        )}
      </div>
    </div>
  );
}
