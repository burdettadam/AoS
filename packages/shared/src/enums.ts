// Game State Enums
export enum GamePhase {
  LOBBY = "lobby",
  SETUP = "setup",
  NIGHT = "night",
  DAY = "day",
  NOMINATION = "nomination",
  VOTE = "vote",
  EXECUTION = "execution",
  END = "end",
}

export const Alignment = {
  GOOD: "good",
  EVIL: "evil",
} as const;

export const RoleType = {
  TOWNSFOLK: "townsfolk",
  OUTSIDER: "outsider",
  MINION: "minion",
  DEMON: "demon",
  TRAVELLER: "traveller",
  FABLED: "fabled",
} as const;
