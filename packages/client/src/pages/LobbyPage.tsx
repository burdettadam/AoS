import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import type { GameState, LoadedScript } from '@botc/shared';
import * as Enums from '@botc/shared';

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
  const charactersScrollRef = useRef<HTMLDivElement | null>(null);
  
  // Team ring colors for character icons
  const teamRing: Record<string, string> = {
    townsfolk: 'ring-green-500/60',
    outsider: 'ring-blue-400/60',
    minion: 'ring-purple-500/60',
    demon: 'ring-red-500/70',
    traveller: 'ring-amber-400/60',
    fabled: 'ring-sky-400/60',
  };

  const scrollCharacters = (dir: 'left' | 'right') => {
    const el = charactersScrollRef.current;
    if (!el) return;
    const delta = Math.max(240, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };
  
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

  // Zelda-inspired layout
  return (
    <div className="max-w-[1200px] mx-auto">
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
      <div className="grid grid-cols-12 gap-4">
        {/* Left: seats and players */}
        <div className="col-span-12 md:col-span-3 h-[600px] flex flex-col">
          {/* Storyteller panel - visible to everyone */}
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

          {/* Players panel */}
          <div className="card p-3 flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400">Players</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {currentGame?.seats?.filter((s: any) => s.id !== currentGame.storytellerSeatId).map((s: any, i: number) => (
                <div key={s.id} className="p-2 rounded border border-gray-700 bg-clocktower-dark">
                  <div className="text-[10px] text-gray-400">Seat {i + 1}</div>
                  <div className="truncate font-mono text-[11px]">
                    {s.playerId || 'NPC'}
                  </div>
                  {isStoryteller && currentGame.storytellerSeatId === seatId && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/games/${gameId}/storyteller`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setterSeatId: seatId, targetSeatId: s.id }) });
                      }}
                      className="mt-1 w-full text-[10px] btn-secondary"
                    >Make Storyteller</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: script selection area and character list */}
        <div className="col-span-12 md:col-span-5 h-[600px] flex flex-col">
          {/* Storyteller-only: All scripts selector */}
          {isStoryteller && (
            <div className="card p-3 mb-3">
              <div className="text-sm text-gray-300 mb-2">All Scripts (Storyteller Only)</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {availableScripts.map((s: LoadedScript) => (
                  <div key={s.id} className="shrink-0 relative">
                    <button
                      className={`px-3 py-2 rounded border ${selectedScript?.id === s.id ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-clocktower-dark hover:border-gray-500'}`}
                      onClick={() => setSelectedScriptId(s.id)}
                    >
                      <div className="text-sm">{s.name}</div>
                      {s.meta?.complexity && <div className="text-[10px] text-gray-400 capitalize">{s.meta.complexity}</div>}
                    </button>
                    <button
                      onClick={async () => {
                        if (storytellerSelectedScripts.includes(s.id)) {
                          const newScriptIds = storytellerSelectedScripts.filter(id => id !== s.id);
                          await updateAvailableScripts(newScriptIds);
                        } else {
                          const newScriptIds = [...storytellerSelectedScripts, s.id];
                          await updateAvailableScripts(newScriptIds);
                        }
                      }}
                      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                        storytellerSelectedScripts.includes(s.id) 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                      title={storytellerSelectedScripts.includes(s.id) ? 'Remove from player scripts' : 'Add to player scripts'}
                    >
                      {storytellerSelectedScripts.includes(s.id) ? '✓' : '+'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storyteller-only: Selected scripts for players */}
          {isStoryteller && (
            <div className="card p-3 mb-3">
              <div className="text-sm text-gray-300 mb-2">Scripts Available to Players</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar min-h-[60px]">
                {storytellerSelectedScripts.length > 0 ? (
                  storytellerSelectedScripts.map((scriptId) => {
                    const script = availableScripts.find(s => s.id === scriptId);
                    if (!script) return null;
                    return (
                      <div key={scriptId} className="shrink-0 px-3 py-2 rounded border border-gray-700 bg-clocktower-dark flex items-center gap-2">
                        <div>
                          <div className="text-sm">{script.name}</div>
                          {script.meta?.complexity && <div className="text-[10px] text-gray-400 capitalize">{script.meta.complexity}</div>}
                        </div>
                        <button
                          onClick={async () => {
                            const newScriptIds = storytellerSelectedScripts.filter(id => id !== scriptId);
                            await updateAvailableScripts(newScriptIds);
                          }}
                          className="text-red-400 hover:text-red-300 text-xs ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 text-sm p-3">No scripts selected for players yet. Select scripts from above to make them visible to players.</div>
                )}
              </div>
            </div>
          )}

          {/* Players-only: Available scripts */}
          {!isStoryteller && (
            <div className="card p-3 mb-3">
              <div className="text-sm text-gray-300 mb-2">Available Scripts</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {visibleScripts.length > 0 ? (
                  visibleScripts.map((s: LoadedScript) => (
                    <button
                      key={s.id}
                      className={`shrink-0 px-3 py-2 rounded border ${selectedScript?.id === s.id ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-clocktower-dark hover:border-gray-500'}`}
                      onClick={() => setSelectedScriptId(s.id)}
                    >
                      <div className="text-sm">{s.name}</div>
                      {s.meta?.complexity && <div className="text-[10px] text-gray-400 capitalize">{s.meta.complexity}</div>}
                    </button>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm p-3">The storyteller hasn't made any scripts available yet.</div>
                )}
              </div>
            </div>
          )}



          {/* Characters grid for selected script */}
          {/* Characters panel: fixed height with horizontal sliding */}
          <div className="card p-3 flex-1 flex flex-col">
            <div className="text-sm text-gray-300 mb-2">Characters</div>
            <div className="relative">
              <div
                ref={charactersScrollRef}
                className="grid gap-3 overflow-x-auto no-scrollbar py-1 pr-8"
                style={{ scrollBehavior: 'smooth', gridAutoFlow: 'column', gridTemplateRows: 'repeat(4, minmax(0, 1fr))' }}
              >
                {selectedScript?.characters?.map((c: any) => {
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
                      className="shrink-0 w-[110px] flex flex-col items-center text-center p-1 rounded hover:bg-white/5"
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
                      <div className="mt-1 text-[10px] font-medium leading-tight truncate w-full">{c.name}</div>
                    </button>
                  );
                })}
                {!selectedScript && (
                  <div className="text-gray-400 px-3">Select a script to preview its characters.</div>
                )}
              </div>
              {selectedScript?.characters?.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => scrollCharacters('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-2 py-1 rounded"
                    aria-label="Scroll characters left"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCharacters('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-2 py-1 rounded"
                    aria-label="Scroll characters right"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>

            {isStoryteller && selectedScript && storytellerSelectedScripts.includes(selectedScript.id) && (
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    if (!selectedScriptId) return alert('Pick a script first');
                    await fetch(`/api/games/${gameId}/scripts/propose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposerSeatId: seatId, scriptId: selectedScriptId }) });
                  }}
                >Propose Script</button>
              </div>
            )}

            {!isStoryteller && selectedScript && (
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    if (!selectedScriptId) return alert('Pick a script first');
                    await fetch(`/api/games/${gameId}/scripts/propose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposerSeatId: seatId, scriptId: selectedScriptId }) });
                  }}
                >Propose Script</button>
              </div>
            )}

          </div>

          {/* Bottom proposals slider visible to everyone: sorted by thumbs up */}
          <div className="card p-2 mt-3">
            <div className="text-sm text-gray-400 mb-1">Proposed Scripts</div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {currentGame?.scriptProposals?.length ? (
                [...currentGame.scriptProposals].sort((a: any, b: any) => (b.tallies?.yes || 0) - (a.tallies?.yes || 0)).map((p: any) => {
                  const s = availableScripts.find((x: any) => x.id === p.scriptId);
                  const name = s?.name || p.scriptId;
                  return (
                    <div key={p.id} className="shrink-0 px-3 py-2 rounded border border-gray-700 bg-clocktower-dark hover:border-gray-500">
                      <div className="text-xs font-medium truncate max-w-[180px]">{name}</div>
                      <div className="text-[10px] text-gray-400 flex gap-2 mt-1">
                        <button 
                          className="hover:text-green-400"
                          onClick={async () => {
                            await fetch(`/api/games/${gameId}/scripts/vote`, { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ voterSeatId: seatId, proposalId: p.id, vote: true }) 
                            });
                          }}
                        >
                          👍 {p.tallies?.yes ?? 0}
                        </button>
                        <button 
                          className="hover:text-red-400"
                          onClick={async () => {
                            await fetch(`/api/games/${gameId}/scripts/vote`, { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ voterSeatId: seatId, proposalId: p.id, vote: false }) 
                            });
                          }}
                        >
                          👎 {p.tallies?.no ?? 0}
                        </button>
                      </div>
                      <div className="mt-1 flex gap-1 text-[10px]">
                        {(['beginner','intermediate','advanced'] as const).map(level => (
                          <button 
                            key={level} 
                            className="px-1 py-0.5 rounded bg-black/40 border border-gray-700 capitalize hover:border-gray-500"
                            onClick={async () => {
                              await fetch(`/api/games/${gameId}/scripts/vote`, { 
                                method: 'POST', 
                                headers: { 'Content-Type': 'application/json' }, 
                                body: JSON.stringify({ voterSeatId: seatId, proposalId: p.id, difficulty: level }) 
                              });
                            }}
                          >
                            {level}: {p.tallies?.difficulty?.[level] ?? 0}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-400 text-xs px-3 py-2">No scripts proposed yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: script or character detail like Zelda BOTW panel */}
        <div className="col-span-12 md:col-span-4 h-[600px] flex flex-col">
          <div className="grid grid-cols-3 gap-3 h-full">
            {/* Preview Panel */}
            <div className="card p-3 flex flex-col col-span-2">
              <div className="aspect-square w-full mb-3 bg-black/40 border border-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={hoverCharacter ? `/artwork/characters/${(hoverCharacter.id || '').toLowerCase()}.png` : artworkSrc}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg'; }}
                  alt={hoverCharacter ? hoverCharacter.name : selectedScript?.name || 'art'}
                  className="object-contain max-h-full"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="text-lg font-semibold">
                  {hoverCharacter ? hoverCharacter.name : selectedScript?.name || 'Pick a script'}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {hoverCharacter ? hoverCharacter.team : selectedScript?.meta?.complexity}
                </div>
                <p className="text-sm text-gray-200 mt-2 whitespace-pre-line">
                  {hoverCharacter ? hoverCharacter.ability : selectedScript?.meta?.description}
                </p>

                {/* Modifiers preview */}
                {selectedScript?.modifiers && selectedScript.modifiers.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-gray-200 mb-1">Modifiers</div>
                    <ul className="space-y-1 text-xs text-gray-300">
                      {selectedScript.modifiers.map((m: any, idx: number) => {
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
                  </div>
                )}
              </div>
            </div>

            {/* Night Order Panel */}
            <div className="card p-3 flex flex-col col-span-1">
              <div className="text-lg font-semibold mb-2">Night Order</div>
              <div className="flex-1 overflow-y-auto">
                {selectedScript?.characters ? (
                  <div className="space-y-1">
                    {selectedScript.characters
                      .filter((c: any) => c.firstNight && c.firstNight > 0)
                      .sort((a: any, b: any) => a.firstNight - b.firstNight)
                      .map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between text-xs p-1 rounded bg-clocktower-dark/50">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-gray-400">{c.firstNight}</span>
                        </div>
                      ))}
                    {selectedScript.characters.filter((c: any) => c.firstNight && c.firstNight > 0).length === 0 && (
                      <div className="text-gray-400 text-xs">No first night actions</div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs">Select a script to see night order</div>
                )}
              </div>
            </div>
          </div>
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

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 gap-3">
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={async () => { if (gameId) await fetch(`/api/games/${gameId}/npc`, { method: 'POST' }); }}
          >
            Add NPC
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              if (!gameId) return;
              const origin = window.location.origin;
              const joinUrl = `${origin}/join/${gameId}`;
              navigator.clipboard.writeText(joinUrl);
            }}
          >
            Copy Lobby Link
          </button>
          {currentGame?.phase === Enums.GamePhase.LOBBY && (
            <button
              className="btn-secondary"
              onClick={async () => {
                const ok = await leaveGame();
                if (ok) navigate('/');
              }}
            >
              Leave Game
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
            <button
              className="btn-primary"
              onClick={handleSetup}
              disabled={!connected || !hasEnoughPlayers}
            >
              Begin Setup
            </button>
          )}
          {isStoryteller && currentGame?.phase === Enums.GamePhase.SETUP && (
            <button className="btn-primary" onClick={handleSetup}>Continue Setup</button>
          )}
          {currentGame?.phase === Enums.GamePhase.NIGHT && (
            <button className="btn-primary" onClick={handleStart}>View Game</button>
          )}
        </div>
      </div>

      {/* Storyteller readiness hint */}
  {isStoryteller && currentGame?.phase === Enums.GamePhase.LOBBY && (
        <div className="text-sm text-gray-300 mt-2">
          {connected ? (
            hasEnoughPlayers ? (
              <span>Ready to begin. Players: {playerCount}{selectedScript?.meta?.playerCount ? ` (min ${minPlayersRequired})` : ''}. Storyteller: 1.</span>
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
