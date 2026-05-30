import type { CharacterData } from "../../types/character";
import { ELEMENT_COLORS } from "../../types/character";
import { GRADE_COLORS } from "../../types/artifact";
import { useState } from "react";

const ENKA_UI_BASE = "https://enka.network/ui";

interface CharacterStripProps {
  characters: CharacterData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function PortraitImg({ url, name }: { url: string; name: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return <span className="text-sm font-bold text-dark-muted">{name.charAt(0)}</span>;
  }

  return (
    <img
      src={url}
      alt={name}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

export function CharacterStrip({ characters, selectedId, onSelect }: CharacterStripProps) {
  if (characters.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
      {characters.map((character) => {
        const elementColor = ELEMENT_COLORS[character.element] ?? "#6b7280";
        const isSelected = character.id === selectedId;
        const portraitUrl = character.icon
          ? `${ENKA_UI_BASE}/${character.icon}.png`
          : null;
        const gradeColor = GRADE_COLORS[character.buildScore.grade] ?? "#6b7280";

        return (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelect(character.id)}
            className={`relative flex flex-col items-center gap-1.5 min-w-[88px] px-3 py-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
              isSelected
                ? "bg-dark-card-hover ring-2 ring-accent scale-105 z-10"
                : "hover:bg-dark-card-hover/50"
            }`}
            title={`${character.name} — Lv.${character.level} C${character.constellation} — Score: ${character.buildScore.total} (${character.buildScore.grade})`}
          >
            {/* Portrait circle with element border */}
            <div
              className="relative h-22 w-22 flex-shrink-0 overflow-hidden rounded-full border-[3px]"
              style={{ borderColor: elementColor }}
            >
              {portraitUrl ? (
                <PortraitImg url={portraitUrl} name={character.name} />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-2xl font-bold"
                  style={{ color: elementColor }}
                >
                  {character.name.charAt(0)}
                </div>
              )}
              {/* Score badge overlay at bottom-right */}
              <div
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono ring-[3px] ring-dark-bg"
                style={{ backgroundColor: gradeColor, color: "#0f1117" }}
                title={`${character.buildScore.total} (${character.buildScore.grade})`}
              >
                {character.buildScore.grade}
              </div>
            </div>

            {/* Name */}
            <span
              className={`max-w-[80px] text-xs leading-tight text-center line-clamp-2 ${
                isSelected ? "font-medium text-dark-text" : "text-dark-muted"
              }`}
            >
              {character.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
