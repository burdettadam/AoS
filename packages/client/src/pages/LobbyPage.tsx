import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GameState } from '@botc/shared';

const LobbyPage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { connect, connected, currentGame, setSeat, seatId, isStoryteller } = useGameStore() as any;
  const [scriptRoles, setScriptRoles] = useState<any[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
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
      } catch (e: any) {
        setError(e.message || 'Failed to load lobby');
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [gameId]);

  // Load roles for storyteller to select
  useEffect(() => {
    if (!isStoryteller || !currentGame) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/scripts/${currentGame.scriptId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (cancelled) return;
      setScriptRoles(data.roles || []);
    })();
    return () => { cancelled = true; };
  }, [isStoryteller, currentGame?.scriptId]);

  const groupedRoles = useMemo(() => {
    const groups: Record<string, any[]> = { demon: [], minion: [], outsider: [], townsfolk: [] };
    for (const r of scriptRoles) groups[r.type]?.push(r);
    return groups;
  }, [scriptRoles]);

  const handleStart = async () => {
    if (!gameId) return;
    const res = await fetch(`/api/games/${gameId}/start`, { method: 'POST' });
    if (!res.ok) {
      setError('Failed to start game');
      return;
    }
    navigate(`/game/${gameId}`);
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
            <div className="text-sm text-gray-300">Propose a script</div>
            <div className="flex gap-2">
              <select id="scriptSelect" className="bg-clocktower-dark border border-gray-700 rounded px-3 py-2">
                <option value="trouble-brewing">Trouble Brewing</option>
              </select>
              <button
                className="btn-secondary"
                onClick={async () => {
                  const select = document.getElementById('scriptSelect') as HTMLSelectElement;
                  await fetch(`/api/games/${gameId}/scripts/propose`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proposerSeatId: seatId, scriptId: select.value })
                  });
                }}
              >Propose</button>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Proposals</div>
              <div className="space-y-2">
                {currentGame?.scriptProposals?.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                    <div className="text-sm">{p.scriptId}</div>
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
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-300 mb-2">Pick characters for this game</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-auto pr-2">
                {(['demon','minion','outsider','townsfolk'] as const).map(group => (
                  <div key={group} className="bg-gray-900/50 p-2 rounded">
                    <div className="text-xs uppercase text-gray-400 mb-2">{group}</div>
                    <div className="space-y-1">
                      {groupedRoles[group]?.map((r: any) => (
                        <label key={r.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedRoleIds.includes(r.id)}
                            onChange={(e) => {
                              setSelectedRoleIds(prev => e.target.checked ? [...prev, r.id] : prev.filter(id => id !== r.id));
                            }}
                          />
                          <span>{r.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    await fetch(`/api/games/${gameId}/roles/select`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ storytellerSeatId: seatId, roleIds: selectedRoleIds })
                    });
                  }}
                >Save Selection</button>
              </div>
            </div>
          </div>
        )}

        {!isStoryteller && (
          <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded">
            <div className="text-sm text-gray-300">Pick a character</div>
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                onClick={async () => {
                  const res = await fetch(`/api/games/${gameId}/roles/claim-random`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ seatId })
                  });
                  if (!res.ok) setError('Failed to claim role');
                }}
              >Claim Random</button>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-between">
          <button
            className="btn-secondary"
            onClick={async () => { if (gameId) await fetch(`/api/games/${gameId}/npc`, { method: 'POST' }); }}
          >
            Add NPC
          </button>
          <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy Lobby Link</button>
          <button className="btn-primary" onClick={handleStart} disabled={!connected || seatCount < 5}>Start Game</button>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
