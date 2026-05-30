import type { ArtifactSubstat } from "../../types/artifact";

interface SubstatBarProps {
  substat: ArtifactSubstat;
}

const QUALITY_COLORS: Record<ArtifactSubstat["rollQuality"], string> = {
  high: "#22c55e",
  medium: "#eab308",
  low: "#ef4444",
};

function formatStatValue(value: number, isPercentage: boolean): string {
  if (isPercentage) {
    return `${value.toFixed(1)}%`;
  }
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
}

export function SubstatBar({ substat }: SubstatBarProps) {
  const fillColor = QUALITY_COLORS[substat.rollQuality];
  const barWidth = Math.min((substat.rollCount / 2.25) * 100, 100);

  const fullDots = Math.floor(substat.rollCount);
  const hasHalfDot = substat.rollCount - fullDots >= 0.5;
  const emptyDots = Math.max(0, 5 - fullDots - (hasHalfDot ? 1 : 0));

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Stat name */}
      <span
        className="w-10 text-xs font-medium text-dark-muted whitespace-nowrap flex-shrink-0"
        title={substat.displayName}
      >
        {substat.shortName}
      </span>

      {/* Value */}
      <span className="w-16 text-right text-xs font-mono text-dark-text flex-shrink-0">
        {formatStatValue(substat.value, substat.isPercentage)}
      </span>

      {/* Bar */}
      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden min-w-0">
        <div
          className="h-full rounded-full transition-all duration-600"
          style={{ width: `${barWidth}%`, backgroundColor: fillColor }}
        />
      </div>

      {/* Roll dots */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {Array.from({ length: fullDots }, (_, i) => (
          <span
            key={`full-${i}`}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: fillColor }}
          />
        ))}
        {hasHalfDot && (
          <span
            className="w-2 h-2 rounded-full opacity-50"
            style={{ backgroundColor: fillColor }}
          />
        )}
        {Array.from({ length: emptyDots }, (_, i) => (
          <span
            key={`empty-${i}`}
            className="w-2 h-2 rounded-full bg-white/12"
          />
        ))}
      </div>
    </div>
  );
}
