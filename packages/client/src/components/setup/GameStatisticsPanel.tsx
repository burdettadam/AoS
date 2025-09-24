import React from 'react';
import { detectScriptIssues, summarizeDifficulty, validateSetup, computeExpectedDistribution } from '../../utils/setupUtils';

interface GameStatisticsPanelProps {
  selectedScript?: any;
  playerCount: number;
  selectedCharacterIds: string[];
}

export const GameStatisticsPanel: React.FC<GameStatisticsPanelProps> = ({ selectedScript, playerCount, selectedCharacterIds }) => {
  const difficulty = summarizeDifficulty(selectedScript) || 'Unknown';
  const scriptIssues = React.useMemo(() => detectScriptIssues(selectedScript), [selectedScript]);
  const expected = React.useMemo(() => computeExpectedDistribution(playerCount, selectedScript, selectedCharacterIds), [playerCount, selectedScript, selectedCharacterIds]);
  const validation = React.useMemo(() => validateSetup(selectedScript, selectedCharacterIds, expected), [selectedScript, selectedCharacterIds, expected]);

  return (
    <div className="card p-3" data-testid="game-statistics-panel">
      <div className="text-sm font-semibold text-gray-200 mb-1">Game Statistics</div>
      <div className="text-[11px] text-gray-400 mb-2">Difficulty: <span className="text-gray-200">{difficulty}</span></div>
      {scriptIssues.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Heuristic Issues</div>
          <ul className="list-disc ml-5 space-y-0.5 text-[11px] text-gray-300">
            {scriptIssues.map((issue, idx) => <li key={idx}>{issue}</li>)}
          </ul>
        </div>
      )}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Validation</div>
        {validation.issues.length === 0 ? (
          <div className="text-[11px] text-green-400">All good.</div>
        ) : (
          <ul className="list-disc ml-5 space-y-0.5 text-[11px] text-red-300">
            {validation.issues.map((i, idx) => <li key={idx}>{i.message}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
};
