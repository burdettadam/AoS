import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import type { GameState, LoadedScript } from '@botc/shared';
import * as Enums from '@botc/shared';
import { PTTButton } from '../components/PTTButton';
import { usePTT } from '../utils/usePTT';

import { PlayersList } from '../components/lobby/PlayersList';
import { PlayerControls } from '../components/lobby/PlayerControls';
import { PreviewPanel } from '../components/lobby/PreviewPanel';
import { ModifiersPanel } from '../components/lobby/ModifiersPanel';
import { NightOrderPanel } from '../components/lobby/NightOrderPanel';
import { BottomBar } from '../components/lobby/BottomBar';

const LobbyPage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const {
    connect,
    connected,
    currentGame,
    setSeat,
    seatId,
    isStoryteller,
    availableScripts,
  // scriptsLoading,
    loadScripts,
  leaveGame,
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId] = useState(() => {
    const nameKey = 'botc-player-name';
    const name = (localStorage.getItem(nameKey) || '').trim();
    return name;
  });
  const playerCount = useMemo(() => {
    if (!currentGame?.seats) return 0;
    return currentGame.seats.filter((seat: any) => seat.id !== currentGame.storytellerSeatId).length;
  }, [currentGame?.seats, currentGame?.storytellerSeatId]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [hoverCharacter, setHoverCharacter] = useState<any | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const topScriptsContainerRef = useRef<HTMLDivElement | null>(null);
  const topScriptButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const storytellerScriptsRef = useRef<HTMLDivElement | null>(null);
  const characterScrollerRef = useRef<HTMLDivElement | null>(null);
  const proposalsScrollerRef = useRef<HTMLDivElement | null>(null);
  // Removed: charactersScrollRef (unused)
  
  // PTT functionality
  const { 
    pttState, 
    startPTT, 
    endPTT, 
    setMode
  } = usePTT();
  
  // Team ring colors for character icons
  const teamRing: Record<string, string> = {
    townsfolk: 'ring-green-500/60',
    outsider: 'ring-blue-400/60',
    minion: 'ring-purple-500/60',
    demon: 'ring-red-500/70',
    traveller: 'ring-amber-400/60',
    fabled: 'ring-sky-400/60',
  };

  // Removed: scrollCharacters (no longer used)
  
  // Get available scripts from game state, fallback to empty array
  const storytellerSelectedScripts = currentGame?.availableScriptIds || [];
  
  // Helper function to update available scripts on server
  const updateAvailableScripts = async (scriptIds: string[]) => {
    if (!gameId || !seatId) return;
    try {
      await fetch(`/api/games/${gameId}/scripts/available`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storytellerSeatId: seatId, scriptIds })
      });
    } catch (error) {
      console.error('Failed to update available scripts:', error);
    }
  };

  
  // For storytellers: all scripts available for selection
  // For players: only scripts the storyteller has approved
  const visibleScripts = useMemo(() => {
    if (isStoryteller) {
      return availableScripts;
    }
    return availableScripts.filter(script => storytellerSelectedScripts.includes(script.id));
  }, [availableScripts, isStoryteller, storytellerSelectedScripts]);

  const selectedScript = useMemo(() => {
    // Prefer manual selection; otherwise fall back to the game's current script
    const manual = visibleScripts.find((s: LoadedScript) => s.id === selectedScriptId);
    if (manual) return manual;
    if (currentGame?.scriptId) {
      return visibleScripts.find((s: LoadedScript) => s.id === currentGame.scriptId);
    }
  return undefined;
  }, [visibleScripts, selectedScriptId, currentGame?.scriptId]);

  // Resolve a local artwork path; fall back to placeholder if missing
  const artworkSrc = useMemo(() => {
    const id = selectedScript?.id;
    if (!id) return '/script-art/placeholder.svg';
    // Prefer .png or .jpg. We don't check existence here; the img onError will swap to placeholder.
    return `/script-art/${id}.png`;
  }, [selectedScript?.id]);

  const scriptLookup = useMemo(() => {
    const byId: Record<string, LoadedScript> = {};
    for (const script of availableScripts) {
      byId[script.id] = script;
    }
    return byId;
  }, [availableScripts]);

  const storytellerScriptObjects = useMemo(() => {
    return storytellerSelectedScripts
      .map((id) => scriptLookup[id])
      .filter(Boolean) as LoadedScript[];
  }, [storytellerSelectedScripts, scriptLookup]);

  const scriptProposalsData = useMemo(() => {
    const raw = currentGame?.scriptProposals || [];
    return raw.map((proposal: any) => {
      const script = scriptLookup[proposal.scriptId] || availableScripts.find((s) => s.id === proposal.scriptId);
      const votes = proposal.votes || {};
      const entries = Object.entries(votes) as Array<[string, boolean]>;
      const upVotes = entries.filter(([, vote]) => vote === true).length;
      const downVotes = entries.filter(([, vote]) => vote === false).length;
      const myVote = seatId ? votes[seatId] : undefined;
      const proposers: string[] = Array.isArray(proposal.proposers)
        ? proposal.proposers
        : proposal.proposedBy
          ? [proposal.proposedBy]
          : [];
      const isProposer = seatId ? proposers.includes(seatId) : false;
      const createdAt = proposal.createdAt ? new Date(proposal.createdAt).getTime() : 0;
      const score = upVotes - downVotes;
      return {
        proposal,
        script,
        upVotes,
        downVotes,
        myVote,
        isProposer,
        createdAt,
        score,
        proposers
      };
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.upVotes !== a.upVotes) return b.upVotes - a.upVotes;
      if (a.downVotes !== b.downVotes) return a.downVotes - b.downVotes;
      return a.createdAt - b.createdAt;
    });
  }, [currentGame?.scriptProposals, scriptLookup, availableScripts, seatId]);

  const proposalByScriptId = useMemo(() => {
    const map = new Map<string, (typeof scriptProposalsData)[number]>();
    for (const entry of scriptProposalsData) {
      map.set(entry.proposal.scriptId, entry);
    }
    return map;
  }, [scriptProposalsData]);

  const scriptUsedName = useMemo(() => {
    if (selectedScript?.name) return selectedScript.name;
    if (currentGame?.scriptId) {
      return scriptLookup[currentGame.scriptId]?.name || currentGame.scriptId;
    }
    return undefined;
  }, [selectedScript?.name, currentGame?.scriptId, scriptLookup]);

  const toggleStorytellerScript = async (scriptId: string) => {
    if (!isStoryteller || !gameId || !seatId) return;
    const nextIds = storytellerSelectedScripts.includes(scriptId)
      ? storytellerSelectedScripts.filter((id) => id !== scriptId)
      : Array.from(new Set([...storytellerSelectedScripts, scriptId]));
    await updateAvailableScripts(nextIds);
  };

  const togglePlayerProposal = async (scriptId: string) => {
    if (!gameId || !seatId) return;
    const existing = proposalByScriptId.get(scriptId);
    const alreadyProposer = existing ? existing.proposers.includes(seatId) : false;
    try {
      await fetch(`/api/games/${gameId}/scripts/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposerSeatId: seatId, scriptId, active: !alreadyProposer })
      });
    } catch (error) {
      console.error('Failed to toggle script proposal', error);
    }
  };

  const submitProposalVote = async (proposalId: string, vote: boolean | null) => {
    if (!gameId || !seatId) return;
    try {
      await fetch(`/api/games/${gameId}/scripts/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterSeatId: seatId, proposalId, vote })
      });
    } catch (error) {
      console.error('Failed to submit script vote', error);
    }
  };

  const scrollContainerBy = (ref: React.RefObject<HTMLDivElement>, delta: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const centerScriptButton = (scriptId: string) => {
    const btn = topScriptButtonRefs.current[scriptId];
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const handleTopScriptsKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (!availableScripts.length) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    const currentIndex = (() => {
      if (selectedScriptId) {
        const idx = availableScripts.findIndex((s) => s.id === selectedScriptId);
        if (idx >= 0) return idx;
      }
      if (currentGame?.scriptId) {
        const idx = availableScripts.findIndex((s) => s.id === currentGame.scriptId);
        if (idx >= 0) return idx;
      }
      return 0;
    })();
    const nextIndex = (currentIndex + direction + availableScripts.length) % availableScripts.length;
    const nextScript = availableScripts[nextIndex];
    setSelectedScriptId(nextScript.id);
    centerScriptButton(nextScript.id);
  };

  useEffect(() => {
    if (selectedScript?.id) {
      centerScriptButton(selectedScript.id);
    }
  }, [selectedScript?.id]);

  // Removed: first night order preview not used in this layout

  const minPlayersRequired = useMemo(() => selectedScript?.meta?.playerCount?.min ?? 5, [selectedScript]);
  const hasEnoughPlayers = playerCount >= minPlayersRequired;

  // Aggressively preload scripts immediately when component mounts
  useEffect(() => {
    // Start loading scripts immediately, don't wait for any conditions
    loadScripts();
  }, []); // Empty dependency array - load immediately on mount

  // Default the dropdown to the game's current script (if any) once available
  useEffect(() => {
    if (!selectedScriptId && currentGame?.scriptId) {
      setSelectedScriptId(currentGame.scriptId);
    }
  }, [currentGame?.scriptId, selectedScriptId]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);



  useEffect(() => {
    if (!gameId) return;
    // Require player name; redirect to join page if missing and gameId known
    if (!playerId || !playerId.trim()) {
      navigate(`/join/${gameId}`);
      return;
    }
    let cancelled = false;
    async function init() {
      try {
        // Fetch initial state
        const res = await fetch(`/api/games/${gameId}`);
        if (!res.ok) throw new Error('Game not found');
        const game: GameState = await res.json();
        if (cancelled) return;

        const storedSeat = localStorage.getItem('botc-seat-id');
  if (game.phase === Enums.GamePhase.LOBBY) {
          // Try to reuse existing seat first by playerId or stored seatId
          let mySeat = game.seats.find((s: any) => (storedSeat && s.id === storedSeat) || s.playerId === playerId);
          if (!mySeat) {
            // Join the game
            const joinRes = await fetch(`/api/games/${gameId}/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId })
            });
            if (!joinRes.ok) throw new Error('Failed to join game');
            const joinData = await joinRes.json();
            setSeat(joinData.seatId, joinData.isStoryteller);
            connect(game.id, joinData.seatId);
          } else {
            setSeat(mySeat.id, mySeat.id === (game as any).storytellerSeatId);
            connect(game.id, mySeat.id);
          }
        } else {
          // Game already advanced; try to find existing seat by playerId
          const mySeat = game.seats.find((s: any) => (storedSeat && s.id === storedSeat) || s.playerId === playerId);
          if (!mySeat) {
            setError('Game already started. Ask the Storyteller to add you.');
          } else {
            setSeat(mySeat.id, mySeat.id === (game as any).storytellerSeatId);
            connect(game.id, mySeat.id);
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load lobby');
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [gameId]);

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
    const res = await fetch(`/api/games/${gameId}/start`, { method: 'POST' });
    if (!res.ok) {
      setError('Failed to start game');
      return;
    }
  // Show personal role reveal screen first
  navigate(`/reveal/${gameId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medieval font-bold text-center mb-8">Game Lobby</h1>
        <div className="card p-8 text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medieval font-bold text-center mb-8">Game Lobby</h1>
        <div className="card p-8 text-center text-red-400">{error}</div>
      </div>
    );
  }

  // Wireframe-inspired layout updated to match design
  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-medieval font-bold text-center mb-2">Game Lobby{(currentGame as any)?.gameName ? `: ${(currentGame as any).gameName}` : ''}</h1>
      
      {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <input
            defaultValue={(currentGame as any)?.gameName || ''}
            placeholder="Set game name (visible to all)"
            onBlur={async (e) => {
              const name = e.currentTarget.value.trim();
              if (!gameId || !seatId || !name) return;
              await fetch(`/api/games/${gameId}/name`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storytellerSeatId: seatId, name }) });
            }}
            className="px-3 py-1 bg-clocktower-dark border border-gray-600 rounded focus:outline-none focus:border-clocktower-accent w-[360px]"
          />
          <span className="text-xs text-gray-500">Press Tab/Click away to save</span>
        </div>
      )}

      {/* Storyteller-only: All scripts selector - with keyboard navigation */}
      {isStoryteller && (
        <div className="pt-6 pb-2">
          <div className="card w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-300">All Scripts (Storyteller Only)</div>
              {availableScripts.length > 0 && (
                <div className="text-xs text-gray-500 uppercase tracking-wide">Use ← → to navigate</div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(topScriptsContainerRef, -360)}
                aria-label="Scroll scripts left"
              >
                ←
              </button>
              <div
                ref={topScriptsContainerRef}
                data-testid="all-scripts-carousel"
                className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-12"
                tabIndex={0}
                onKeyDown={handleTopScriptsKeyDown}
              >
                {availableScripts.map((s) => {
                  const isSelected = selectedScript?.id === s.id;
                  const isShared = storytellerSelectedScripts.includes(s.id);
                  return (
                    <div key={s.id} className="relative shrink-0 w-52">
                      <button
                        ref={(el) => { topScriptButtonRefs.current[s.id] = el; }}
                        className={`w-full text-left border rounded-lg px-3 py-3 bg-clocktower-dark transition focus:outline-none focus:ring-2 focus:ring-clocktower-accent ${isSelected ? 'border-clocktower-accent shadow-[0_0_0_2px_rgba(56,189,248,0.3)]' : 'border-gray-700 hover:border-gray-500'}`}
                        onClick={() => setSelectedScriptId(s.id)}
                        data-testid={`all-script-${s.id}`}
                      >
                        <div className="text-base font-semibold text-gray-100 truncate" title={s.name}>{s.name}</div>
                        {s.meta?.complexity && (
                          <div className="text-[11px] text-gray-400 uppercase tracking-wide mt-1">{s.meta.complexity}</div>
                        )}
                        {s.meta?.playerCount && (
                          <div className="text-[11px] text-gray-500 mt-2">
                            Players {s.meta.playerCount.min ?? '?'}{s.meta.playerCount.max ? `–${s.meta.playerCount.max}` : ''}
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        className={`absolute -top-2 -right-2 w-7 h-7 rounded-full border text-sm font-bold transition ${isShared ? 'bg-emerald-400 text-black border-emerald-200' : 'bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600'}`}
                        onClick={(event) => { event.stopPropagation(); toggleStorytellerScript(s.id); }}
                        aria-pressed={isShared}
                        aria-label={isShared ? 'Remove script from storyteller proposals' : 'Add script for players'}
                        data-testid={`master-toggle-${s.id}`}
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(topScriptsContainerRef, 360)}
                aria-label="Scroll scripts right"
              >
                →
              </button>
            </div>
          </div>

          <div className="card p-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Player Voting</div>
              {scriptProposalsData.length > 0 && (
                <div className="text-xs text-gray-500">Sorted by popularity (👍 minus 👎)</div>
              )}
            </div>
            <div className="relative mt-3">
              <button
                type="button"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(proposalsScrollerRef, -320)}
                aria-label="Scroll proposed scripts left"
              >
                ←
              </button>
              <div
                ref={proposalsScrollerRef}
                data-testid="proposal-carousel"
                className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-12"
              >
                {scriptProposalsData.length > 0 ? (
                  scriptProposalsData.map((entry) => {
                    const scriptName = entry.script?.name || entry.proposal.scriptId;
                    const complexity = entry.script?.meta?.complexity;
                    const proposerCount = entry.proposers.length;
                    const voteUpActive = entry.myVote === true;
                    const voteDownActive = entry.myVote === false;
                    return (
                      <div
                        key={entry.proposal.id}
                        data-testid={`proposal-card-${entry.proposal.id}`}
                        className={`shrink-0 w-60 border rounded-lg px-3 py-3 bg-clocktower-dark border-gray-700 transition ${entry.myVote != null ? 'shadow-[0_0_0_1px_rgba(56,189,248,0.15)]' : ''}`}
                      >
                        <button
                          className="text-left w-full"
                          onClick={() => setSelectedScriptId(entry.proposal.scriptId)}
                        >
                          <div className="text-base font-semibold text-gray-100 truncate" title={scriptName}>{scriptName}</div>
                          {complexity && (
                            <div className="text-[11px] text-gray-400 uppercase tracking-wide mt-1">{complexity}</div>
                          )}
                        </button>
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                          <span>{proposerCount} proposer{proposerCount === 1 ? '' : 's'}</span>
                          {entry.isProposer && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">You proposed</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded border text-sm font-semibold transition ${voteUpActive ? 'bg-emerald-400 text-black border-emerald-300' : 'border-gray-700 text-gray-100 hover:border-gray-500'}`}
                            onClick={() => submitProposalVote(entry.proposal.id, voteUpActive ? null : true)}
                            aria-pressed={voteUpActive}
                            data-testid={`vote-up-${entry.proposal.id}`}
                          >
                            👍 {entry.upVotes}
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded border text-sm font-semibold transition ${voteDownActive ? 'bg-rose-500 text-black border-rose-300' : 'border-gray-700 text-gray-100 hover:border-gray-500'}`}
                            onClick={() => submitProposalVote(entry.proposal.id, voteDownActive ? null : false)}
                            aria-pressed={voteDownActive}
                            data-testid={`vote-down-${entry.proposal.id}`}
                          >
                            👎 {entry.downVotes}
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Popularity score: {entry.score}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 text-sm py-6 px-4 w-full text-center">No proposed scripts yet. Press + above to start a vote.</div>
                )}
              </div>
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(proposalsScrollerRef, 320)}
                aria-label="Scroll proposed scripts right"
              >
                →
              </button>
            </div>
          </div>
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
                const storytellerSeat = currentGame.seats.find((s: any) => s.id === currentGame.storytellerSeatId);
                return (
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm truncate text-yellow-100">{storytellerSeat?.playerId || 'Unknown'}</div>
                    <span className="text-lg">👑</span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="card p-3 mb-3 border-gray-600/50">
              <div className="text-xs text-gray-400 mb-2">Storyteller</div>
              <div className="text-sm text-gray-500 italic">No storyteller assigned yet</div>
            </div>
          )}

          {/* Players list - simple scrollable list */}
              <PlayersList
                players={currentGame?.seats?.filter((s: any) => s.id !== currentGame.storytellerSeatId) || []}
                isStoryteller={isStoryteller}
                storytellerSeatId={currentGame?.storytellerSeatId}
                seatId={seatId ?? undefined}
                onMakeStoryteller={async (targetSeatId: string) => {
                  await fetch(`/api/games/${gameId}/storyteller`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ setterSeatId: seatId ?? '', targetSeatId })
                  });
                }}
              />

          {/* Player Management Buttons */}
            <PlayerControls
              onAddNPC={async () => { if (gameId) await fetch(`/api/games/${gameId}/npc`, { method: 'POST' }); }}
              onCopyLink={() => {
                if (!gameId) return;
                const origin = window.location.origin;
                const joinUrl = `${origin}/join/${gameId}`;
                navigator.clipboard.writeText(joinUrl);
              }}
              onLeaveGame={async () => {
                const ok = await leaveGame();
                if (ok) navigate('/');
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
              {pttState.mode === 'hold' ? 'Hold to talk' : 'Click to toggle'}
            </div>
          </div>
        </div>

        {/* Center Column: Scripts (wider for storytellers) */}
        <div className={`${isStoryteller ? 'col-span-6' : 'col-span-5'} flex flex-col min-h-[500px]`}>
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Storyteller Shared Scripts</div>
              <div className="text-xs text-gray-500">
                {storytellerScriptObjects.length
                  ? 'Press + to propose this script to the group.'
                  : isStoryteller
                    ? 'Select scripts above to share with players.'
                    : 'Waiting for storyteller to share scripts.'}
              </div>
            </div>
            <div className="relative mt-3">
              <button
                type="button"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(storytellerScriptsRef, -320)}
                aria-label="Scroll storyteller scripts left"
              >
                ←
              </button>
              <div
                ref={storytellerScriptsRef}
                data-testid="shared-scripts-carousel"
                className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-12"
              >
                {storytellerScriptObjects.length > 0 ? (
                  storytellerScriptObjects.map((script) => {
                    const proposalEntry = proposalByScriptId.get(script.id);
                    const iPropose = proposalEntry ? proposalEntry.isProposer : false;
                    const proposerCount = proposalEntry?.proposers.length ?? 0;
                    return (
                      <div
                        key={script.id}
                        data-testid={`shared-script-${script.id}`}
                        className="shrink-0 w-52 border border-gray-700 bg-clocktower-dark rounded-lg px-3 py-3 flex flex-col"
                      >
                        <button
                          className={`text-left transition-colors focus:outline-none focus:ring-2 focus:ring-clocktower-accent rounded ${selectedScript?.id === script.id ? 'text-gray-100' : 'text-gray-200 hover:text-gray-100'}`}
                          onClick={() => setSelectedScriptId(script.id)}
                        >
                          <div className="text-base font-semibold truncate" title={script.name}>{script.name}</div>
                          {script.meta?.complexity && (
                            <div className="text-[11px] text-gray-400 uppercase tracking-wide mt-1">{script.meta.complexity}</div>
                          )}
                          {script.meta?.playerCount && (
                            <div className="text-[11px] text-gray-500 mt-2">
                              Players {script.meta.playerCount.min ?? '?'}{script.meta.playerCount.max ? `–${script.meta.playerCount.max}` : ''}
                            </div>
                          )}
                        </button>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                          <span>{proposerCount} proposer{proposerCount === 1 ? '' : 's'}</span>
                          <button
                            type="button"
                            className={`w-7 h-7 rounded-full border text-sm font-semibold flex items-center justify-center transition ${iPropose ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600'}`}
                            onClick={() => togglePlayerProposal(script.id)}
                            aria-pressed={iPropose}
                            aria-label={iPropose ? 'Withdraw script proposal' : 'Propose this script'}
                            data-testid={`proposal-toggle-${script.id}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 text-sm py-6 px-4 w-full text-center">No storyteller scripts are available yet.</div>
                )}
              </div>
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(storytellerScriptsRef, 320)}
                aria-label="Scroll storyteller scripts right"
              >
                →
              </button>
            </div>
          </div>

          {/* Characters grid for selected script */}
          <div className="card p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Characters</div>
              {selectedScript?.characters && (
                <div className="text-xs text-gray-500">{selectedScript.characters.length} roles</div>
              )}
            </div>
            <div className="relative mt-3 flex-1 min-h-[320px]">
              <button
                type="button"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(characterScrollerRef, -240)}
                aria-label="Scroll characters left"
              >
                ←
              </button>
              {selectedScript?.characters?.length ? (
                <div
                  ref={characterScrollerRef}
                  data-testid="character-grid"
                  className="grid grid-flow-col auto-cols-[110px] grid-rows-3 gap-3 overflow-x-auto overflow-y-hidden no-scrollbar h-full px-12"
                >
                  {selectedScript.characters.map((c: any) => {
                    const imgSrc = `/artwork/characters/${(c.id || '').toLowerCase()}.png`;
                    const ring = teamRing[c.team] || 'ring-gray-500/50';
                    return (
                      <button
                        key={c.id}
                        onMouseEnter={() => {
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          setHoverCharacter(c);
                        }}
                        onMouseLeave={() => {
                          hoverTimeoutRef.current = setTimeout(() => {
                            setHoverCharacter(null);
                            hoverTimeoutRef.current = null;
                          }, 100);
                        }}
                        className="flex flex-col items-center text-center p-1 rounded hover:bg-white/5 transition"
                        title={c.name}
                      >
                        <div className={`w-20 h-20 rounded-full overflow-hidden ring-2 ${ring} bg-black/40 border border-gray-700`}>
                          <img
                            src={imgSrc}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg'; }}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                        <div className="mt-1 text-[11px] font-medium leading-tight truncate w-full text-gray-100">{c.name}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-sm py-6 px-4 text-center">Select a script to view its characters.</div>
              )}
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
                onClick={() => scrollContainerBy(characterScrollerRef, 240)}
                aria-label="Scroll characters right"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview, Modifiers, Night Order */}
          <div className={`${isStoryteller ? 'col-span-4' : 'col-span-5'} flex flex-col min-h-[500px]`}>
            <PreviewPanel
              hoverCharacter={hoverCharacter}
              artworkSrc={artworkSrc}
              selectedScript={selectedScript}
            />
            <ModifiersPanel modifiers={selectedScript?.modifiers || []} />
            <NightOrderPanel nightOrder={selectedScript?.characters?.filter((c: any) => c.firstNight && c.firstNight > 0).sort((a: any, b: any) => a.firstNight - b.firstNight).map((c: any) => c.name) || []} />
          </div>
      </div>

      {/* Phase Information */}
      {currentGame?.phase === Enums.GamePhase.SETUP && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Setup in Progress</h3>
          <p className="text-gray-300 text-sm">
            {isStoryteller
              ? "You are configuring the game setup. Click 'Continue Setup' to manage character selection."
              : 'The Storyteller is setting up the game. Please wait...'}
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
            <div className="text-sm text-gray-300" data-testid="bottom-bar-script">
              <span className="font-semibold">Script:</span> {scriptUsedName ?? 'Not selected'}
            </div>
          </div>

          <div className="flex gap-3">
            {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
              <button
                className="btn-primary px-8 py-3 text-lg font-semibold"
                onClick={handleSetup}
                disabled={!connected || !hasEnoughPlayers}
              >
                Begin Game Setup{scriptUsedName ? ` • ${scriptUsedName}` : ''}
              </button>
            )}
            {isStoryteller && currentGame?.phase === Enums.GamePhase.SETUP && (
              <button className="btn-primary px-8 py-3 text-lg font-semibold" onClick={handleSetup}>Continue Setup</button>
            )}
            {currentGame?.phase === Enums.GamePhase.NIGHT && (
              <button className="btn-primary px-8 py-3 text-lg font-semibold" onClick={handleStart}>View Game</button>
            )}
          </div>
        </BottomBar>

      {/* Storyteller readiness hint */}
      {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
        <div className="text-sm text-gray-300 mt-2 text-center">
          {connected ? (
            hasEnoughPlayers ? (
              <span>
                Ready to begin{scriptUsedName ? ` with ${scriptUsedName}` : ''}. Players: {playerCount}
                {selectedScript?.meta?.playerCount ? ` (min ${minPlayersRequired})` : ''}. Storyteller: 1.
              </span>
            ) : (
              <span>Need {minPlayersRequired - playerCount} more player{minPlayersRequired - playerCount === 1 ? '' : 's'} to begin setup{selectedScript?.meta?.playerCount ? ` for ${selectedScript?.name}` : ''}. Current: {playerCount} players, 1 storyteller.</span>
            )
          ) : (
            <span>Connecting…</span>
          )}
        </div>
      )}
    </div>
  );
};

export default LobbyPage;
