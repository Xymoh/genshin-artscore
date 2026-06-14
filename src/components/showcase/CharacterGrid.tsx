import type { CharacterData } from "../../types/character";
import { CharacterCard } from "./CharacterCard";
import charactersEmptyIcon from "../../assets/svg/ico-characters-empty.svg";

interface CharacterGridProps {
  characters: CharacterData[];
}

export function CharacterGrid({ characters }: CharacterGridProps) {
  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
        <img src={charactersEmptyIcon} alt="" className="w-12 h-12 mb-3 opacity-40" />
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
