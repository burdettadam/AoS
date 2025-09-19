import React from 'react';
import { CarouselScroller } from '../CarouselScroller';

interface CharacterScrollerProps {
  characters: any[];
  onHover?: (character: any) => void;
  onUnhover?: () => void;
}

export const CharacterScroller: React.FC<CharacterScrollerProps> = ({ characters, onHover, onUnhover }) => (
  <CarouselScroller
    items={characters}
    slidesPerView={4}
  centered
  renderSlide={(c: any) => {
      const imgSrc = `/artwork/characters/${(c.id || '').toLowerCase()}.png`;
      const ring = c.team ? `ring-${c.team}-500/60` : 'ring-gray-500/50';
      return (
        <button
          key={c.id}
          onMouseEnter={() => onHover?.(c)}
          onMouseLeave={onUnhover}
          className="w-[110px] flex flex-col items-center text-center p-1 rounded hover:bg-white/5"
          title={c.name}
        >
          <div className={`w-20 h-20 rounded-full overflow-hidden ring-2 ${ring} bg-black/40 border border-gray-700`}>
            <img
              src={imgSrc}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg'; }}
              alt={c.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="mt-1 text-[10px] font-medium leading-tight truncate w-full">{c.name}</div>
        </button>
      );
    }}
  />
);
