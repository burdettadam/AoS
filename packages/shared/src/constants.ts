// Game Constants
export const GAME_CONSTANTS = {
  MIN_PLAYERS: 5,
  MAX_PLAYERS: 20,
  VOTE_TIMEOUT_MS: 30000,
  NOMINATION_TIMEOUT_MS: 60000,
  NIGHT_PHASE_TIMEOUT_MS: 120000,
  MAX_WHISPER_DISTANCE: 2
} as const;

// Scoring Weights
export const SCORING_WEIGHTS = {
  INFORMATION_GAIN: 0.35,
  CONTROL_BALANCE: 0.25,
  TIME_CUSHION: 0.20,
  REDUNDANCY_ROBUSTNESS: 0.15,
  VOLATILITY: 0.05
} as const;

// Role Values for Information Scoring
export const ROLE_INFO_VALUES = {
  'undertaker': 3,
  'empath': 2,
  'fortune-teller': 1.5,
  'investigator': 2,
  'librarian': 1.5,
  'chef': 1,
  'washerwoman': 2,
  'steward': 1
} as const;

// Default Script IDs
export const SCRIPTS = {
  TROUBLE_BREWING: 'trouble-brewing',
  SECTS_AND_VIOLETS: 'sects-and-violets',
  BAD_MOON_RISING: 'bad-moon-rising'
} as const;
