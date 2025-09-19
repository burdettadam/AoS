import React from 'react';

interface PreviewPanelProps {
  artworkSrc: string;
  hoverCharacter?: any;
  selectedScript?: any;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ artworkSrc, hoverCharacter, selectedScript }) => {
  const title = hoverCharacter ? hoverCharacter.name : selectedScript?.name || 'Pick a script';
  const subtitle = hoverCharacter ? hoverCharacter.team : selectedScript?.meta?.complexity;
  const description = hoverCharacter ? hoverCharacter.ability : selectedScript?.meta?.description;
  const imageSrc = hoverCharacter ? `/artwork/characters/${(hoverCharacter.id || '').toLowerCase()}.png` : artworkSrc;

  return (
    <div className="card p-4 mb-3 flex flex-col h-[480px]" data-testid="preview-panel">
      <div className="text-sm text-gray-300">Preview</div>
      <div className="mt-2 aspect-square w-full bg-black/40 border border-gray-700 rounded flex items-center justify-center overflow-hidden" data-testid="preview-art">
        <img
          src={imageSrc}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg'; }}
          alt={title}
          className="object-contain w-full h-full"
        />
      </div>
      <div className="mt-4 pt-3 border-t border-gray-800 flex-1 flex flex-col overflow-hidden" data-testid="preview-description">
        <div className="text-lg font-semibold text-gray-100 truncate" title={title}>{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
            {subtitle}
          </div>
        )}
        <div className="mt-3 text-sm text-gray-200 whitespace-pre-line leading-relaxed overflow-y-auto pr-2">
          {description || 'Select a script to view its description.'}
        </div>
      </div>
    </div>
  );
};
