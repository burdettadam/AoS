import React from 'react';
import { RoleDistribution, computeExpectedDistribution } from '../../utils/setupUtils';

interface GameSetupInfoPanelProps {
  playerCount: number;
  selectedScript?: any;
  selectedCharacterIds: string[];
}

export const GameSetupInfoPanel: React.FC<GameSetupInfoPanelProps> = ({ playerCount, selectedScript, selectedCharacterIds }) => {
  const hasScript = !!selectedScript;
  const distribution: RoleDistribution = React.useMemo(
    () => (hasScript ? computeExpectedDistribution(playerCount, selectedScript, selectedCharacterIds) : { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 }),
    [playerCount, selectedScript, selectedCharacterIds, hasScript]
  );
  const scriptName = hasScript ? selectedScript?.name : 'No Script Selected';
  const complexity = hasScript ? (selectedScript?.meta?.complexity || selectedScript?.complexity) : '—';

  return (
    <div className="card p-3 mb-3" data-testid="game-setup-info-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-200">Game Setup</div>
        <div className="text-xs text-gray-400">Players: {playerCount}</div>
      </div>
      <div className="text-xs text-gray-400 mb-2">Script: <span className="text-gray-200 font-medium">{scriptName}</span> • Difficulty: {complexity}</div>
      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
        {(['townsfolk','outsiders','minions','demons'] as const).map(team => (
          <div key={team} className={`bg-clocktower-dark/40 border rounded p-2 ${hasScript ? 'border-gray-700' : 'border-gray-800 opacity-50'}`}>            
            <div className="uppercase tracking-wide text-[10px] text-gray-400 mb-1">{team}</div>
            <div className="text-lg font-bold text-gray-100">{hasScript ? distribution[team] : '—'}</div>
          </div>
        ))}
      </div>
      {hasScript && selectedScript?.modifiers?.length ? (
        <div className="mt-3 text-[10px] text-gray-400 italic">Distribution reflects active script modifiers.</div>
      ) : !hasScript ? (
        <div className="mt-3 text-[10px] text-gray-500 italic">Select a script to calculate distribution.</div>
      ) : null}
    </div>
  );
};
