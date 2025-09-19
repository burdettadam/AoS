import React from 'react';

interface NightOrderPanelProps {
  nightOrder?: string[];
}

export const NightOrderPanel: React.FC<NightOrderPanelProps> = ({ nightOrder }) => (
  <div className="card p-3 mb-3 max-h-[120px] overflow-y-auto">
    <div className="text-sm font-semibold text-gray-200 mb-2">Night Order</div>
    {nightOrder && nightOrder.length > 0 ? (
      <ol className="space-y-1 text-xs text-gray-300 list-decimal list-inside">
        {nightOrder.map((character, idx) => (
          <li key={idx} className="p-2 rounded bg-clocktower-dark/40 border border-gray-700">
            <span className="font-medium">{character}</span>
          </li>
        ))}
      </ol>
    ) : (
      <div className="text-gray-400 text-xs">No night order for this script</div>
    )}
  </div>
);
