import React from 'react';

interface ModifiersPanelProps {
  modifiers?: any[];
}

const CharacterIcon: React.FC<{ characterId: string; size?: 'sm' | 'md' }> = ({ characterId, size = 'sm' }) => {
  const imgSrc = `/artwork/characters/${(characterId || '').toLowerCase()}.png`;
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-black/40 border border-gray-600 flex-shrink-0`}>
      <img
        src={imgSrc}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg'; }}
        alt={characterId}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
};

const ModifierItem: React.FC<{ modifier: any }> = ({ modifier }) => {
  const renderModifier = () => {
    switch (modifier.type) {
      case 'requires':
        return (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/50 flex items-center justify-center">
                <span className="text-[8px] font-bold text-purple-300">R</span>
              </div>
              <CharacterIcon characterId={modifier.whenCharacter} size="md" />
              <span className="text-gray-200 font-medium">{modifier.whenCharacter}</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center">
                <span className="text-[6px] font-bold text-blue-300">+</span>
              </div>
              <div className="flex items-center gap-1">
                {modifier.requireCharacters?.map((charId: string, idx: number) => (
                  <CharacterIcon key={idx} characterId={charId} />
                ))}
                {modifier.requireCharacters?.length > 3 && (
                  <span className="text-xs text-gray-400">+{modifier.requireCharacters.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'adjustCounts':
        return (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-500/50 flex items-center justify-center">
                <span className="text-[8px] font-bold text-amber-300">±</span>
              </div>
              <CharacterIcon characterId={modifier.whenCharacter} size="md" />
              <span className="text-gray-200 font-medium">{modifier.whenCharacter}</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex gap-2">
              {Object.entries(modifier.delta || {}).map(([team, count]) => (
                <div key={team} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold ${
                    Number(count) > 0 
                      ? 'bg-green-600/20 border border-green-500/50 text-green-300' 
                      : 'bg-red-600/20 border border-red-500/50 text-red-300'
                  }`}>
                    {Number(count) > 0 ? '+' : ''}
                  </div>
                  <span className="text-gray-200">{String(count)} {team}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'mutuallyExclusive':
        return (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center">
                <span className="text-[8px] font-bold text-red-300">✗</span>
              </div>
              <span className="text-red-200 font-medium">Exclusive</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-2">
              {modifier.characters?.map((charId: string, idx: number) => (
                <React.Fragment key={charId}>
                  <div className="flex items-center gap-1">
                    <CharacterIcon characterId={charId} />
                    <span className="text-gray-200">{charId}</span>
                  </div>
                  {idx < modifier.characters.length - 1 && (
                    <span className="text-red-400 font-bold">VS</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      
      case 'atLeastOneOf':
        return (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-green-600/20 border border-green-500/50 flex items-center justify-center">
                <span className="text-[8px] font-bold text-green-300">1+</span>
              </div>
              <span className="text-green-200 font-medium">Min One</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-1">
              {modifier.characters?.map((charId: string) => (
                <CharacterIcon key={charId} characterId={charId} />
              ))}
            </div>
          </div>
        );
      
      case 'specialRule':
        return (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-sky-600/20 border border-sky-500/50 flex items-center justify-center">
                <span className="text-[8px] font-bold text-sky-300">F</span>
              </div>
              <span className="text-sky-200 font-medium">Fabled</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-1">
              {modifier.fabled && <CharacterIcon characterId={modifier.fabled} />}
              <span className="text-gray-200 capitalize">{modifier.fabled?.replace('-', ' ')}</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-xs text-gray-300">
            <span className="font-medium capitalize">{modifier.type}:</span>
            <span className="ml-2">{JSON.stringify(modifier)}</span>
          </div>
        );
    }
  };

  return (
    <div className="p-2 rounded bg-clocktower-dark/40 border border-gray-700 hover:border-gray-600 transition-colors">
      {renderModifier()}
      {modifier.note && (
        <div className="text-[10px] text-gray-400 mt-1 italic border-t border-gray-700 pt-1">
          {modifier.note}
        </div>
      )}
    </div>
  );
};

export const ModifiersPanel: React.FC<ModifiersPanelProps> = ({ modifiers }) => (
  <div className="card p-3 mb-3 max-h-[140px] overflow-y-auto custom-scrollbar">
    <div className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
      <span>Script Modifiers</span>
      {modifiers && modifiers.length > 0 && (
        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
          {modifiers.length}
        </span>
      )}
    </div>
    {modifiers && modifiers.length > 0 ? (
      <div className="space-y-2">
        {modifiers.map((modifier: any, idx: number) => (
          <ModifierItem key={idx} modifier={modifier} />
        ))}
      </div>
    ) : (
      <div className="text-gray-400 text-xs py-2 text-center italic">
        No special rules for this script
      </div>
    )}
  </div>
);
