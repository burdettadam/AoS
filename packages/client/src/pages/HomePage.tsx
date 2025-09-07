import React, { useState, useEffect } from 'react';
import { useKeycloak } from '../context/KeycloakContext';
import { useNavigate } from 'react-router-dom';


const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo, authenticated, loading } = useKeycloak();
  const [joinId, setJoinId] = useState('');
  const [gameName, setGameName] = useState('');
  const [playerName, setPlayerName] = useState<string>(localStorage.getItem('botc-player-name') || '');

  // Update playerName from Keycloak profile if available and not already set
  useEffect(() => {
    if (authenticated && userInfo) {
      const existing = localStorage.getItem('botc-player-name');
      if (!existing || !existing.trim()) {
        let candidate = '';
        if (userInfo.preferred_username && !userInfo.preferred_username.includes('@')) {
          candidate = userInfo.preferred_username;
        } else if (userInfo.given_name && userInfo.family_name) {
          candidate = `${userInfo.given_name} ${userInfo.family_name.charAt(0).toUpperCase()}.`;
        } else if (userInfo.name && !userInfo.name.includes('@')) {
          candidate = userInfo.name;
        } else if (userInfo.given_name) {
          candidate = userInfo.given_name;
        } else if (userInfo.sub && !userInfo.sub.includes('@')) {
          candidate = userInfo.sub;
        }
        if (candidate && candidate.trim()) {
          setPlayerName(candidate.trim());
          localStorage.setItem('botc-player-name', candidate.trim());
        }
      }
    }
  }, [authenticated, userInfo]);

  // Keep localStorage in sync with input
  useEffect(() => {
    if (playerName && playerName.trim()) {
      localStorage.setItem('botc-player-name', playerName.trim());
    }
  }, [playerName]);

  const handleCreateGame = async () => {
    if (!playerName.trim()) return; // guard
    try {
      const response = await fetch('/api/games', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName: gameName.trim() || undefined })
      });
  const data = await response.json();
      // Navigate to lobby
      window.location.href = `/lobby/${data.gameId}`;
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoin = () => {
    if (!playerName.trim()) return;
    if (!joinId) return;
    navigate(`/lobby/${joinId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-clocktower-accent mx-auto mb-4"></div>
            <p>Initializing authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
      <header className="mb-12">
        <h1 className="text-6xl font-medieval font-bold text-clocktower-accent mb-4">
          Blood on the Clocktower
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Digital Implementation with AI-Assisted Gameplay
        </p>
      </header>

      {/* Avatar Name Panel */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Avatar Name</h2>
        <p className="text-gray-300 mb-4">Choose the name other players will see in the lobby.</p>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            type="text"
            placeholder="Enter your name"
            className="w-full px-4 py-2 bg-clocktower-dark border border-gray-600 rounded-lg focus:border-clocktower-accent focus:outline-none"
          />
          <div className="text-left text-sm text-gray-400 sm:ml-2">
            {playerName.trim() ? 'Name saved' : 'Name is required to create or join a game'}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Game</h2>
          <p className="text-gray-300 mb-6">
            Start a new game of Blood on the Clocktower with AI-powered characters
          </p>
          <div className="mb-4 text-left">
            <label className="block text-sm mb-2">Game Name</label>
            <input
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              type="text"
              placeholder="e.g., Friday Night in Ravenswood"
              className="w-full px-4 py-2 bg-clocktower-dark border border-gray-600 rounded-lg focus:border-clocktower-accent focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Shown in the lobby for everyone.</p>
          </div>
          <button 
            onClick={handleCreateGame}
            disabled={!playerName.trim()}
            className={`w-full py-3 text-lg btn-primary ${!playerName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Create Game
          </button>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-4">Join Existing Game</h2>
          <p className="text-gray-300 mb-6">
            Enter a game ID to join an existing game
          </p>
          <div className="space-y-4">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              type="text"
              placeholder="Game ID"
              className="w-full px-4 py-2 bg-clocktower-dark border border-gray-600 rounded-lg focus:border-clocktower-accent focus:outline-none"
            />
            <button
              className={`btn-secondary w-full py-3 text-lg ${(!playerName.trim() || !joinId) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!playerName.trim() || !joinId}
              onClick={handleJoin}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-semibold mb-6">Features</h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div>
            <h3 className="text-lg font-semibold text-clocktower-accent mb-2">🤖 AI Characters</h3>
            <p className="text-gray-300">
              Intelligent NPCs that play with appropriate knowledge limitations
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clocktower-accent mb-2">⚖️ Fair Play</h3>
            <p className="text-gray-300">
              Built-in fairness scoring to help Storytellers balance games
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clocktower-accent mb-2">🎮 Real-time</h3>
            <p className="text-gray-300">
              Live gameplay with WebSocket communication and voice chat support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
