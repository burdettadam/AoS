import type { GameState } from "@botc/shared";
import * as Enums from "@botc/shared";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameStore } from "../store/gameStore";

export const useGameConnection = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { connect, setSeat, seatId, isStoryteller } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId] = useState(() => {
    const nameKey = "ashes-of-salem-player-name";
    const name = (localStorage.getItem(nameKey) || "").trim();
    return name;
  });

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
        if (!res.ok) throw new Error("Game not found");
        const game: GameState = await res.json();
        if (cancelled) return;

        const storedSeat = localStorage.getItem("botc-seat-id");

        if (game.phase === Enums.GamePhase.LOBBY) {
          // Try to reuse existing seat first by playerId or stored seatId
          const mySeat = game.seats.find(
            (s: any) =>
              (storedSeat && s.id === storedSeat) || s.playerId === playerId,
          );

          if (!mySeat) {
            // Join the game
            const joinRes = await fetch(`/api/games/${gameId}/join`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playerId }),
            });
            if (!joinRes.ok) throw new Error("Failed to join game");
            const joinData = await joinRes.json();
            setSeat(joinData.seatId, joinData.isStoryteller);
            connect(game.id, joinData.seatId);
          } else {
            setSeat(mySeat.id, mySeat.id === (game as any).storytellerSeatId);
            connect(game.id, mySeat.id);
          }
        } else {
          // Game already advanced; try to find existing seat by playerId
          const mySeat = game.seats.find(
            (s: any) =>
              (storedSeat && s.id === storedSeat) || s.playerId === playerId,
          );

          if (!mySeat) {
            setError("Game already started. Ask the Storyteller to add you.");
          } else {
            setSeat(mySeat.id, mySeat.id === (game as any).storytellerSeatId);
            connect(game.id, mySeat.id);
          }
        }
      } catch (e: any) {
        setError(e.message || "Failed to load lobby");
      } finally {
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [gameId, playerId, navigate, connect, setSeat]);

  return {
    gameId,
    playerId,
    loading,
    error,
    seatId,
    isStoryteller,
  };
};

export const useScriptSelection = () => {
  const { availableScripts, loadScripts, currentGame, seatId, isStoryteller } =
    useGameStore();

  const [selectedScriptId, setSelectedScriptId] = useState<string>("");

  // Aggressively preload scripts immediately when hook is used
  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  // Default the dropdown to the game's current script (if any) once available
  useEffect(() => {
    if (!selectedScriptId && currentGame?.scriptId) {
      setSelectedScriptId(currentGame.scriptId);
    }
  }, [currentGame?.scriptId, selectedScriptId]);

  // Get available scripts from game state, fallback to empty array
  const storytellerSelectedScripts = currentGame?.availableScriptIds || [];

  // For storytellers: all scripts available for selection
  // For players: only scripts the storyteller has approved
  const visibleScripts = useMemo(() => {
    if (isStoryteller) {
      return availableScripts;
    }
    return availableScripts.filter((script: any) =>
      storytellerSelectedScripts.includes(script.id),
    );
  }, [availableScripts, isStoryteller, storytellerSelectedScripts]);

  const selectedScript = useMemo(() => {
    // Prefer manual selection; otherwise fall back to the game's current script
    const manual = visibleScripts.find((s: any) => s.id === selectedScriptId);
    if (manual) return manual;
    if (currentGame?.scriptId) {
      return visibleScripts.find((s: any) => s.id === currentGame.scriptId);
    }
    return undefined;
  }, [visibleScripts, selectedScriptId, currentGame?.scriptId]);

  const scriptLookup = useMemo(() => {
    const byId: Record<string, any> = {};
    for (const script of availableScripts) {
      byId[script.id] = script;
    }
    return byId;
  }, [availableScripts]);

  const storytellerScriptObjects = useMemo(() => {
    return storytellerSelectedScripts
      .map((id: string) => scriptLookup[id])
      .filter(Boolean);
  }, [storytellerSelectedScripts, scriptLookup]);

  const scriptUsedName = useMemo(() => {
    if (selectedScript?.name) return selectedScript.name;
    if (currentGame?.scriptId) {
      return scriptLookup[currentGame.scriptId]?.name || currentGame.scriptId;
    }
    return undefined;
  }, [selectedScript?.name, currentGame?.scriptId, scriptLookup]);

  // Helper function to update available scripts on server
  const updateAvailableScripts = async (scriptIds: string[]) => {
    if (!currentGame?.id || !seatId) return;
    try {
      await fetch(`/api/games/${currentGame.id}/scripts/available`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storytellerSeatId: seatId, scriptIds }),
      });
    } catch (error) {
      console.error("Failed to update available scripts:", error);
    }
  };

  const toggleStorytellerScript = async (scriptId: string) => {
    if (!isStoryteller || !currentGame?.id || !seatId) return;
    const nextIds = storytellerSelectedScripts.includes(scriptId)
      ? storytellerSelectedScripts.filter((id: string) => id !== scriptId)
      : Array.from(new Set([...storytellerSelectedScripts, scriptId]));
    await updateAvailableScripts(nextIds);
  };

  return {
    selectedScriptId,
    setSelectedScriptId,
    selectedScript,
    visibleScripts,
    availableScripts,
    storytellerSelectedScripts,
    storytellerScriptObjects,
    scriptLookup,
    scriptUsedName,
    toggleStorytellerScript,
  };
};
