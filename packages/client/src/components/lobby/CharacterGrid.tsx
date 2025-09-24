import React, { useRef } from 'react';
import { buildCharacterTokenClass } from '../../constants/visual';

interface Character {
  id: string;
  name: string;
  team: string;
  [key: string]: any;
}

interface CharacterGridProps {
  characters?: Character[];
  onCharacterHover: (character: Character | null) => void;
  onCharacterSelect?: (character: Character) => void;
  selectedCharacterId?: string;
  teamRing: Record<string, string>;
  className?: string;
  modifierTypesByCharacterId?: Record<string, string[]>; // list of modifier types that apply to given character
}

const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  onCharacterHover,
  onCharacterSelect,
  selectedCharacterId,
  teamRing,
  className = '',
  modifierTypesByCharacterId,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollContainerBy = (delta: number) => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const handleCharacterHover = (character: Character | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (character) {
      onCharacterHover(character);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        onCharacterHover(null);
        hoverTimeoutRef.current = null;
      }, 100);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const showScrollArrows = (characters?.length || 0) > 25; // 5 rows * 5 cols visible approx

  return (
    <div className={`card p-4 flex flex-col h-[500px] ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">Characters</div>
        {characters && (
          <div className="text-xs text-gray-500">{characters.length} roles</div>
        )}
      </div>
      
      <div className="relative mt-3 flex-1 h-[420px]">
        {showScrollArrows && (
          <button
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
            onClick={() => scrollContainerBy(-240)}
            aria-label="Scroll characters left"
          >
            ←
          </button>
        )}
        
        {characters?.length ? (
          <div
            ref={scrollerRef}
            data-testid="character-grid"
            className="grid grid-flow-col auto-cols-[100px] grid-rows-5 gap-2 overflow-x-auto overflow-y-hidden no-scrollbar h-full px-12"
          >
            {characters.map((character) => {
              const imgSrc = `/artwork/characters/${(character.id || '').toLowerCase()}.png`;
              const ring = teamRing[character.team] || 'ring-gray-500/50';
              const modifierTypes = modifierTypesByCharacterId?.[character.id] || [];
              const isSelected = selectedCharacterId === character.id;
              const baseImageWrapper = `w-16 h-16 rounded-full overflow-hidden ring-2 ${ring} bg-black/40 border ${isSelected ? 'border-clocktower-accent shadow-[0_0_0_2px_rgba(255,215,0,0.35)]' : 'border-gray-700'}`;
              const wrapperClass = buildCharacterTokenClass(baseImageWrapper, modifierTypes);
              
              return (
                <button
                  key={character.id}
                  onMouseEnter={() => handleCharacterHover(character)}
                  onMouseLeave={() => handleCharacterHover(null)}
                  onClick={() => onCharacterSelect && onCharacterSelect(character)}
                  className="flex flex-col items-center text-center p-1 rounded hover:bg-white/5 transition"
                  title={character.name}
                  aria-pressed={isSelected}
                  data-selected={isSelected || undefined}
                >
                  <div className={wrapperClass}>
                    <img
                      src={imgSrc}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg';
                      }}
                      alt={character.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <div className="mt-1 text-[9px] font-medium leading-tight w-full text-gray-100 break-words">
                    {character.name}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-400 text-sm py-6 px-4 text-center">
            Select a script to view its characters.
          </div>
        )}
        
        {showScrollArrows && (
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
            onClick={() => scrollContainerBy(240)}
            aria-label="Scroll characters right"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
};

export default CharacterGrid;