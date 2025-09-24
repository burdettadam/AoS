import React from 'react';
import { extractNightOrder, NightOrderEntry } from '../../utils/setupUtils';

interface DetailedNightOrderPanelProps {
  selectedScript?: any;
}

export const DetailedNightOrderPanel: React.FC<DetailedNightOrderPanelProps> = ({ selectedScript }) => {
  const nightOrder: NightOrderEntry[] = React.useMemo(() => extractNightOrder(selectedScript), [selectedScript]);
  if (!nightOrder.length) return null;

  return (
    <div className="card p-3 mb-3" data-testid="detailed-night-order-panel">
      <div className="text-sm font-semibold text-gray-200 mb-2 flex items-center justify-between">
        <span>Detailed Night Order</span>
        <span className="text-xs text-gray-500">{nightOrder.length} steps</span>
      </div>
      <ol className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar text-xs pr-1">
        {nightOrder.map((e, idx) => (
          <li key={idx} className="flex gap-2 items-start">
            <span className="text-gray-500 w-5 text-right flex-shrink-0">{idx + 1}.</span>
            <div className="flex-1 min-w-0">
              <div className="text-gray-200 truncate" title={e.id}>{e.id}</div>
              {e.description && <div className="text-[10px] text-gray-400 leading-tight whitespace-pre-wrap">{e.description}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
