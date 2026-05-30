import type { ScoreGrade } from "../../types/artifact";
import { GRADE_COLORS } from "../../types/artifact";

interface BuildScoreBarProps {
  score: number;
  grade: ScoreGrade;
  artifactCount: number;
}

export function BuildScoreBar({ score, grade, artifactCount }: BuildScoreBarProps) {
  const barColor = GRADE_COLORS[grade] ?? "#6b7280";

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card/30 p-5 sm:p-6">
      <div className="flex items-center gap-5 sm:gap-6">
        {/* Massive grade letter */}
        <div
          className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] flex-shrink-0 items-center justify-center rounded-xl text-4xl sm:text-5xl font-bold font-mono"
          style={{ backgroundColor: `${barColor}20`, color: barColor }}
        >
          {grade}
        </div>

        {/* Score details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-dark-muted">
              Build Score
              {artifactCount < 5 && (
                <span className="ml-1 opacity-60">({artifactCount}/5)</span>
              )}
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono" style={{ color: barColor }}>
              {score}
            </span>
          </div>

          {/* Thicker progress bar */}
          <div className="mt-2.5 h-3 sm:h-4 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((score / 54) * 100, 100)}%`, /* Normalize to ~54 max score theoretically for average display or standard percentage */
                backgroundColor: barColor,
              }}
            />
          </div>

          {/* Grade labels */}
          <div className="mt-1 flex justify-between text-[10px] sm:text-xs text-dark-muted/50">
            <span>F</span>
            <span>D</span>
            <span>C</span>
            <span>B</span>
            <span>A</span>
            <span>S</span>
            <span>OP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
