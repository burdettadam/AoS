import React from 'react';
import { CarouselScroller } from '../CarouselScroller';

interface ScriptScrollerProps {
  scripts: any[];
  selectedScriptId?: string;
  onSelect?: (id: string) => void;
}

export const ScriptScroller: React.FC<ScriptScrollerProps> = ({ scripts, selectedScriptId, onSelect }) => (
  <CarouselScroller
    items={scripts}
    slidesPerView={7}
  centered
  renderSlide={(s: any) => (
      <div key={s.id}>
        <button
          className={`px-3 py-2 rounded border text-xs ${selectedScriptId === s.id ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-clocktower-dark hover:border-gray-500'}`}
          onClick={() => onSelect?.(s.id)}
        >
          <div className="text-sm">{s.name}</div>
          {s.meta?.complexity && <div className="text-[10px] text-gray-400 capitalize">{s.meta.complexity}</div>}
        </button>
      </div>
    )}
  />
);
