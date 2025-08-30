import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import type { GameState, LoadedScript } from '@botc/shared';
import { GamePhase } from '@botc/shared';

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
    scriptsLoading,
    loadScripts,
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId] = useState(() => {
    // Persist a random UUID-ish for demo purposes
    const key = 'botc-player-id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  });
  const seatCount = currentGame?.seats?.length ?? 0;
  const [scriptInfo, setScriptInfo] = useState<{ id: string; name: string; playerCount?: { min: number; max: number } } | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const selectedScript = useMemo(() => {
    // Prefer manual selection; otherwise fall back to the game's current script
    const manual = availableScripts.find((s: LoadedScript) => s.id === selectedScriptId);
    if (manual) return manual;
    if (currentGame?.scriptId) {
      return availableScripts.find((s: LoadedScript) => s.id === currentGame.scriptId);
    }
  return undefined;
  }, [availableScripts, selectedScriptId, currentGame?.scriptId]);

  // Resolve a local artwork path; fall back to placeholder if missing
  const artworkSrc = useMemo(() => {
    const id = selectedScript?.id || scriptInfo?.id;
    if (!id) return '/script-art/placeholder.svg';
    // Prefer .png or .jpg. We don't check existence here; the img onError will swap to placeholder.
    return `/script-art/${id}.png`;
  }, [selectedScript?.id, scriptInfo?.id]);

  // Derive a lightweight first-night order by sorting characters with firstNight defined
  const firstNightOrder = useMemo(() => {
    if (!selectedScript?.characters?.length) return [] as { id: string; name: string; order: number }[];
    return selectedScript.characters
      .map((c: any) => ({ id: c.id, name: c.name, order: typeof c.firstNight === 'number' ? c.firstNight : 999 }))
      .filter((c: any) => c.order !== 999)
      .sort((a: any, b: any) => a.order - b.order)
      .slice(0, 10);
  }, [selectedScript?.characters]);

  // Load current script info for player count requirements
  useEffect(() => {
    const load = async () => {
      const scriptId = currentGame?.scriptId;
      if (!scriptId) return;
      try {
        const res = await fetch(`/api/scripts/${scriptId}`);
        if (!res.ok) return;
        const data = await res.json();
        setScriptInfo(data);
      } catch {}
    };
    load();
  }, [currentGame?.scriptId]);

  const minPlayersRequired = useMemo(() => scriptInfo?.playerCount?.min ?? 5, [scriptInfo]);
  const hasEnoughPlayers = seatCount >= minPlayersRequired;

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

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    async function init() {
      try {
        // Fetch initial state
        const res = await fetch(`/api/games/${gameId}`);
        if (!res.ok) throw new Error('Game not found');
        const game: GameState = await res.json();
        if (cancelled) return;

        if (game.phase === GamePhase.LOBBY) {
          // Join the game
          const joinRes = await fetch(`/api/games/${gameId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId })
          });
          if (!joinRes.ok) throw new Error('Failed to join game');
          const joinData = await joinRes.json();
          setSeat(joinData.seatId, joinData.isStoryteller);
          // Connect to WS for live updates
          connect(game.id, joinData.seatId);
        } else {
          // Game already advanced; try to find existing seat by playerId
          const mySeat = game.seats.find((s: any) => s.playerId === playerId);
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
    if (currentGame?.phase === GamePhase.SETUP && isStoryteller) {
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-medieval font-bold text-center mb-8">Game Lobby</h1>
      <div className="card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Game ID</div>
            <div className="font-mono">{gameId}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Players</div>
            <div className="font-semibold">{seatCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Phase</div>
            <div className="font-semibold capitalize">{currentGame?.phase || 'Lobby'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentGame?.seats?.map((s: any, i: number) => (
            <div key={s.id} className="p-4 bg-clocktower-dark rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Seat {i + 1}</div>
              <div className="truncate font-mono text-xs flex items-center gap-2">
                {s.playerId || 'NPC'}
                {s.id === currentGame.storytellerSeatId && (
                  <span className="text-xs text-yellow-400">Storyteller</span>
                )}
              </div>
            </div>
          ))}
          {(!currentGame || currentGame.seats.length === 0) && (
            <div className="text-gray-400">No players yet. Join links will appear as players connect.</div>
          )}
        </div>

        {isStoryteller && (
          <div className="space-y-3">
            <div className="text-sm text-gray-300">Script Selection</div>
            <div className="flex gap-2 items-start">
              <select
                id="scriptSelect"
                className="bg-clocktower-dark border border-gray-700 rounded px-3 py-2"
                value={selectedScriptId}
                onChange={(e) => setSelectedScriptId(e.target.value)}
              >
                {scriptsLoading ? (
                  <option value="">Loading scripts...</option>
                ) : (
                  <>
                    <option value="">Select a script</option>
                    {availableScripts.map((script: LoadedScript) => (
                      <option key={script.id} value={script.id}>
                        {script.name}
                        {script.meta?.playerCount && (
                          ` (${script.meta.playerCount.min}-${script.meta.playerCount.max} players)`
                        )}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <button
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={scriptsLoading}
                onClick={async () => {
                  const selectValue = selectedScriptId;
                  if (!selectValue) {
                    alert('Please select a script first');
                    return;
                  }
                  await fetch(`/api/games/${gameId}/scripts/propose`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proposerSeatId: seatId, scriptId: selectValue })
                  });
                }}
              >
                {scriptsLoading ? 'Loading...' : 'Propose'}
              </button>
            </div>

            {/* Script summary panel */}
            {selectedScript && (
              <div className="mt-3 p-3 rounded border border-gray-700 bg-black/20">
                <div className="flex items-start gap-3">
                  <img
                    src={artworkSrc}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/script-art/placeholder.svg'; }}
                    alt={`${selectedScript.name} artwork`}
                    className="w-20 h-20 object-cover rounded border border-gray-700 bg-black"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold">{selectedScript.name}</div>
                        {selectedScript.meta?.complexity && (
                          <div className="text-xs text-gray-400 capitalize">{selectedScript.meta.complexity}</div>
                        )}
                      </div>
                      {selectedScript.meta?.playerCount && (
                        <div className="text-xs text-gray-300 shrink-0">
                          Players: {selectedScript.meta.playerCount.min}-{selectedScript.meta.playerCount.max}
                        </div>
                      )}
                    </div>
                {selectedScript.meta?.description && (
                  <p className="text-sm text-gray-200 mt-2 leading-snug line-clamp-3">{selectedScript.meta.description}</p>
                )}
                {/* Lightweight preview of characters */}
                {selectedScript.characters?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-300">
                    <span className="text-gray-400">Includes:</span>{' '}
                    {selectedScript.characters.slice(0, 8).map((c: any) => c.name).join(', ')}
                    {selectedScript.characters.length > 8 && '…'}
                  </div>
                )}
                {/* First night order (from computed list) */}
                {firstNightOrder.length > 0 && (
                  <div className="mt-2 text-xs text-gray-300">
                    <span className="text-gray-400">First Night:</span>{' '}
                    {firstNightOrder.map((r, idx) => (
                      <span key={r.id}>{idx > 0 && ', '}{r.name}</span>
                    ))}
                  </div>
                )}
                {selectedScript.meta?.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedScript.meta.tags.slice(0, 6).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] rounded bg-gray-700 text-gray-200">{tag}</span>
                    ))}
                    {selectedScript.meta.tags.length > 6 && (
                      <span className="px-2 py-0.5 text-[10px] rounded bg-gray-700 text-gray-300">+{selectedScript.meta.tags.length - 6} more</span>
                    )}
                  </div>
                ) : null}
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-400 mb-2">Proposals</div>
              <div className="space-y-2">
                {currentGame?.scriptProposals?.map((p: any) => {
                  const script = availableScripts.find((s: LoadedScript) => s.id === p.scriptId);
                  const scriptName = script?.name || p.scriptId;
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{scriptName}</div>
                        {script?.meta?.complexity && (
                          <div className="text-xs text-gray-400 capitalize">{script.meta.complexity}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary"
                          onClick={async () => {
                            await fetch(`/api/games/${gameId}/scripts/vote`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ voterSeatId: seatId, proposalId: p.id, vote: true })
                            });
                          }}
                        >Vote Yes</button>
                        <button className="btn-secondary"
                          onClick={async () => {
                            await fetch(`/api/games/${gameId}/scripts/vote`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ voterSeatId: seatId, proposalId: p.id, vote: false })
                            });
                          }}
                        >Vote No</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Phase Information */}
        {currentGame?.phase === GamePhase.SETUP && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Setup in Progress</h3>
            <p className="text-gray-300 text-sm">
              {isStoryteller 
                ? "You are configuring the game setup. Click 'Continue Setup' to manage character selection."
                : "The Storyteller is setting up the game. Please wait..."
              }
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-between">
          <button
            className="btn-secondary"
            onClick={async () => { if (gameId) await fetch(`/api/games/${gameId}/npc`, { method: 'POST' }); }}
          >
            Add NPC
          </button>
          <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Copy Lobby Link
          </button>
          
      {isStoryteller && currentGame?.phase === GamePhase.LOBBY && (
            <button 
              className="btn-primary" 
        onClick={handleSetup} 
        disabled={!connected || !hasEnoughPlayers}
            >
        Begin Setup
            </button>
          )}
          
          {isStoryteller && currentGame?.phase === GamePhase.SETUP && (
            <button 
              className="btn-primary" 
              onClick={handleSetup}
            >
              Continue Setup
            </button>
          )}
          
          {currentGame?.phase === GamePhase.NIGHT && (
            <button className="btn-primary" onClick={handleStart}>
              View Game
            </button>
          )}
        </div>
      </div>
      {isStoryteller && currentGame?.phase === GamePhase.LOBBY && (
        <div className="text-sm text-gray-300 mt-2">
          {connected ? (
            hasEnoughPlayers ? (
              <span>Ready to begin. Players: {seatCount}{scriptInfo?.playerCount ? ` (min ${minPlayersRequired})` : ''}.</span>
            ) : (
              <span>Need {minPlayersRequired - seatCount} more player{minPlayersRequired - seatCount === 1 ? '' : 's'} to begin setup{scriptInfo?.playerCount ? ` for ${scriptInfo.name}` : ''}.</span>
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
