import { GRADE_THRESHOLDS } from "../../lib/constants";
import type { ScoreGrade } from "../../types/artifact";

interface ScoreBadgeProps {
  score: number;
  grade: ScoreGrade;
  pulse?: boolean;
}

/**
 * Look up the background color and text color for a grade from GRADE_THRESHOLDS.
 * Falls back to the lowest grade entry if no match is found.
 */
function getGradeColors(grade: ScoreGrade): { color: string; textColor: string } {
  const entry = GRADE_THRESHOLDS.find((t) => t.grade === grade);
  if (entry) {
    return { color: entry.color, textColor: entry.textColor };
  }
  // Fallback to the last entry (lowest grade — "F")
  const fallback = GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
  return { color: fallback.color, textColor: fallback.textColor };
}

/** Grades that trigger the pulse highlight animation */
const HIGHLIGHT_GRADES: Set<ScoreGrade> = new Set([
  "WTF+", "WTF", "SSS+", "SSS",
]);

export function ScoreBadge({ score, grade, pulse = false }: ScoreBadgeProps) {
  const { color: bgColor, textColor } = getGradeColors(grade);
  const shouldPulse = pulse && HIGHLIGHT_GRADES.has(grade);

  // Display potentialPercent rounded to 1 decimal place
  const displayScore = score.toFixed(1);

  return (
    <span
      className={`score-pill inline-flex items-center justify-center ${
        shouldPulse ? "animate-score-pulse" : ""
      }`}
      style={{ backgroundColor: bgColor, color: textColor }}
      title={`Score: ${displayScore}% — Grade: ${grade}`}
    >
      {displayScore}%
      <span className="ml-1 text-xs opacity-90">{grade}</span>
    </span>
  );
}
