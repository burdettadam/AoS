// New Setup Page (GameSetupPage) reusing Lobby components & new panels
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import * as Enums from '@botc/shared';
import CharacterGrid from '../components/lobby/CharacterGrid';
import { PreviewPanel } from '../components/lobby/PreviewPanel';
import { ModifiersPanel } from '../components/lobby/ModifiersPanel';
import { GameSetupInfoPanel } from '../components/setup/GameSetupInfoPanel';
import { DetailedNightOrderPanel } from '../components/setup/DetailedNightOrderPanel';
import { GameStatisticsPanel } from '../components/setup/GameStatisticsPanel';
import { TEAM_RING_CLASSES, MODIFIER_RING_DECORATION } from '../constants/visual';
import ScriptCarousel from '../components/lobby/ScriptCarousel';

const SetupPage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentGame, isStoryteller, enterSetup, availableScripts, loadScripts, setCurrentScript, currentScript } = useGameStore();
  const [selectedScript, setSelectedScript] = useState<any | null>(null);
  const [hoverCharacter, setHoverCharacter] = useState<any | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]); // storyteller selection

  // TEMP: derive script from currentGame if already loaded (future hook reuse could replace this)
  useEffect(() => {
    // Ensure scripts loaded for selection if storyteller
    if (isStoryteller && (!availableScripts || availableScripts.length === 0)) {
      loadScripts();
    }
  }, [isStoryteller, availableScripts, loadScripts]);

  useEffect(() => {
    // Derive current script if already chosen earlier
    const scriptObj = currentScript || (currentGame as any)?.scriptObject || (currentGame as any)?.script;
    if (scriptObj) setSelectedScript(scriptObj);
  }, [currentGame, currentScript]);

  // Redirect logic & automatic entry into setup
  const isPlayer = !isStoryteller;
  const hasEnteredRef = React.useRef(false);
  useEffect(() => {
    if (!gameId || !currentGame) return;
    if (isStoryteller) {
      if (currentGame.phase === Enums.GamePhase.LOBBY && !hasEnteredRef.current) {
        // Attempt to enter setup; phase will change async
        hasEnteredRef.current = true;
        enterSetup();
      } else if (currentGame.phase === Enums.GamePhase.SETUP) {
        // Stay on page
      } else if (hasEnteredRef.current) {
        // After attempting entry: handle transitions away from SETUP
        if (currentGame.phase === Enums.GamePhase.LOBBY) {
          navigate(`/lobby/${gameId}`);
        } else if (currentGame.phase === Enums.GamePhase.NIGHT || currentGame.phase === Enums.GamePhase.DAY) {
          navigate(`/game/${gameId}`);
        }
      }
    }
  }, [currentGame?.phase, isStoryteller, gameId, enterSetup, navigate, currentGame]);

  const playerCount = useMemo(() => {
    return currentGame?.seats?.filter((s: any) => s.id !== (currentGame as any).storytellerSeatId).length || 0;
  }, [currentGame]);

  const rosterCharacters = useMemo(() => selectedScript?.characters || [], [selectedScript]);

  const teamRing = TEAM_RING_CLASSES;
  const modifierTypesByCharacterId = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    (selectedScript?.modifiers || []).forEach((m: any) => {
      switch (m.type) {
        case 'requires':
          if (m.whenCharacter) (mapping[m.whenCharacter] ||= []).push('requires');
          (m.requireCharacters || []).forEach((cid: string) => (mapping[cid] ||= []).push('requires'));
          break;
        case 'adjustCounts':
          if (m.whenCharacter) (mapping[m.whenCharacter] ||= []).push('adjustCounts');
          break;
        case 'mutuallyExclusive':
          (m.characters || []).forEach((cid: string) => (mapping[cid] ||= []).push('mutuallyExclusive'));
          break;
        case 'atLeastOneOf':
          (m.characters || []).forEach((cid: string) => (mapping[cid] ||= []).push('atLeastOneOf'));
          break;
        case 'specialRule':
          if (m.fabled) (mapping[m.fabled] ||= []).push('specialRule');
          break;
      }
    });
    return mapping;
  }, [selectedScript?.modifiers]);

  const artworkSrc = useMemo(() => {
    const id = selectedScript?.id;
    if (!id) return '/script-art/placeholder.svg';
    return `/script-art/${id}.png`;
  }, [selectedScript?.id]);

  const toggleCharacter = (c: any) => {
    if (!isStoryteller) return;
    setSelectedCharacterIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
  };

  const handleSelectScript = (scriptId: string) => {
    const script = availableScripts.find((s: any) => s.id === scriptId);
    if (script) {
      setSelectedScript(script);
      setCurrentScript(script);
      // reset selections when changing scripts
      setSelectedCharacterIds([]);
    }
  };

  // Player waiting view
  if (isPlayer) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-medieval font-bold text-center my-6">Game Setup In Progress</h1>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <PreviewPanel artworkSrc={artworkSrc} selectedScript={selectedScript} />
            <DetailedNightOrderPanel selectedScript={selectedScript} />
          </div>
          <div className="col-span-6 flex flex-col">
            <GameSetupInfoPanel playerCount={playerCount} selectedScript={selectedScript} selectedCharacterIds={selectedCharacterIds} />
            <ModifiersPanel modifiers={selectedScript?.modifiers || []} />
            <GameStatisticsPanel selectedScript={selectedScript} playerCount={playerCount} selectedCharacterIds={selectedCharacterIds} />
          </div>
        </div>
        <div className="mt-6 card p-4 text-center text-sm text-gray-300">
          Waiting for the storyteller to complete setup. You will see your role soon.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto">
      <h1 className="text-4xl font-medieval font-bold text-center mb-4">Game Setup</h1>

      {/* Script selection (Storyteller only) */}
      {isStoryteller && (
        <div className="mb-4">
          <ScriptCarousel
            scripts={availableScripts || []}
            selectedScriptId={selectedScript?.id}
            title="Select Script"
            subtitle={availableScripts?.length ? 'Choose a script to begin selecting characters' : 'Loading scripts...'}
            onScriptSelect={handleSelectScript}
            keyboardNavigation
            testId="setup-scripts-carousel"
          />
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Characters */}
        <div className="col-span-5 flex flex-col min-h-[600px]">
          <CharacterGrid
            characters={rosterCharacters}
            onCharacterHover={setHoverCharacter}
            onCharacterSelect={toggleCharacter}
            selectedCharacterId={hoverCharacter?.id}
            teamRing={teamRing}
            modifierTypesByCharacterId={modifierTypesByCharacterId}
          />
          <div className="text-xs text-gray-400 mt-2">
            {selectedScript ? 'Click characters to include them. Distribution auto-updates above.' : 'Select a script first to load characters.'}
          </div>
        </div>
        {/* Center: Preview & Setup Info stacked */}
        <div className="col-span-4 flex flex-col">
          <GameSetupInfoPanel playerCount={playerCount} selectedScript={selectedScript} selectedCharacterIds={selectedCharacterIds} />
          <PreviewPanel
            artworkSrc={artworkSrc}
            hoverCharacter={hoverCharacter}
            selectedCharacter={rosterCharacters.find((c: any) => c.id === selectedCharacterIds[selectedCharacterIds.length-1])}
            selectedScript={selectedScript}
          />
          <ModifiersPanel modifiers={selectedScript?.modifiers || []} />
        </div>
        {/* Right: Detailed Info */}
        <div className="col-span-3 flex flex-col">
          <GameStatisticsPanel selectedScript={selectedScript} playerCount={playerCount} selectedCharacterIds={selectedCharacterIds} />
          <DetailedNightOrderPanel selectedScript={selectedScript} />
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => gameId && navigate(`/lobby/${gameId}`)}
          className="btn-secondary px-6 py-3 mr-4"
        >Return to Lobby</button>
        <button
          onClick={() => gameId && navigate(`/game/${gameId}`)}
          className="btn-primary px-8 py-3 text-lg font-semibold"
          disabled={selectedCharacterIds.length !== playerCount}
          title={selectedCharacterIds.length !== playerCount ? `Need ${playerCount - selectedCharacterIds.length} more` : undefined}
        >Complete Setup</button>
      </div>
      <div className="mt-8 card p-4">
        <div className="text-sm font-semibold text-gray-200 mb-2">Legend</div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="uppercase tracking-wide text-[10px] text-gray-400 mb-1">Teams</div>
            {Object.entries(teamRing).map(([team, cls]) => (
              <div key={team} className="flex items-center gap-2 mb-1">
                <div className={`w-4 h-4 rounded-full ring-2 ${cls} bg-black/40 border border-gray-700`}></div>
                <span className="text-gray-300 capitalize">{team}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="uppercase tracking-wide text-[10px] text-gray-400 mb-1">Modifiers</div>
            {Object.entries(MODIFIER_RING_DECORATION).map(([type, cls]) => (
              <div key={type} className="flex items-center gap-2 mb-1">
                <div className={`w-4 h-4 rounded-full ring-2 ${cls} bg-black/40 border border-gray-700`}></div>
                <span className="text-gray-300 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
