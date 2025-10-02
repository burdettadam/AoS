import * as Enums from "@botc/shared";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PTTButton } from "../components/PTTButton";
import { useGameStore } from "../store/gameStore";
import { usePTT } from "../utils/usePTT";

import { BottomBar } from "../components/lobby/BottomBar";
import CharacterGrid from "../components/lobby/CharacterGrid";
import { ModifiersPanel } from "../components/lobby/ModifiersPanel";
import { NightOrderPanel } from "../components/lobby/NightOrderPanel";
import { NPCProfileSelectModal } from "../components/lobby/NPCProfileSelectModal";
import { PlayerControls } from "../components/lobby/PlayerControls";
import { PlayersList } from "../components/lobby/PlayersList";
import { PreviewPanel } from "../components/lobby/PreviewPanel";
import ScriptCarousel from "../components/lobby/ScriptCarousel";
import ScriptVotingPanel from "../components/lobby/ScriptVotingPanel";
import {
  MODIFIER_RING_DECORATION,
  TEAM_RING_CLASSES,
} from "../constants/visual";
import { useGameConnection, useScriptSelection } from "../hooks/useGameState";
import { useScriptProposals } from "../hooks/useScriptProposals";

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { connected, currentGame, leaveGame } = useGameStore();
  const { gameId, loading, error, seatId, isStoryteller } = useGameConnection();
  const {
    selectedScriptId,
    setSelectedScriptId,
    selectedScript,
    availableScripts,
    storytellerSelectedScripts,
    storytellerScriptObjects,
    scriptUsedName,
    toggleStorytellerScript,
  } = useScriptSelection();
  const {
    scriptProposalsData,
    proposalByScriptId,
    togglePlayerProposal,
    submitProposalVote,
  } = useScriptProposals();
  const playerCount = useMemo(() => {
    if (!currentGame?.seats) return 0;
    return currentGame.seats.filter(
      (seat: any) => seat.id !== currentGame.storytellerSeatId,
    ).length;
  }, [currentGame?.seats, currentGame?.storytellerSeatId]);

  const [hoverCharacter, setHoverCharacter] = useState<any | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
  const [showNPCProfileModal, setShowNPCProfileModal] = useState(false);
  const topScriptButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );

  // PTT functionality
  const { pttState, startPTT, endPTT, setMode } = usePTT();

  // Team ring colors for character icons (centralized)
  const teamRing = TEAM_RING_CLASSES;

  // Build mapping of modifier types affecting characters for ring overlays
  const modifierTypesByCharacterId = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    (selectedScript?.modifiers || []).forEach((m: any) => {
      switch (m.type) {
        case "requires":
          if (m.whenCharacter) {
            (mapping[m.whenCharacter] ||= []).push("requires");
          }
          (m.requireCharacters || []).forEach((cid: string) => {
            (mapping[cid] ||= []).push("requires");
          });
          break;
        case "adjustCounts":
          if (m.whenCharacter) {
            (mapping[m.whenCharacter] ||= []).push("adjustCounts");
          }
          break;
        case "mutuallyExclusive":
          (m.characters || []).forEach((cid: string) => {
            (mapping[cid] ||= []).push("mutuallyExclusive");
          });
          break;
        case "atLeastOneOf":
          (m.characters || []).forEach((cid: string) => {
            (mapping[cid] ||= []).push("atLeastOneOf");
          });
          break;
        case "specialRule":
          if (m.fabled) {
            (mapping[m.fabled] ||= []).push("specialRule");
          }
          break;
        default:
          break;
      }
    });
    return mapping;
  }, [selectedScript?.modifiers]);

  // Resolve a local artwork path; fall back to placeholder if missing
  const artworkSrc = useMemo(() => {
    const id = selectedScript?.id;
    if (!id) return "/script-art/placeholder.svg";
    // Prefer .png or .jpg. We don't check existence here; the img onError will swap to placeholder.
    return `/script-art/${id}.png`;
  }, [selectedScript?.id]);

  const centerScriptButton = (scriptId: string) => {
    const btn = topScriptButtonRefs.current[scriptId];
    btn?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const handleTopScriptsKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (!availableScripts.length) return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const currentIndex = (() => {
      if (selectedScriptId) {
        const idx = availableScripts.findIndex(
          (s: any) => s.id === selectedScriptId,
        );
        if (idx >= 0) return idx;
      }
      if (currentGame?.scriptId) {
        const idx = availableScripts.findIndex(
          (s: any) => s.id === currentGame.scriptId,
        );
        if (idx >= 0) return idx;
      }
      return 0;
    })();
    const nextIndex =
      (currentIndex + direction + availableScripts.length) %
      availableScripts.length;
    const nextScript = availableScripts[nextIndex];
    setSelectedScriptId(nextScript.id);
    centerScriptButton(nextScript.id);
  };

  useEffect(() => {
    if (selectedScript?.id) {
      centerScriptButton(selectedScript.id);
    }
  }, [selectedScript?.id]);

  const minPlayersRequired = useMemo(
    () => selectedScript?.meta?.playerCount?.min ?? 5,
    [selectedScript],
  );
  const hasEnoughPlayers = playerCount >= minPlayersRequired;

  // Redirect to setup page if game is in setup phase and user is storyteller
  useEffect(() => {
    if (currentGame?.phase === Enums.GamePhase.SETUP && isStoryteller) {
      navigate(`/setup/${gameId}`);
    }
  }, [currentGame?.phase, isStoryteller, gameId, navigate]);

  const handleSetup = () => {
    if (gameId) {
      navigate(`/setup/${gameId}`);
    }
  };

  const handleStart = async () => {
    if (!gameId) return;
    const res = await fetch(`/api/games/${gameId}/start`, { method: "POST" });
    if (!res.ok) {
      console.error("Failed to start game");
      return;
    }
    // Show personal role reveal screen first
    navigate(`/reveal/${gameId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medieval font-bold text-center mb-8">
          Game Lobby
        </h1>
        <div className="card p-8 text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medieval font-bold text-center mb-8">
          Game Lobby
        </h1>
        <div className="card p-8 text-center text-red-400">{error}</div>
      </div>
    );
  }

  // Wireframe-inspired layout updated to match design
  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-medieval font-bold text-center mb-2">
        Game Lobby
        {(currentGame as any)?.gameName
          ? `: ${(currentGame as any).gameName}`
          : ""}
      </h1>

      {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <input
            defaultValue={(currentGame as any)?.gameName || ""}
            placeholder="Set game name (visible to all)"
            onBlur={async (e) => {
              const name = e.currentTarget.value.trim();
              if (!gameId || !seatId || !name) return;
              await fetch(`/api/games/${gameId}/name`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storytellerSeatId: seatId, name }),
              });
            }}
            className="px-3 py-1 bg-clocktower-dark border border-gray-600 rounded focus:outline-none focus:border-clocktower-accent w-[360px]"
          />
          <span className="text-xs text-gray-500">
            Press Tab/Click away to save
          </span>
        </div>
      )}

      {/* Storyteller-only: All scripts selector - with keyboard navigation */}
      {isStoryteller && (
        <div className="pt-6 pb-2">
          <ScriptCarousel
            scripts={availableScripts}
            selectedScriptId={selectedScript?.id}
            title="All Scripts (Storyteller Only)"
            subtitle="Use ← → to navigate"
            keyboardNavigation={true}
            onScriptSelect={setSelectedScriptId}
            onScriptAction={toggleStorytellerScript}
            getActionProps={(script) => ({
              label: storytellerSelectedScripts.includes(script.id)
                ? "Remove script from storyteller proposals"
                : "Add script for players",
              isActive: storytellerSelectedScripts.includes(script.id),
              "data-testid": `master-toggle-${script.id}`,
            })}
            testId="all-scripts-carousel"
            onKeyDown={handleTopScriptsKeyDown}
          />
        </div>
      )}

      {/* Player-only: Game selector spanning full width */}
      {!isStoryteller && (
        <div className="pt-6 pb-2">
          <ScriptCarousel
            scripts={storytellerScriptObjects}
            selectedScriptId={selectedScript?.id}
            title="Available Games"
            subtitle="Use ← → to navigate"
            onScriptSelect={setSelectedScriptId}
            onScriptAction={togglePlayerProposal}
            getActionProps={(script) => {
              const proposalEntry = proposalByScriptId.get(script.id);
              const iPropose = proposalEntry ? proposalEntry.isProposer : false;
              return {
                label: iPropose
                  ? "Withdraw script proposal"
                  : "Propose this script",
                isActive: iPropose,
                "data-testid": `player-proposal-toggle-${script.id}`,
              };
            }}
            testId="player-games-carousel"
          />
        </div>
      )}

      {/* Storyteller Shared Scripts - full width */}
      {storytellerScriptObjects.length > 0 && (
        <div className="pt-6 pb-2">
          <ScriptCarousel
            scripts={storytellerScriptObjects}
            selectedScriptId={selectedScript?.id}
            title="Storyteller Shared Scripts"
            subtitle="Press + to propose this script to the group."
            onScriptSelect={setSelectedScriptId}
            onScriptAction={togglePlayerProposal}
            getActionProps={(script) => {
              const proposalEntry = proposalByScriptId.get(script.id);
              const iPropose = proposalEntry ? proposalEntry.isProposer : false;
              return {
                label: iPropose
                  ? "Withdraw script proposal"
                  : "Propose this script",
                isActive: iPropose,
                "data-testid": `player-proposal-toggle-${script.id}`,
              };
            }}
            testId="shared-scripts-carousel"
          />
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Players and Management */}
        <div className="col-span-2 flex flex-col min-h-[500px]">
          {/* Storyteller section */}
          {currentGame?.storytellerSeatId ? (
            <div className="card p-3 mb-3 border-yellow-600/50">
              <div className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
                <span>👑</span>
                <span>Storyteller</span>
              </div>
              {(() => {
                const storytellerSeat = currentGame.seats.find(
                  (s: any) => s.id === currentGame.storytellerSeatId,
                );
                return (
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm truncate text-yellow-100">
                      {storytellerSeat?.playerId || "Unknown"}
                    </div>
                    <span className="text-lg">👑</span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="card p-3 mb-3 border-gray-600/50">
              <div className="text-xs text-gray-400 mb-2">Storyteller</div>
              <div className="text-sm text-gray-500 italic">
                No storyteller assigned yet
              </div>
            </div>
          )}

          {/* Players list - simple scrollable list */}
          <PlayersList
            players={
              currentGame?.seats?.filter(
                (s: any) => s.id !== currentGame.storytellerSeatId,
              ) || []
            }
            isStoryteller={isStoryteller}
            storytellerSeatId={currentGame?.storytellerSeatId}
            seatId={seatId ?? undefined}
            onMakeStoryteller={async (targetSeatId: string) => {
              await fetch(`/api/games/${gameId}/storyteller`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  setterSeatId: seatId ?? "",
                  targetSeatId,
                }),
              });
            }}
          />

          {/* Player Management Buttons */}
          <PlayerControls
            onAddNPC={() => {
              if (gameId) setShowNPCProfileModal(true);
            }}
            onCopyLink={() => {
              if (!gameId) return;
              const origin = window.location.origin;
              const joinUrl = `${origin}/join/${gameId}`;
              navigator.clipboard.writeText(joinUrl);
            }}
            onLeaveGame={async () => {
              const ok = await leaveGame();
              if (ok) navigate("/");
            }}
            canLeave={currentGame?.phase === Enums.GamePhase.LOBBY}
          />

          {/* Push to Talk */}
          <div className="mt-3 p-3 card">
            <div className="text-xs text-gray-400 mb-2">Voice Chat</div>
            <div className="flex items-center justify-center">
              <PTTButton
                pttState={pttState}
                onToggleMode={(mode) => setMode(mode)}
                onStart={startPTT}
                onEnd={endPTT}
                className="w-full"
              />
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              {pttState.mode === "hold" ? "Hold to talk" : "Click to toggle"}
            </div>
          </div>
        </div>

        {/* Center Column: Scripts (narrower to give more space to preview) */}
        <div
          className={`${isStoryteller ? "col-span-5" : "col-span-5"} flex flex-col min-h-[500px]`}
        >
          {/* Characters grid for selected script */}
          <CharacterGrid
            characters={selectedScript?.characters}
            onCharacterHover={setHoverCharacter}
            onCharacterSelect={(c) => setSelectedCharacter(c)}
            selectedCharacterId={selectedCharacter?.id}
            teamRing={teamRing}
            modifierTypesByCharacterId={modifierTypesByCharacterId}
          />
          {/* Player Voting now sits below the characters */}
          <div className="mt-4 flex-1">
            <ScriptVotingPanel
              scriptProposalsData={scriptProposalsData}
              onScriptSelect={setSelectedScriptId}
              onVote={submitProposalVote}
            />
          </div>
        </div>

        {/* Right Column: Preview */}
        <div
          className={`${isStoryteller ? "col-span-5" : "col-span-5"} flex flex-col min-h-[500px]`}
        >
          <PreviewPanel
            hoverCharacter={hoverCharacter}
            selectedCharacter={selectedCharacter}
            artworkSrc={artworkSrc}
            selectedScript={selectedScript}
          />
          {/* Stacked modifiers then generic night order full width */}
          <div className="mt-3">
            <ModifiersPanel modifiers={selectedScript?.modifiers || []} />
            <NightOrderPanel />
          </div>
        </div>
      </div>

      {/* NPC Profile Selection Modal */}
      <NPCProfileSelectModal
        open={showNPCProfileModal}
        onClose={() => setShowNPCProfileModal(false)}
        onConfirm={async (profileId: string) => {
          if (!gameId) return;
          await fetch(`/api/games/${gameId}/npc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId }),
          });
        }}
      />

      {/* Phase Information */}
      {currentGame?.phase === Enums.GamePhase.SETUP && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">
            Setup in Progress
          </h3>
          <p className="text-gray-300 text-sm">
            {isStoryteller
              ? "You are configuring the game setup. Click 'Continue Setup' to manage character selection."
              : "The Storyteller is setting up the game. Please wait..."}
          </p>
        </div>
      )}

      {/* Bottom Component: Game Controls and Character Count */}
      <BottomBar>
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-300">
            <span className="font-semibold">Players:</span> {playerCount}
            {selectedScript?.meta?.playerCount && (
              <span className="text-gray-400 ml-1">
                (min {minPlayersRequired})
              </span>
            )}
          </div>
          <div className="text-sm text-gray-300">
            <span className="font-semibold">Storyteller:</span> 1
          </div>
          <div
            className="text-sm text-gray-300"
            data-testid="bottom-bar-script"
          >
            <span className="font-semibold">Script:</span>{" "}
            {scriptUsedName ?? "Not selected"}
          </div>
        </div>

        <div className="flex gap-3">
          {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
            <button
              className="btn-primary px-8 py-3 text-lg font-semibold"
              onClick={handleSetup}
              disabled={!connected || !hasEnoughPlayers}
            >
              Begin Game Setup{scriptUsedName ? ` • ${scriptUsedName}` : ""}
            </button>
          )}
          {isStoryteller && currentGame?.phase === Enums.GamePhase.SETUP && (
            <button
              className="btn-primary px-8 py-3 text-lg font-semibold"
              onClick={handleSetup}
            >
              Continue Setup
            </button>
          )}
          {currentGame?.phase === Enums.GamePhase.NIGHT && (
            <button
              className="btn-primary px-8 py-3 text-lg font-semibold"
              onClick={handleStart}
            >
              View Game
            </button>
          )}
        </div>
      </BottomBar>

      {/* Storyteller readiness hint */}
      {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
        <div className="text-sm text-gray-300 mt-2 text-center">
          {connected ? (
            hasEnoughPlayers ? (
              <span>
                Ready to begin{scriptUsedName ? ` with ${scriptUsedName}` : ""}.
                Players: {playerCount}
                {selectedScript?.meta?.playerCount
                  ? ` (min ${minPlayersRequired})`
                  : ""}
                . Storyteller: 1.
              </span>
            ) : (
              <span>
                Need {minPlayersRequired - playerCount} more player
                {minPlayersRequired - playerCount === 1 ? "" : "s"} to begin
                setup
                {selectedScript?.meta?.playerCount
                  ? ` for ${selectedScript?.name}`
                  : ""}
                . Current: {playerCount} players, 1 storyteller.
              </span>
            )
          ) : (
            <span>Connecting…</span>
          )}
        </div>
      )}

      {/* Visual Legend */}
      <div className="mt-6 card p-4">
        <div className="text-sm font-semibold text-gray-200 mb-3 text-center">
          Visual Guide
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Character Team Colors (loop over constants) */}
          <div>
            <div className="text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              Character Teams
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(teamRing).map(([team, ringClass]) => (
                <div key={team} className="flex items-center gap-2 capitalize">
                  <div
                    className={`w-5 h-5 rounded-full bg-black/40 border border-gray-700 ring-2 ${ringClass}`}
                  ></div>
                  <span className="text-gray-200">{team}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Script Modifier Rings */}
          <div>
            <div className="text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              Script Modifier Rings
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(MODIFIER_RING_DECORATION).map(([type, cls]) => {
                const description: Record<string, string> = {
                  requires: "Requires - needs another character",
                  adjustCounts: "Adjust Counts - changes team numbers",
                  mutuallyExclusive: "Exclusive - can't appear together",
                  atLeastOneOf: "Min One - at least one required",
                  specialRule: "Fabled / Special storyteller rule",
                };
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className="relative w-5 h-5">
                      <div
                        className={`w-5 h-5 rounded-full bg-black/40 border border-gray-700 ring-1 ring-gray-600 ${cls}`}
                      ></div>
                    </div>
                    <span className="text-gray-200 capitalize">
                      {description[type] || type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
