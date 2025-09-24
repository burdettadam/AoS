import React from 'react';

// Generic night order reference (not script specific)
// Intentionally minimal – goal is quick glance reading left→right.
const NIGHT_ORDER_GROUPS: { label: string; description: string }[] = [
  { label: 'TOWNSFOLK', description: 'Good info & utility roles act earliest' },
  { label: 'OUTSIDERS', description: 'Edge-case good roles (rarely act)' },
  { label: 'MINIONS', description: 'Evil support roles (some act at night)' },
  { label: 'DEMONS', description: 'Primary evil role(s) act last' },
];

export const NightOrderPanel: React.FC = () => {
  return (
    <div className="card p-3 mb-3">
      <div className="text-sm font-semibold text-gray-200 mb-2">Night Order</div>
      <div className="flex gap-4 text-[11px]">
        {NIGHT_ORDER_GROUPS.map((g) => (
          <div key={g.label} className="flex-1 min-w-[0]">
            <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{g.label}</div>
            <div className="p-2 rounded bg-clocktower-dark/40 border border-gray-700 text-gray-300 leading-snug">
              {g.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
