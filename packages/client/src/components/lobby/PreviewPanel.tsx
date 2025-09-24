import React from 'react';

interface PreviewPanelProps {
  artworkSrc: string;
  hoverCharacter?: any;
  selectedCharacter?: any;
  selectedScript?: any;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ artworkSrc, hoverCharacter, selectedCharacter, selectedScript }) => {
  const character = hoverCharacter || selectedCharacter;
  const title = character ? character.name : selectedScript?.name || 'Pick a script';
  const subtitle = character ? character.team : selectedScript?.meta?.complexity;

  const deriveCharacterDescription = (c: any): string | undefined => {
    if (!c) return undefined;
    // Primary fields
    const direct = c.ability || c.description || c.abilityText || c.text;
    if (direct && direct.trim()) return direct.trim();
    // Look inside actions for the first non-empty description
    const actionsObj = c.actions;
    if (actionsObj && typeof actionsObj === 'object') {
      const actionLists = Object.values(actionsObj).filter(Array.isArray) as any[][];
      for (const list of actionLists) {
        for (const action of list) {
          if (action && typeof action.description === 'string' && action.description.trim()) {
            return action.description.trim();
          }
        }
      }
    }
    return undefined;
  };

  const description = character ? deriveCharacterDescription(character) : selectedScript?.meta?.description;
  const imageSrc = character ? `/artwork/characters/${(character.id || '').toLowerCase()}.png` : artworkSrc;

  return (
    <div className="card p-4 mb-3 flex flex-col h-[500px]" data-testid="preview-panel">
      <div className="text-sm text-gray-300">Preview</div>
      <div className="mt-2 w-full bg-black/40 border border-gray-700 rounded flex items-center justify-center overflow-hidden" style={{ height: '180px' }} data-testid="preview-art">
        <img
          src={imageSrc}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg'; }}
          alt={title}
          className="object-contain w-full h-full"
        />
      </div>
      <div className="mt-4 pt-3 border-t border-gray-800 flex-1 flex flex-col min-h-0" data-testid="preview-description">
        <div className="text-lg font-semibold text-gray-100 truncate" title={title}>{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 uppercase tracking-wide mt-1 mb-2">
            {subtitle}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto text-sm text-gray-200 whitespace-pre-wrap leading-relaxed pr-2 custom-scrollbar">
            {description || 'Select a script or hover over a character to view its description.'}
          </div>
        </div>
      </div>
    </div>
  );
};
