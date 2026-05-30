import type { CharacterData } from "../../types/character";
import { CharacterCard } from "./CharacterCard";

interface CharacterGridProps {
  characters: CharacterData[];
}

export function CharacterGrid({ characters }: CharacterGridProps) {
  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3 opacity-40"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="text-sm">No characters found on this showcase.</p>
        <p className="text-xs mt-1 opacity-60">
          The player may need to set up their character showcase in-game.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {characters.map((character, index) => (
        <CharacterCard key={character.id} character={character} index={index} />
      ))}
    </div>
  );
}
