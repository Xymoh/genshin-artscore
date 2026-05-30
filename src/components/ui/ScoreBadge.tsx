import { GRADE_COLORS } from "../../types/artifact";
import type { ScoreGrade } from "../../types/artifact";

interface ScoreBadgeProps {
  score: number;
  grade: ScoreGrade;
  pulse?: boolean;
}

export function ScoreBadge({ score, grade, pulse = false }: ScoreBadgeProps) {
  const bgColor = GRADE_COLORS[grade] ?? "#6b7280";
  const isSPlus = grade === "WTF" || grade === "OP" || grade === "SSS";

  return (
    <span
      className={`score-pill inline-flex items-center justify-center ${
        pulse && isSPlus ? "animate-score-pulse" : ""
      }`}
      style={{ backgroundColor: bgColor }}
      title={`Score: ${score} — Grade: ${grade}`}
    >
      {score}
      <span className="ml-1 text-xs opacity-90">{grade}</span>
    </span>
  );
}
