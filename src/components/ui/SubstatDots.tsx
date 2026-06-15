import type { ArtifactSubstat } from "../../types/artifact";

interface SubstatDotsProps {
  substats: ArtifactSubstat[];
}

const QUALITY_COLORS: Record<ArtifactSubstat["rollQuality"], string> = {
  high: "#22c55e",
  medium: "#eab308",
  low: "#ef4444",
};

export function SubstatDots({ substats }: SubstatDotsProps) {
  if (substats.length === 0) {
    return <div className="text-xs text-dark-muted/50 mt-0.5">No substats</div>;
  }

  return (
    <div className="flex items-center gap-4 mt-1.5">
      {substats.map((sub) => {
        const color = QUALITY_COLORS[sub.rollQuality];
        const fullDots = Math.floor(sub.rollCount);
        const hasHalf = sub.rollCount - fullDots >= 0.5;
        const emptyDots = Math.max(0, 4 - fullDots - (hasHalf ? 1 : 0));

        return (
          <div key={sub.statKey} className="flex items-center gap-1" title={`${sub.displayName}: ${sub.shortName}`}>
            <span className="text-xs text-dark-muted w-8 truncate">{sub.shortName}</span>
            <div className="flex gap-1">
              {Array.from({ length: fullDots }, (_, i) => (
                <span key={`f-${i}`} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              ))}
              {hasHalf && (
                <span className="w-2 h-2 rounded-full opacity-40" style={{ backgroundColor: color }} />
              )}
              {Array.from({ length: emptyDots }, (_, i) => (
                <span key={`e-${i}`} className="w-2 h-2 rounded-full bg-dark-border/40" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
