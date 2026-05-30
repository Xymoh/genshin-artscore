import type { CharacterData } from "../../types/character";
import { ELEMENT_COLORS } from "../../types/character";
import { GRADE_COLORS } from "../../types/artifact";
import { ArtifactCard } from "./ArtifactCard";
import { SetBonusGrid } from "../ui/SetBonusGrid";
import { BuildScoreBar } from "../ui/BuildScoreBar";
import { useState } from "react";

interface CharacterCardProps {
  character: CharacterData;
  index: number;
}

const ENKA_UI_BASE = "https://enka.network/ui";

export function CharacterCard({ character, index }: CharacterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const elementColor = ELEMENT_COLORS[character.element] ?? "#6b7280";
  const gradeColor = GRADE_COLORS[character.buildScore.grade] ?? "#aaa";
  const hasAllArtifacts = character.artifacts.length === 5;

  const portraitUrl = character.icon
    ? `${ENKA_UI_BASE}/${character.icon.replace("AvatarIcon", "Gacha_AvatarImg")}.png`
    : null;

  const fallbackUrl = character.icon ? `${ENKA_UI_BASE}/${character.icon}.png` : null;

  return (
    <div
      className="rounded-xl border border-dark-border bg-dark-card overflow-hidden animate-fade-in-up flex flex-col relative"
      style={{
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* DROPDOWN BANNER HEADER */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-full h-24 sm:h-28 flex items-center justify-between text-left cursor-pointer overflow-hidden group border-b border-transparent hover:border-dark-border/30 transition-colors"
      >
        {/* Background color from element */}
        <div className="absolute inset-0 bg-dark-bg z-0" />
        
        {/* Banner image on the right */}
        <div className="absolute inset-0 z-0 flex justify-end">
          <div className="w-full sm:w-2/3 h-full relative" style={{
            maskImage: "linear-gradient(to right, transparent, black 60%)",
            WebkitMaskImage: "-webkit-linear-gradient(left, transparent, black 60%)",
          }}>
            <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundColor: elementColor }} />
            {portraitUrl && !imgError && (
              <img
                src={portraitUrl}
                alt={character.name}
                className="w-full h-full object-cover object-[center_30%] opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                loading="lazy"
                onError={(e) => {
                  if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                    e.currentTarget.src = fallbackUrl;
                  } else {
                    setImgError(true);
                  }
                }}
              />
            )}
            {/* Subtle gradient to darken the right edge if needed */}
            <div className="absolute inset-0 bg-gradient-to-l from-dark-bg/40 to-transparent" />
          </div>
        </div>
        
        {/* Left Gradient to ensure text is readable */}
        <div className="absolute inset-0 w-full md:w-3/4 bg-gradient-to-r from-dark-card via-dark-card/95 to-transparent z-10" />

        {/* Header Content */}
        <div className="relative z-20 flex w-full items-center justify-between px-4 sm:px-6">
          
          {/* Left Info: Name & Level */}
          <div className="flex items-center gap-4">
            {/* Element color line */}
            <div className="w-1.5 h-12 rounded-full hidden sm:block" style={{ backgroundColor: elementColor }} />
            
            <div className="flex flex-col drop-shadow-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <div 
                  className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shadow-sm" 
                  style={{ backgroundColor: `${elementColor}EE`, color: "#000" }}
                >
                  {character.element.substring(0,2).toUpperCase()}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {character.name}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-dark-muted">
                <span className="px-1.5 py-0.5 rounded bg-dark-bg/80 border border-dark-border/60 text-white/90">Lv. {character.level}</span>
                {character.constellation > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-accent/20 border border-accent/30 text-accent">C{character.constellation}</span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-dark-bg/80 border border-dark-border/60 text-white/90 hidden sm:block">{character.weaponType}</span>
              </div>
            </div>
          </div>

          {/* Right Info: Score and Expand Icon */}
          <div className="flex items-center gap-5 sm:gap-6 drop-shadow-md">
            <div className="text-right hidden xs:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 mb-0.5">Build Score</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-white">
                  {character.buildScore.total.toFixed(1)}
                </span>
                <span className="text-sm font-extrabold px-1.5 py-0.5 rounded bg-dark-bg text-dark-text border border-dark-border/80 shadow-sm" style={{ color: gradeColor }}>
                  {character.buildScore.grade}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-dark-bg/60 border border-white/20 flex items-center justify-center text-white group-hover:bg-dark-bg/80 transition-colors backdrop-blur-md shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* EXPANDABLE BODY */}
      {isExpanded && (
        <div className="border-t border-dark-border/60 bg-dark-bg/30">
          <div className="p-4 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
            
            {/* Quick Summary row for mobile since header hides it */}
            <div className="flex xs:hidden items-center justify-between bg-dark-card border border-dark-border rounded-lg p-3">
              <div className="text-sm font-medium text-dark-muted">{character.weaponType}</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-dark-muted">Score</span>
                <span className="font-mono text-sm font-bold text-white">{character.buildScore.total.toFixed(1)}</span>
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-dark-bg border border-dark-border" style={{ color: gradeColor }}>{character.buildScore.grade}</span>
              </div>
            </div>

            {/* Set Bonuses */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-3.5 shadow-sm">
              <SetBonusGrid
                artifacts={character.artifacts}
                activeSetBonuses={character.activeSetBonuses}
              />
            </div>

            {!hasAllArtifacts && character.artifacts.length > 0 && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 py-2.5 px-4 text-orange-400/90 text-xs flex items-center font-medium">
                <span className="mr-2 text-base leading-none">⚠</span> Score is incomplete, based on {character.artifacts.length}/5 artifact slots.
              </div>
            )}

            {/* Artifacts Grid */}
            {character.artifacts.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {['FLOWER', 'PLUME', 'SANDS', 'GOBLET', 'CIRCLET'].map((slotStr) => {
                  const art = character.artifacts.find(a => a.slot === slotStr);
                  if (art) {
                    return <ArtifactCard key={art.id} artifact={art} />;
                  }
                  return (
                    <div key={slotStr} className="artifact-card flex flex-col p-4 rounded-xl bg-dark-card/40 border border-dashed border-dark-border items-center justify-center opacity-60 min-h-[220px]">
                      <div className="w-14 h-14 rounded-full border border-dark-border flex items-center justify-center text-dark-muted mb-3 bg-dark-bg/50">
                        <span className="text-sm font-semibold uppercase">{slotStr.slice(0, 2)}</span>
                      </div>
                      <span className="text-xs uppercase font-bold tracking-wider text-dark-text mb-1">{slotStr}</span>
                      <span className="text-[11px] text-dark-muted/80">Slot Empty</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-dark-muted p-12 lg:p-16 border border-dashed border-dark-border/60 rounded-xl bg-dark-card/50">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30 mb-4">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <p className="text-sm font-medium">No artifacts equipped on this character.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
