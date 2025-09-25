import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "../context/KeycloakContext";

interface PublicGame {
  id: string;
  gameName?: string;
  scriptId: string;
  phase: string;
  seats: Array<{ playerId?: string; isNPC: boolean; position: number }>;
  createdAt: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo, authenticated, loading } = useKeycloak();
  const [joinId, setJoinId] = useState("");
  const [gameName, setGameName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [playerName, setPlayerName] = useState<string>(
    localStorage.getItem("ashes-of-salem-player-name") || "",
  );
  const [publicGames, setPublicGames] = useState<PublicGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Generate a unique game name with timestamp
  const generateGameName = () => {
    const adjectives = [
      "Mystical",
      "Ancient",
      "Shadowy",
      "Whispering",
      "Haunted",
      "Moonlit",
      "Cursed",
      "Enchanted",
      "Dark",
      "Forgotten",
    ];
    const nouns = [
      "Clocktower",
      "Village",
      "Manor",
      "Castle",
      "Tavern",
      "Cathedral",
      "Mansion",
      "Fortress",
      "Chapel",
      "Abbey",
    ];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${adjective} ${noun} (${timestamp})`;
  };

  // Generate a default player name
  const generatePlayerName = () => {
    const names = [
      "Traveler",
      "Wanderer",
      "Seeker",
      "Guardian",
      "Shadow",
      "Mystic",
      "Oracle",
      "Sage",
    ];
    const name = names[Math.floor(Math.random() * names.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${name}${number}`;
  };

  // Auto-populate game name if empty when component loads
  useEffect(() => {
    if (!gameName) {
      setGameName(generateGameName());
    }
  }, []);

  // Update playerName from Keycloak profile if available and not already set
  useEffect(() => {
    if (authenticated && userInfo) {
      const existing = localStorage.getItem("ashes-of-salem-player-name");
      if (!existing || !existing.trim()) {
        let candidate = "";
        if (
          userInfo.preferred_username &&
          !userInfo.preferred_username.includes("@")
        ) {
          candidate = userInfo.preferred_username;
        } else if (userInfo.given_name && userInfo.family_name) {
          candidate = `${userInfo.given_name} ${userInfo.family_name.charAt(0).toUpperCase()}.`;
        } else if (userInfo.name && !userInfo.name.includes("@")) {
          candidate = userInfo.name;
        } else if (userInfo.given_name) {
          candidate = userInfo.given_name;
        } else if (userInfo.sub && !userInfo.sub.includes("@")) {
          candidate = userInfo.sub;
        }
        if (candidate && candidate.trim()) {
          setPlayerName(candidate.trim());
          localStorage.setItem("ashes-of-salem-player-name", candidate.trim());
        }
      }
    }

    // Ensure we always have a player name for the Create Game button to work
    if (authenticated && (!playerName || !playerName.trim())) {
      const defaultName = generatePlayerName();
      setPlayerName(defaultName);
      localStorage.setItem("ashes-of-salem-player-name", defaultName);
    }
  }, [authenticated, userInfo, playerName]);

  // Keep localStorage in sync with input
  useEffect(() => {
    if (playerName && playerName.trim()) {
      localStorage.setItem("ashes-of-salem-player-name", playerName.trim());
    }
  }, [playerName]);

  // Fetch public games when authenticated
  const fetchPublicGames = async () => {
    if (!authenticated) return;

    try {
      setLoadingGames(true);
      const response = await fetch("/api/games/public");
      if (response.ok) {
        const games = await response.json();
        setPublicGames(games);
      }
    } catch (error) {
      console.error("Failed to fetch public games:", error);
    } finally {
      setLoadingGames(false);
    }
  };

  useEffect(() => {
    fetchPublicGames();
  }, [authenticated]);

  const handleCreateGame = async () => {
    if (!playerName.trim()) return; // guard

    // Auto-generate game name if empty
    const finalGameName = gameName.trim() || generateGameName();

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: finalGameName,
          isPublic,
        }),
      });
      const data = await response.json();
      // Navigate to lobby
      window.location.href = `/lobby/${data.gameId}`;
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const handleJoin = () => {
    if (!playerName.trim()) return;
    if (!joinId) return;
    navigate(`/lobby/${joinId}`);
  };

  const handleJoinPublicGame = (gameId: string) => {
    if (!playerName.trim()) return;
    navigate(`/lobby/${gameId}`);
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
        <p className="text-gray-300 mb-4">
          Choose the name other players will see in the lobby.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            type="text"
            placeholder="Enter your name"
            className="w-full px-4 py-2 bg-clocktower-dark border border-gray-600 rounded-lg focus:border-clocktower-accent focus:outline-none"
          />
          <div className="text-left text-sm text-gray-400 sm:ml-2">
            {playerName.trim()
              ? "Name saved"
              : "Name is required to create or join a game"}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Game</h2>
          <p className="text-gray-300 mb-6">
            Start a new game of Blood on the Clocktower with AI-powered
            characters
          </p>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm mb-2">Game Name</label>
              <div className="flex gap-2">
                <input
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  type="text"
                  placeholder="e.g., Friday Night in Ravenswood"
                  className="flex-1 px-4 py-2 bg-clocktower-dark border border-gray-600 rounded-lg focus:border-clocktower-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setGameName(generateGameName())}
                  className="px-3 py-2 bg-clocktower-dark border border-gray-600 rounded-lg hover:border-clocktower-accent transition-colors text-sm"
                  title="Generate random name"
                >
                  🎲
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Shown in the lobby for everyone.
              </p>
            </div>
            <div>
              <label className="block text-sm mb-2">Game Privacy</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="mr-2 text-clocktower-accent focus:ring-clocktower-accent"
                  />
                  <span>Public - Anyone can find and join</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="mr-2 text-clocktower-accent focus:ring-clocktower-accent"
                  />
                  <span>Private - Join by invite only</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isPublic
                  ? "Your game will appear in the public games list for others to join."
                  : "Only people with the game ID can join this game."}
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateGame}
            disabled={!playerName.trim()}
            className={`w-full py-3 text-lg btn-primary mt-4 ${!playerName.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
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
              className={`btn-secondary w-full py-3 text-lg ${!playerName.trim() || !joinId ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!playerName.trim() || !joinId}
              onClick={handleJoin}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>

      {/* Public Games List */}
      {authenticated && (
        <div className="card p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Join Public Games</h2>
            <button
              onClick={fetchPublicGames}
              disabled={loadingGames}
              className="btn-secondary px-4 py-2 text-sm"
            >
              {loadingGames ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="text-gray-300 mb-6">
            Jump into any of these public games - no invitation needed!
          </p>

          {loadingGames ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clocktower-accent mx-auto mb-2"></div>
              <p className="text-gray-400">Loading public games...</p>
            </div>
          ) : publicGames.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                No public games available right now.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Be the first to create one!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {publicGames.map((game) => {
                const playerCount = game.seats.filter(
                  (seat) => seat.playerId && !seat.isNPC,
                ).length;
                const maxPlayers = game.seats.length || 15; // Default max if no seats setup yet

                return (
                  <div
                    key={game.id}
                    className="bg-clocktower-dark rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {game.gameName || `Game ${game.id.substring(0, 8)}`}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <span>
                            Script:{" "}
                            {game.scriptId
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <span>
                            Players: {playerCount}/{maxPlayers}
                          </span>
                          <span>Phase: {game.phase}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Created:{" "}
                          {new Date(game.createdAt).toLocaleDateString()} at{" "}
                          {new Date(game.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleJoinPublicGame(game.id)}
                          disabled={!playerName.trim()}
                          className={`btn-primary px-6 py-2 ${!playerName.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="card p-8">
        <h2 className="text-2xl font-semibold mb-6">Features</h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div>
            <h3 className="text-lg font-semibold text-clocktower-accent mb-2">
              🤖 AI Characters
            </h3>
            <p className="text-gray-300">
              Intelligent NPCs that play with appropriate knowledge limitations
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clocktower-accent mb-2">
              ⚖️ Fair Play
            </h3>
            <p className="text-gray-300">
              Built-in fairness scoring to help Storytellers balance games
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clocktower-accent mb-2">
              🎮 Real-time
            </h3>
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
