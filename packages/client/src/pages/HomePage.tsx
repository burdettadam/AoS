import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');

  const handleCreateGame = async () => {
    try {
      const response = await fetch('/api/games', { method: 'POST' });
  const data = await response.json();
      // Navigate to lobby
      window.location.href = `/lobby/${data.gameId}`;
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoin = () => {
    if (!joinId) return;
    navigate(`/lobby/${joinId}`);
  };

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

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Game</h2>
          <p className="text-gray-300 mb-6">
            Start a new game of Blood on the Clocktower with AI-powered characters
          </p>
          <button 
            onClick={handleCreateGame}
            className="btn-primary w-full py-3 text-lg"
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
            <button className="btn-secondary w-full py-3 text-lg" onClick={handleJoin}>
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
