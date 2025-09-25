import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const JoinPage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState<string>(
    localStorage.getItem("ashes-of-salem-player-name") || "",
  );
  const [gameName, setGameName] = useState<string>("");

  useEffect(() => {
    if (!gameId) {
      navigate("/");
    }
    // Fetch public game info to show name if available
    const load = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}`);
        if (res.ok) {
          const g = await res.json();
          if ((g as any)?.gameName) setGameName((g as any).gameName);
        }
      } catch {
        // Ignore errors when loading game name
      }
    };
    load();
  }, [gameId, navigate]);

  const onContinue = () => {
    const name = playerName.trim();
    if (!name) return;
    localStorage.setItem("ashes-of-salem-player-name", name);
    // Don't clear existing seat; LobbyPage will reuse if present
    navigate(`/lobby/${gameId}`);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-semibold mb-2">
        Join Game{gameName ? `: ${gameName}` : ""}
      </h1>
      <div className="card p-6">
        {gameName ? (
          <div className="text-sm text-gray-400 mb-4">
            Game ID: <span className="font-mono">{gameId}</span>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-400 mb-2">Game</div>
            <div className="font-mono text-sm mb-6">{gameId}</div>
          </>
        )}

        <label
          className="block text-sm text-gray-300 mb-2"
          htmlFor="playerName"
        >
          Your Avatar Name
        </label>
        <input
          id="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          type="text"
          placeholder="Enter your name"
          className="w-full px-4 py-2 bg-clocktower-dark border border-gray-600 rounded-lg focus:border-clocktower-accent focus:outline-none"
        />
        <button
          onClick={onContinue}
          disabled={!playerName.trim()}
          className={`btn-primary mt-4 ${!playerName.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Continue to Lobby
        </button>
      </div>
    </div>
  );
};

export default JoinPage;
