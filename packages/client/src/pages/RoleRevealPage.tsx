import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

const RoleRevealPage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentGame, seatId, isStoryteller, connect, setCurrentGame } = useGameStore() as any;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!gameId) return;
      try {
        // Ensure WS subscription for live updates
        connect(gameId as any, seatId);
        // Fetch latest snapshot to avoid race conditions right after start
        const res = await fetch(`/api/games/${gameId}`);
        if (!res.ok) throw new Error('Failed to load game');
        const data = await res.json();
        if (!cancelled) setCurrentGame(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load role');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  const mySeat = useMemo(() => {
    if (!currentGame || !seatId) return undefined;
    return currentGame.seats.find((s: any) => s.id === seatId);
  }, [currentGame, seatId]);

  const getRoleDisplayName = (role: string | undefined) => {
    if (!role) return 'Unknown';
    return role
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getAlignmentColor = (alignment: string | undefined) => {
    switch (alignment) {
      case 'good':
        return 'text-blue-400';
      case 'evil':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">Preparing your role...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center text-red-400">{error}</div>
      </div>
    );
  }

  // Storyteller sees a grimoire link instead of a specific role
  if (isStoryteller) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-medieval font-bold mb-6">Storyteller Ready</h1>
        <div className="card p-8">
          <p className="text-gray-300 mb-6">
            The game has started. Proceed to the table to view the grimoire and manage phases.
          </p>
          <button className="btn-primary px-6 py-3" onClick={() => navigate(`/game/${gameId}`)}>
            Enter Game Table
          </button>
        </div>
      </div>
    );
  }

  const canReveal = !!mySeat?.role;

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-medieval font-bold mb-6">Your Role</h1>
      <div className="card p-10">
        {!canReveal ? (
          <div className="text-gray-300">Waiting for the Storyteller to assign roles...</div>
        ) : (
          <div className="space-y-4">
            <div className={`text-sm uppercase ${getAlignmentColor(mySeat?.alignment)}`}>Alignment</div>
            <div className={`text-2xl font-semibold ${getAlignmentColor(mySeat?.alignment)}`}>
              {mySeat?.alignment?.toUpperCase()}
            </div>
            <div className="text-sm uppercase text-gray-400 mt-6">Role</div>
            <div className="text-3xl font-bold">{getRoleDisplayName(mySeat?.role)}</div>
            <div className="text-gray-400 text-sm">Keep your role secret unless you choose to reveal it.</div>
            <div className="pt-6">
              <button className="btn-primary px-6 py-3" onClick={() => navigate(`/game/${gameId}`)}>
                Enter Game Table
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleRevealPage;
