import type { ScoreGrade } from "../../types/artifact";
import type { SetBonusResult } from "../../types/character";
import { GRADE_COLORS } from "../../types/artifact";

interface BuildScoreBarProps {
  score: number;
  grade: ScoreGrade;
  artifactCount: number;
  correctMainStats: number;
  totalSelectableSlots: number;
  setBonus: SetBonusResult;
}

function getSetBonusLabel(matchStatus: SetBonusResult["matchStatus"]): {
  text: string;
  color: string;
} {
  switch (matchStatus) {
    case "full_match":
      return { text: "Set ✓", color: "#22c55e" };
    case "partial_match":
      return { text: "Set ~", color: "#f59e0b" };
    case "no_match":
      return { text: "Set ✗", color: "#ef4444" };
    case "no_recommendation":
      return { text: "", color: "" };
  }
}

export function BuildScoreBar({
  score,
  grade,
  artifactCount,
  correctMainStats,
  totalSelectableSlots,
  setBonus,
}: BuildScoreBarProps) {
  const barColor = GRADE_COLORS[grade] ?? "#6b7280";
  const setBonusLabel = getSetBonusLabel(setBonus.matchStatus);

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
              {score.toFixed(1)}%
            </span>
          </div>

          {/* Progress bar using 0–200% Potential Percent range */}
          <div className="mt-2.5 h-3 sm:h-4 rounded-full bg-dark-border/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(score / 2, 100)}%`,
                backgroundColor: barColor,
              }}
            />
          </div>

          {/* Grade labels from 18-grade scale */}
          <div className="mt-1 flex justify-between text-[10px] sm:text-xs text-dark-muted/50">
            <span>F</span>
            <span>D</span>
            <span>C</span>
            <span>B</span>
            <span>A</span>
            <span>S</span>
            <span>SS</span>
            <span>SSS</span>
            <span>WTF</span>
          </div>

          {/* Main stat count and set bonus status */}
          <div className="mt-2 flex items-center gap-3 text-[10px] sm:text-xs">
            <span className="text-dark-muted">
              {correctMainStats}/{totalSelectableSlots} main stats
            </span>
            {setBonusLabel.text && (
              <span
                className="font-medium"
                style={{ color: setBonusLabel.color }}
              >
                {setBonusLabel.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
