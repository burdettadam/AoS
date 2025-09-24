import React, { useRef } from 'react';
import type { LoadedScript } from '@botc/shared';

interface ScriptCarouselProps {
  scripts: LoadedScript[];
  selectedScriptId?: string;
  title: string;
  subtitle?: string;
  keyboardNavigation?: boolean;
  onScriptSelect: (scriptId: string) => void;
  onScriptAction?: (scriptId: string) => void;
  getActionProps?: (script: LoadedScript) => {
    label: string;
    isActive: boolean;
    'data-testid'?: string;
  };
  testId?: string;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

const ScriptCarousel: React.FC<ScriptCarouselProps> = ({
  scripts,
  selectedScriptId,
  title,
  subtitle,
  keyboardNavigation = false,
  onScriptSelect,
  onScriptAction,
  getActionProps,
  testId,
  className = '',
  onKeyDown,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollContainerBy = (delta: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  if (scripts.length === 0) {
    return (
      <div className={`card w-full p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-300">{title}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
        <div className="text-gray-400 text-sm py-6 px-4 w-full text-center">
          {title.includes('Storyteller') ? 'No scripts are available yet.' : 'Waiting for storyteller to share scripts.'}
        </div>
      </div>
    );
  }

  return (
    <div className={`card w-full p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-300">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        {keyboardNavigation && scripts.length > 0 && (
          <div className="text-xs text-gray-500 uppercase tracking-wide">Use ← → to navigate</div>
        )}
      </div>
      
      <div className="relative">
        <button
          type="button"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
          onClick={() => scrollContainerBy(-360)}
          aria-label="Scroll scripts left"
        >
          ←
        </button>
        
        <div
          ref={containerRef}
          data-testid={testId}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-12"
          tabIndex={keyboardNavigation ? 0 : undefined}
          onKeyDown={onKeyDown}
        >
          {scripts.map((script) => {
            const isSelected = selectedScriptId === script.id;
            const actionProps = getActionProps?.(script);
            
            return (
              <div key={script.id} className="relative shrink-0 w-52">
                <button
                  className={`w-full text-left border rounded-lg px-3 py-3 bg-clocktower-dark transition focus:outline-none focus:ring-2 focus:ring-clocktower-accent ${
                    isSelected 
                      ? 'border-clocktower-accent shadow-[0_0_0_2px_rgba(56,189,248,0.3)]' 
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => onScriptSelect(script.id)}
                  data-testid={`script-${script.id}`}
                >
                  <div className="text-base font-semibold text-gray-100 truncate" title={script.name}>
                    {script.name}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col gap-1">
                      {script.meta?.complexity && (
                        <div className="text-[11px] text-gray-400 uppercase tracking-wide">
                          {script.meta.complexity}
                        </div>
                      )}
                      {script.meta?.playerCount && (
                        <div className="text-[11px] text-gray-500">
                          Players {script.meta.playerCount.min ?? '?'}
                          {script.meta.playerCount.max ? `–${script.meta.playerCount.max}` : ''}
                        </div>
                      )}
                    </div>
                    {script.modifiers && script.modifiers.length > 0 && (
                      <div className="flex gap-1">
                        {script.modifiers.slice(0, 3).map((modifier: any, idx: number) => {
                          let tokenColor = 'bg-gray-600/20 border-gray-500/50 text-gray-400';
                          let tokenIcon = '?';
                          
                          switch (modifier.type) {
                            case 'requires':
                              tokenColor = 'bg-purple-600/20 border-purple-500/50 text-purple-300';
                              tokenIcon = 'R';
                              break;
                            case 'adjustCounts':
                              tokenColor = 'bg-amber-600/20 border-amber-500/50 text-amber-300';
                              tokenIcon = '±';
                              break;
                            case 'mutuallyExclusive':
                              tokenColor = 'bg-red-600/20 border-red-500/50 text-red-300';
                              tokenIcon = '✗';
                              break;
                            case 'atLeastOneOf':
                              tokenColor = 'bg-green-600/20 border-green-500/50 text-green-300';
                              tokenIcon = '1+';
                              break;
                            case 'specialRule':
                              tokenColor = 'bg-sky-600/20 border-sky-500/50 text-sky-300';
                              tokenIcon = 'F';
                              break;
                          }
                          
                          return (
                            <div
                              key={idx}
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${tokenColor}`}
                              title={`${modifier.type}: ${modifier.note || 'Special rule applies'}`}
                            >
                              <span className="text-[6px] font-bold">{tokenIcon}</span>
                            </div>
                          );
                        })}
                        {script.modifiers.length > 3 && (
                          <div className="w-4 h-4 rounded-full bg-gray-600/20 border border-gray-500/50 flex items-center justify-center text-gray-400">
                            <span className="text-[6px] font-bold">+{script.modifiers.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
                
                {actionProps && onScriptAction && (
                  <button
                    type="button"
                    className={`absolute -top-2 -right-2 w-7 h-7 rounded-full border text-sm font-bold transition ${
                      actionProps.isActive 
                        ? 'bg-emerald-400 text-black border-emerald-200' 
                        : 'bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600'
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onScriptAction(script.id);
                    }}
                    aria-pressed={actionProps.isActive}
                    aria-label={actionProps.label}
                    data-testid={actionProps['data-testid']}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
          onClick={() => scrollContainerBy(360)}
          aria-label="Scroll scripts right"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default ScriptCarousel;