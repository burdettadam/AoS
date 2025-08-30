import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useNavigate, useParams } from 'react-router-dom';
import { GamePhase } from '@botc/shared';

interface Character {
  id: string;
  name: string;
  team: string;
  ability: string;
  firstNight?: number;
  otherNight?: number;
  reminders?: string[];
}

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  remaining: number;
  disabled: boolean;
  onToggle: (characterId: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, isSelected, remaining, disabled, onToggle }) => {
  const teamColors: Record<string, string> = {
    townsfolk: 'bg-blue-100 border-blue-300',
    outsider: 'bg-yellow-100 border-yellow-300',
    outsiders: 'bg-yellow-100 border-yellow-300',
    minion: 'bg-red-100 border-red-300',
    minions: 'bg-red-100 border-red-300',
    demon: 'bg-purple-100 border-purple-300',
    demons: 'bg-purple-100 border-purple-300',
    traveller: 'bg-green-100 border-green-300'
  };

  const teamColor = teamColors[character.team] || 'bg-gray-100 border-gray-300';

  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all relative
        ${teamColor}
        ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2 border-blue-500 shadow-lg' : ''}
        ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
      `}
      onClick={() => onToggle(character.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{character.name}</h3>
  <span className="text-sm text-gray-800 capitalize px-2 py-1 rounded bg-white">
          {character.team}
        </span>
      </div>
      
      {character.ability && (
        <p className="text-sm text-gray-800 mb-2">{character.ability}</p>
      )}
      
  <div className="flex gap-2 text-xs text-gray-800">
        {character.firstNight && (
          <span className="bg-gray-200 px-2 py-1 rounded">First: {character.firstNight}</span>
        )}
        {character.otherNight && (
          <span className="bg-gray-200 px-2 py-1 rounded">Other: {character.otherNight}</span>
        )}
      </div>
      
      {character.reminders && character.reminders.length > 0 && (
        <div className="mt-2">
          <span className="text-xs text-gray-800">Reminders: </span>
          {character.reminders.map((reminder, idx) => (
            <span key={idx} className="text-xs bg-gray-200 px-1 py-0.5 rounded mr-1">
              {reminder}
            </span>
          ))}
        </div>
      )}

      <div className={`absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded ${remaining > 0 ? 'bg-white text-gray-800' : 'bg-gray-300 text-gray-600'}`}>
        {isSelected ? 'Selected' : `${remaining} left`}
      </div>
    </div>
  );
};

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const {
    currentGame,
    isStoryteller,
    setupState,
    currentSetupStep,
    setupLoading,
    setupError,
    enterSetup,
    selectCharacters,
  autoValidate,
    completeSetup,
  setSetupError,
  loadSetupState
  } = useGameStore();

  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  // Validation is automatic and stored in setupState.validation
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  // Redirect if not storyteller (derive from currentGame on refresh)
  useEffect(() => {
    const amStoryteller = isStoryteller || (currentGame && (currentGame as any).storytellerSeatId === useGameStore.getState().seatId);
    if (!amStoryteller) {
      if (gameId) navigate(`/lobby/${gameId}`);
    }
  }, [isStoryteller, currentGame, navigate, gameId]);

  // Load/setup on mount: if already in SETUP, just load state; otherwise try to enter setup from lobby
  useEffect(() => {
    const init = async () => {
      if (currentGame?.phase === GamePhase.SETUP) {
        await loadSetupState();
      } else if (currentGame?.phase === GamePhase.LOBBY) {
        await handleEnterSetup();
      } else {
        // Unknown or stale; try loading state to refresh phase from server
        await loadSetupState();
      }
    };
    init();
  }, [currentGame?.phase]);

  // Update selected characters when setup state changes
  useEffect(() => {
    if (setupState?.selectedCharacters) {
      setSelectedCharacters(setupState.selectedCharacters);
    }
  }, [setupState]);

  const handleEnterSetup = async () => {
  await enterSetup();
  };

  const handleCharacterToggle = (characterId: string) => {
    setSelectedCharacters(prev => {
      const newSelection = prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : (() => {
            // Gating: prevent selecting beyond required team count
            const character = availableCharacters.find(c => c.id === characterId);
            if (!character) return prev;
            const t = character.team;
            const teamKey = t === 'townsfolk' ? 'townsfolk' : t === 'outsider' ? 'outsiders' : t === 'minion' ? 'minions' : t === 'demon' ? 'demons' : t;
            const currentTeamCount = (currentDistribution as any)[teamKey] || 0;
            const expectedTeamCount = (expectedDistribution as any)[teamKey] || 0;
            if (currentTeamCount >= expectedTeamCount) {
              showToast(`No more ${teamKey.slice(0, -1)} slots available`);
              return prev;
            }
            return [...prev, characterId];
          })();
      
      // Auto-save selection
      selectCharacters(newSelection);
      return newSelection;
    });
  };

  // kick off background validation once state is present
  useEffect(() => {
    if (setupState && !(setupState as any).validation) {
      autoValidate();
    }
  }, [setupState, autoValidate]);

  const handleComplete = async () => {
    const success = await completeSetup();
    if (success) {
  if (gameId) navigate(`/game/${gameId}`);
    }
  };

  const clearError = () => setSetupError(null);

  if (!isStoryteller) {
    return null; // Will redirect
  }

  const availableCharacters: Character[] = React.useMemo(() => {
    const list: Character[] = (setupState as any)?.availableCharacters || [];
    const seen = new Set<string>();
    const dedup: Character[] = [];
    for (const c of list) {
      if (!seen.has(c.id)) { seen.add(c.id); dedup.push(c); }
    }
    return dedup;
  }, [setupState]);
  const playerCount = currentGame?.seats.filter(seat => !seat.isStoryteller).length || 0;

  // Calculate expected distribution
  const expectedDistribution = (setupState as any)?.expectedDistribution || {
    townsfolk: 0,
    outsiders: 0,
    minions: 0,
    demons: 0
  };

  // Calculate current distribution
  const currentDistribution = selectedCharacters.reduce((acc, charId) => {
    const character = availableCharacters.find((c: Character) => c.id === charId);
    if (character) {
      // Normalize team keys to match expectedDistribution
      const t = character.team;
      const key = t === 'townsfolk' ? 'townsfolk' : t === 'outsider' ? 'outsiders' : t === 'minion' ? 'minions' : t === 'demon' ? 'demons' : t;
      (acc as any)[key] = ((acc as any)[key] || 0) + 1;
    }
    return acc;
  }, { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 } as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Game Setup</h1>
            <button
              onClick={() => gameId && navigate(`/lobby/${gameId}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Lobby
            </button>
          </div>
          
          {/* Setup Progress */}
      <div className="flex items-center space-x-4 mb-4">
            <div className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${currentSetupStep === 'characters' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
            `}>
              1. Select Characters
            </div>
            <div className={`
              px-3 py-1 rounded-full text-sm font-medium
        ${currentSetupStep === 'complete' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
            `}>
        2. Complete
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-800">Players:</span>
                <span className="ml-2 font-semibold">{playerCount}</span>
              </div>
              <div>
                <span className="text-gray-800">Script:</span>
                <span className="ml-2 font-semibold">{(setupState as any)?.scriptName || 'Loading...'}</span>
              </div>
              <div>
                <span className="text-gray-800">Selected:</span>
                <span className="ml-2 font-semibold">{selectedCharacters.length}</span>
              </div>
              <div>
                <span className="text-gray-800">Required:</span>
                <span className="ml-2 font-semibold">{playerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {setupError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{setupError}</span>
            <button
              onClick={clearError}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              ×
            </button>
          </div>
        )}

        {/* Distribution Overview */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Role Distribution</h3>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(expectedDistribution).map(([team, expected]) => {
              const current = currentDistribution[team as keyof typeof currentDistribution];
              const expectedNum = typeof expected === 'number' ? expected : 0;
              const isCorrect = current === expectedNum;
              
              return (
                <div key={team} className="text-center">
                  <div className="capitalize text-sm text-gray-800 mb-1">{team}</div>
                  <div className={`
                    text-2xl font-bold
                    ${isCorrect ? 'text-green-600' : current > expectedNum ? 'text-red-600' : 'text-orange-600'}
                  `}>
                    {current} / {expectedNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

  {/* Validation results removed from UI (now automatic and hidden) */}

        {/* Character Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Characters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCharacters.map((character: Character) => {
              const t = character.team;
              const teamKey = t === 'townsfolk' ? 'townsfolk' : t === 'outsider' ? 'outsiders' : t === 'minion' ? 'minions' : t === 'demon' ? 'demons' : t;
              const isSelected = selectedCharacters.includes(character.id);
              const expectedForTeam = (expectedDistribution as any)[teamKey] || 0;
              const currentForTeam = (currentDistribution as any)[teamKey] || 0;
              const remaining = Math.max(0, expectedForTeam - currentForTeam);
              const disabled = !isSelected && remaining === 0;
              return (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isSelected={isSelected}
                  remaining={remaining}
                  disabled={disabled}
                  onToggle={handleCharacterToggle}
                />
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          {(() => {
            const validation = (setupState as any)?.validation as { isValid?: boolean; issues?: string[] } | undefined;
            const countsMatch = Object.entries(expectedDistribution).every(([k, v]) => (currentDistribution as any)[k] === v);
            const readyByCount = selectedCharacters.length === playerCount && countsMatch;
            const isValid = validation?.isValid === true;
            const disabled = setupLoading || !readyByCount || !isValid;
            const issues: string[] = [];
            if (selectedCharacters.length !== playerCount) issues.push(`Select ${playerCount - selectedCharacters.length} more characters`);
            Object.entries(expectedDistribution).forEach(([k, v]) => {
              const cur = (currentDistribution as any)[k] || 0;
              if (cur !== v) issues.push(`${k}: ${cur}/${v}`);
            });
            if (validation && validation.issues && validation.issues.length) {
              issues.push(...validation.issues);
            } else if (!isValid) {
              // Fallback message while background validation catches up
              issues.push('Validating configuration…');
            }
            const title = disabled && issues.length ? issues.join('\n') : undefined;
            return (
              <button
                onClick={handleComplete}
                disabled={disabled}
                title={title}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {setupLoading ? 'Completing…' : 'Complete Setup & Start Game'}
              </button>
            );
          })()}
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
};

export default SetupPage;
