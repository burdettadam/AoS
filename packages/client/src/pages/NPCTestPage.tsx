/**
 * NPC Test Page
 * Interactive testing interface for NPC agents with character selection and chat
 */

import type { NPCProfilePreview } from "@botc/shared";
import React, { useEffect, useRef, useState } from "react";
import { fetchNPCProfilePreviews } from "../api/npcProfilesApi";
import { sendMessageToNPC, startNPCTestSession } from "../api/npcTestApi";
import {
  SpeechSettings,
  textToSpeechService,
  VoiceOption,
} from "../services/TextToSpeechService";
import { logger } from "../utils/logger";

interface ChatMessage {
  id: string;
  sender: "user" | "npc";
  content: string;
  timestamp: Date;
  profileName?: string;
}

interface NPCTestState {
  selectedProfile: NPCProfilePreview | null;
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  gameContext?: {
    character: string;
    characterTeam: string;
    seatName: string;
    gameDay: number;
    aliveCount: number;
  };
}

const NPCTestPage: React.FC = () => {
  // Main state
  const [profiles, setProfiles] = useState<NPCProfilePreview[]>([]);
  const [state, setState] = useState<NPCTestState>({
    selectedProfile: null,
    sessionId: null,
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null,
  });

  // Chat input state
  const [messageInput, setMessageInput] = useState("");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>({
    voice: "",
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
  });
  const [enableTTS, setEnableTTS] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load profiles and voices on component mount
  useEffect(() => {
    loadProfiles();
    loadVoices();
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  const loadProfiles = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const fetchedProfiles = await fetchNPCProfilePreviews();
      setProfiles(fetchedProfiles);
    } catch (error) {
      logger.error("Failed to load NPC profiles", { error });
      setState((prev) => ({ ...prev, error: "Failed to load NPC profiles" }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadVoices = () => {
    if (textToSpeechService) {
      const availableVoices = textToSpeechService.getAvailableVoices();
      setVoices(availableVoices);
      setSpeechSettings(textToSpeechService.getSettings());
    }
  };

  const selectProfile = async (profile: NPCProfilePreview) => {
    setState((prev) => ({
      ...prev,
      selectedProfile: profile,
      sessionId: null,
      messages: [],
      error: null,
      isLoading: true,
    }));

    try {
      // Start NPC test session
      const session = await startNPCTestSession(profile.id);

      setState((prev) => ({
        ...prev,
        sessionId: session.sessionId,
        isLoading: false,
        gameContext: session.character
          ? {
              character: session.character,
              characterTeam: session.characterTeam || "unknown",
              seatName: session.seatName || "Player",
              gameDay: session.gameDay || 1,
              aliveCount: session.aliveCount || 7,
            }
          : undefined,
      }));

      // Set recommended voice for this profile
      if (enableTTS) {
        const recommendedVoice =
          textToSpeechService.getRecommendedVoice(profile);
        if (recommendedVoice) {
          const newSettings = { ...speechSettings, voice: recommendedVoice };
          setSpeechSettings(newSettings);
          textToSpeechService.updateSettings(newSettings);
        }
      }

      // Add welcome message with game context
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "npc",
        content: `Hello! I'm ${profile.name}${session.character ? `, playing as the ${session.character}` : ""}. ${profile.description}${session.gameDay ? ` We're currently on Day ${session.gameDay} with ${session.aliveCount} players alive.` : ""} I'm ready to chat and demonstrate my personality in this Blood on the Clock Tower game context!`,
        timestamp: new Date(),
        profileName: profile.name,
      };

      setState((prev) => ({
        ...prev,
        messages: [welcomeMessage],
      }));

      // Speak welcome message
      if (enableTTS) {
        textToSpeechService.speak(welcomeMessage.content).catch((error) => {
          logger.warn("TTS failed", error);
        });
      }

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      logger.error("Failed to start NPC session:", { error });
      setState((prev) => ({
        ...prev,
        error: "Failed to start NPC session",
        isLoading: false,
      }));
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !state.selectedProfile || state.isTyping)
      return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: messageInput.trim(),
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));

    setMessageInput("");

    try {
      // Get real NPC response from backend
      if (!state.sessionId) {
        throw new Error("No active session");
      }

      const response = await sendMessageToNPC(state.sessionId, {
        profileId: state.selectedProfile!.id,
        message: userMessage.content,
        context: {},
      });

      const npcMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "npc",
        content: response.response,
        timestamp: new Date(),
        profileName: state.selectedProfile?.name,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, npcMessage],
        isTyping: false,
      }));

      // Speak the response
      if (enableTTS) {
        textToSpeechService.speak(response.response).catch((error) => {
          logger.warn("TTS failed", { error });
        });
      }
    } catch (error) {
      logger.error("Failed to get NPC response", { error });
      setState((prev) => ({
        ...prev,
        error: "Failed to get response from NPC",
        isTyping: false,
      }));
    }
  };

  const updateSpeechSettings = (newSettings: Partial<SpeechSettings>) => {
    const updated = { ...speechSettings, ...newSettings };
    setSpeechSettings(updated);
    textToSpeechService.updateSettings(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🤖 NPC Agent Testing Lab</h1>
          <p className="text-gray-300">
            Select an NPC character to test the enhanced AI agent system with
            logical fallacies, bluffing strategies, and fourth wall breaking
            capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Select NPC Character
              </h2>

              {state.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}

              {state.error && (
                <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4">
                  {state.error}
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => selectProfile(profile)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      state.selectedProfile?.id === profile.id
                        ? "bg-blue-600 border-blue-500"
                        : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                    } border`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{profile.avatar || "🤖"}</span>
                      <div className="flex-1">
                        <h3 className="font-medium">{profile.name}</h3>
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {profile.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              profile.difficulty === "beginner"
                                ? "bg-green-600"
                                : profile.difficulty === "intermediate"
                                  ? "bg-yellow-600"
                                  : profile.difficulty === "advanced"
                                    ? "bg-red-600"
                                    : "bg-gray-600"
                            }`}
                          >
                            {profile.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Settings */}
            {state.selectedProfile && (
              <div className="bg-gray-800 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  🔊 Voice Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enableTTS}
                        onChange={(e) => setEnableTTS(e.target.checked)}
                        className="rounded"
                      />
                      Enable Text-to-Speech
                    </label>
                  </div>

                  {enableTTS && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Voice
                        </label>
                        <select
                          value={speechSettings.voice}
                          onChange={(e) =>
                            updateSpeechSettings({ voice: e.target.value })
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                        >
                          {voices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                              {voice.name} ({voice.gender})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Rate: {speechSettings.rate.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={speechSettings.rate}
                          onChange={(e) =>
                            updateSpeechSettings({
                              rate: parseFloat(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Pitch: {speechSettings.pitch.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={speechSettings.pitch}
                          onChange={(e) =>
                            updateSpeechSettings({
                              pitch: parseFloat(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Volume: {speechSettings.volume.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={speechSettings.volume}
                          onChange={(e) =>
                            updateSpeechSettings({
                              volume: parseFloat(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {state.selectedProfile ? (
              <div className="bg-gray-800 rounded-lg h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="border-b border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {state.selectedProfile.avatar || "🤖"}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {state.selectedProfile.name}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {state.selectedProfile.description}
                      </p>
                    </div>
                  </div>

                  {/* Game Context Panel */}
                  {state.gameContext && (
                    <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">
                        🎲 Game Context
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Playing as:</span>
                          <span className="ml-1 font-medium text-white">
                            {state.gameContext.character}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Team:</span>
                          <span
                            className={`ml-1 font-medium ${
                              state.gameContext.characterTeam === "townsfolk"
                                ? "text-blue-300"
                                : state.gameContext.characterTeam === "demon" ||
                                    state.gameContext.characterTeam === "minion"
                                  ? "text-red-300"
                                  : "text-purple-300"
                            }`}
                          >
                            {state.gameContext.characterTeam}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Seat:</span>
                          <span className="ml-1 font-medium text-white">
                            {state.gameContext.seatName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Day:</span>
                          <span className="ml-1 font-medium text-yellow-300">
                            {state.gameContext.gameDay}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Players alive:</span>
                          <span className="ml-1 font-medium text-green-300">
                            {state.gameContext.aliveCount}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400 italic">
                        Try asking: "Did you wake up last night?", "What's your
                        role?", "Who should we vote for?"
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {state.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm px-4 py-2 rounded-lg ${
                          message.sender === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {state.isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-700 p-4">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                      disabled={state.isTyping}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || state.isTyping}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {state.gameContext ? (
                      <>
                        Game questions: "Did you wake up last night?", "What's
                        your role?", "Who should we vote for?", "Any information
                        to share?"
                      </>
                    ) : (
                      <>
                        Try asking about: personality, logical fallacies, game
                        strategy, or just chat!
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold mb-2">
                    Select an NPC Character
                  </h3>
                  <p className="text-gray-400">
                    Choose a character from the left panel to start testing the
                    AI agent
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NPCTestPage;
