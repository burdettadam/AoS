import React from 'react';

interface ModifiersPanelProps {
  modifiers?: any[];
}

export const ModifiersPanel: React.FC<ModifiersPanelProps> = ({ modifiers }) => (
  <div className="card p-3 mb-3 max-h-[120px] overflow-y-auto">
    <div className="text-sm font-semibold text-gray-200 mb-2">Script Modifiers</div>
    {modifiers && modifiers.length > 0 ? (
      <ul className="space-y-1 text-xs text-gray-300">
        {modifiers.map((m: any, idx: number) => {
          const label = m.type;
          const detail = m.type === 'requires'
            ? `${m.whenCharacter} → requires ${m.requireCharacters?.join(', ')}`
            : m.type === 'adjustCounts'
            ? `${m.whenCharacter} → ${Object.entries(m.delta||{}).map(([k,v])=>`${k}:${v}`).join(', ')}`
            : m.type === 'mutuallyExclusive'
            ? `exclusive: ${m.characters?.join(' vs ')}`
            : m.type === 'atLeastOneOf'
            ? `at least one of: ${m.characters?.join(', ')}`
            : JSON.stringify(m);
          return (
            <li key={idx} className="p-2 rounded bg-clocktower-dark/40 border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{label}</span>
                {m.note && <span className="text-[10px] text-gray-400 ml-2">{m.note}</span>}
              </div>
              <div className="text-[11px] text-gray-300 mt-0.5">{detail}</div>
            </li>
          );
        })}
      </ul>
    ) : (
      <div className="text-gray-400 text-xs">No modifiers for this script</div>
    )}
  </div>
);
