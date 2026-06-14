import type { Artifact } from "../../types/artifact";
import artifactsData from "../../data/artifacts.json";

const ARTIFACTS = artifactsData as Record<string, { name: string; pieces: number }>;

interface SetBonusRowProps {
  artifacts: Artifact[];
  activeSetBonuses: string[];
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

export function SetBonusRow({ artifacts, activeSetBonuses }: SetBonusRowProps) {
  if (artifacts.length === 0) return null;

  // Assign colors
  const setColors = new Map<string, string>();
  const setCounts = new Map<string, number>();
  for (const art of artifacts) {
    if (!setColors.has(art.setId)) {
      setColors.set(art.setId, SET_COLORS[setColors.size % SET_COLORS.length]);
    }
    setCounts.set(art.setId, (setCounts.get(art.setId) ?? 0) + 1);
  }

  return (
    <div className="rounded-xl border border-dark-border overflow-hidden">
      {/* Slot grid: show optional compact slot indicators */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        {artifacts.map((art) => {
          const color = setColors.get(art.setId) ?? "#6b7280";
          const isActive = activeSetBonuses.includes(art.setId);
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

      {/* Active bonus labels as taxonomy tags */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
        {activeSetBonuses.length === 0 ? (
          <span className="text-xs text-dark-muted/50">No set bonuses active</span>
        ) : (
          activeSetBonuses.map((setId) => {
            const count = setCounts.get(setId) ?? 0;
            const color = setColors.get(setId) ?? "#6b7280";
            const name = ARTIFACTS[setId]?.name ?? "";

            const bonuses: string[] = [];
            if (count >= 4) bonuses.push("4pc");
            if (count >= 2 && count < 4) bonuses.push("2pc");

            return (
              <span
                key={setId}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{ borderColor: color, color, backgroundColor: `${color}12` }}
              >
                {name}
                <span
                  className="rounded-full px-1.5 py-[1px] text-[10px] font-bold"
                  style={{ backgroundColor: color, color: "#0f1117" }}
                >
                  {bonuses.join(" + ")}
                </span>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
