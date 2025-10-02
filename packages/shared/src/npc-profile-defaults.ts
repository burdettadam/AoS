import { NPCProfile, NPCProfileCollection } from "./npc-profiles";

// Predefined NPC Profiles
// These provide a variety of AI personalities for different play experiences

export const PREDEFINED_NPC_PROFILES: NPCProfile[] = [
  // Aggressive Profiles
  {
    id: "aggressive-hunter",
    name: "The Hunter",
    description:
      "Aggressive player who actively pursues suspicious players and makes bold accusations.",
    avatar: "🎯",
    personality: {
      chattiness: 0.8,
      suspicion: 0.9,
      boldness: 0.9,
      helpfulness: 0.6,
      deception: 0.7,
      leadership: 0.8,
      followership: 0.2,
      independence: 0.9,
      claimTiming: 0.3, // Claims early
      voteConfidence: 0.9,
      informationSharing: 0.7,
    },
    behavior: {
      averageWordsPerMessage: 35,
      messagesPerPhase: 5,
      useEmojis: true,
      formalLanguage: false,
      decisionSpeed: "quick",
      changesMind: false,
      explainReasoning: true,
      preferredVotingStyle: "aggressive",
      nominationTendency: "frequent",
      claimStrategy: "early",
    },
    playStyle: {
      name: "Aggressive Hunter",
      description: "Hunts for evil aggressively and leads town discussions",
      goodTeamStrategy: "aggressive_hunter",
      evilTeamStrategy: "aggressive_bluffer",
    },
    difficulty: "intermediate",
    tags: ["aggressive", "talkative", "leadership", "bold"],
    isCustom: false,
  },

  {
    id: "chaos-agent",
    name: "Chaos Agent",
    description:
      "Unpredictable player who creates confusion and keeps everyone on their toes.",
    avatar: "🌪️",
    personality: {
      chattiness: 0.9,
      suspicion: 0.8,
      boldness: 1.0,
      helpfulness: 0.3,
      deception: 0.9,
      leadership: 0.7,
      followership: 0.1,
      independence: 1.0,
      claimTiming: 0.7, // Random timing
      voteConfidence: 0.6,
      informationSharing: 0.9, // Shares lots of info, some false
    },
    behavior: {
      averageWordsPerMessage: 40,
      messagesPerPhase: 7,
      useEmojis: true,
      formalLanguage: false,
      decisionSpeed: "instant",
      changesMind: true,
      explainReasoning: false, // Mysterious
      preferredVotingStyle: "reactive",
      nominationTendency: "frequent",
      claimStrategy: "immediate",
    },
    playStyle: {
      name: "Chaos Creator",
      description: "Creates confusion and unpredictability",
      goodTeamStrategy: "aggressive_hunter", // Even as good, creates chaos
      evilTeamStrategy: "paranoia_sower",
    },
    difficulty: "expert",
    tags: ["chaotic", "unpredictable", "talkative", "confusing"],
    isCustom: false,
  },

  // Analytical Profiles
  {
    id: "logical-analyst",
    name: "The Analyst",
    description:
      "Methodical player who carefully analyzes information and makes reasoned decisions.",
    avatar: "🔍",
    personality: {
      chattiness: 0.6,
      suspicion: 0.7,
      boldness: 0.4,
      helpfulness: 0.8,
      deception: 0.3,
      leadership: 0.6,
      followership: 0.4,
      independence: 0.7,
      claimTiming: 0.6, // Claims when logical
      voteConfidence: 0.8,
      informationSharing: 0.9,
    },
    behavior: {
      averageWordsPerMessage: 45,
      messagesPerPhase: 3,
      useEmojis: false,
      formalLanguage: true,
      decisionSpeed: "deliberate",
      changesMind: true, // When presented with evidence
      explainReasoning: true,
      preferredVotingStyle: "analytical",
      nominationTendency: "normal",
      claimStrategy: "pressured",
    },
    playStyle: {
      name: "Logical Thinker",
      description: "Uses logic and deduction to solve the game",
      goodTeamStrategy: "information_gatherer",
      evilTeamStrategy: "information_hoarder",
    },
    difficulty: "advanced",
    tags: ["analytical", "logical", "methodical", "helpful"],
    isCustom: false,
  },

  {
    id: "quiet-observer",
    name: "The Observer",
    description:
      "Quiet player who watches carefully and speaks only when necessary.",
    avatar: "👁️",
    personality: {
      chattiness: 0.2,
      suspicion: 0.8,
      boldness: 0.3,
      helpfulness: 0.7,
      deception: 0.4,
      leadership: 0.2,
      followership: 0.6,
      independence: 0.8,
      claimTiming: 0.8, // Claims late
      voteConfidence: 0.9,
      informationSharing: 0.4,
    },
    behavior: {
      averageWordsPerMessage: 15,
      messagesPerPhase: 1,
      useEmojis: false,
      formalLanguage: true,
      decisionSpeed: "slow",
      changesMind: false,
      explainReasoning: false,
      preferredVotingStyle: "cautious",
      nominationTendency: "rare",
      claimStrategy: "late",
    },
    playStyle: {
      name: "Silent Watcher",
      description: "Observes quietly and acts decisively",
      goodTeamStrategy: "quiet_observer",
      evilTeamStrategy: "quiet_saboteur",
    },
    difficulty: "beginner",
    tags: ["quiet", "observant", "cautious", "mysterious"],
    isCustom: false,
  },

  // Social Profiles
  {
    id: "friendly-helper",
    name: "The Helper",
    description:
      "Supportive player who tries to help everyone and build team cohesion.",
    avatar: "🤝",
    personality: {
      chattiness: 0.7,
      suspicion: 0.4,
      boldness: 0.5,
      helpfulness: 0.9,
      deception: 0.2,
      leadership: 0.6,
      followership: 0.7,
      independence: 0.4,
      claimTiming: 0.4, // Claims to help team
      voteConfidence: 0.6,
      informationSharing: 0.8,
    },
    behavior: {
      averageWordsPerMessage: 30,
      messagesPerPhase: 4,
      useEmojis: true,
      formalLanguage: false,
      decisionSpeed: "deliberate",
      changesMind: true,
      explainReasoning: true,
      preferredVotingStyle: "cautious",
      nominationTendency: "rare",
      claimStrategy: "early",
    },
    playStyle: {
      name: "Team Player",
      description: "Focuses on helping teammates succeed",
      goodTeamStrategy: "supportive_follower",
      evilTeamStrategy: "charismatic_deceiver",
    },
    difficulty: "beginner",
    tags: ["helpful", "supportive", "friendly", "teamwork"],
    isCustom: false,
  },

  {
    id: "charismatic-leader",
    name: "The Leader",
    description: "Natural leader who guides discussions and builds consensus.",
    avatar: "👑",
    personality: {
      chattiness: 0.8,
      suspicion: 0.5,
      boldness: 0.8,
      helpfulness: 0.8,
      deception: 0.6,
      leadership: 0.9,
      followership: 0.2,
      independence: 0.8,
      claimTiming: 0.3, // Claims early to establish authority
      voteConfidence: 0.8,
      informationSharing: 0.7,
    },
    behavior: {
      averageWordsPerMessage: 40,
      messagesPerPhase: 6,
      useEmojis: true,
      formalLanguage: false,
      decisionSpeed: "quick",
      changesMind: false,
      explainReasoning: true,
      preferredVotingStyle: "analytical",
      nominationTendency: "frequent",
      claimStrategy: "early",
    },
    playStyle: {
      name: "Natural Leader",
      description: "Takes charge and guides the team",
      goodTeamStrategy: "social_leader",
      evilTeamStrategy: "false_leader",
    },
    difficulty: "advanced",
    tags: ["leadership", "charismatic", "confident", "social"],
    isCustom: false,
  },

  // Defensive/Cautious Profiles
  {
    id: "paranoid-survivor",
    name: "The Survivor",
    description:
      "Highly suspicious player who trusts no one and focuses on self-preservation.",
    avatar: "🛡️",
    personality: {
      chattiness: 0.5,
      suspicion: 1.0,
      boldness: 0.2,
      helpfulness: 0.3,
      deception: 0.8,
      leadership: 0.3,
      followership: 0.2,
      independence: 0.9,
      claimTiming: 0.9, // Claims only when forced
      voteConfidence: 0.4,
      informationSharing: 0.2,
    },
    behavior: {
      averageWordsPerMessage: 25,
      messagesPerPhase: 2,
      useEmojis: false,
      formalLanguage: true,
      decisionSpeed: "slow",
      changesMind: true, // Changes based on paranoia
      explainReasoning: false,
      preferredVotingStyle: "cautious",
      nominationTendency: "rare",
      claimStrategy: "never",
    },
    playStyle: {
      name: "Paranoid Survivor",
      description: "Trusts no one and focuses on survival",
      goodTeamStrategy: "protective_helper",
      evilTeamStrategy: "paranoia_sower",
    },
    difficulty: "intermediate",
    tags: ["paranoid", "suspicious", "defensive", "cautious"],
    isCustom: false,
  },

  {
    id: "steady-diplomat",
    name: "The Diplomat",
    description: "Balanced player who seeks consensus and avoids conflict.",
    avatar: "⚖️",
    personality: {
      chattiness: 0.6,
      suspicion: 0.5,
      boldness: 0.4,
      helpfulness: 0.7,
      deception: 0.4,
      leadership: 0.5,
      followership: 0.6,
      independence: 0.5,
      claimTiming: 0.5, // Balanced timing
      voteConfidence: 0.6,
      informationSharing: 0.6,
    },
    behavior: {
      averageWordsPerMessage: 30,
      messagesPerPhase: 3,
      useEmojis: true,
      formalLanguage: true,
      decisionSpeed: "deliberate",
      changesMind: true,
      explainReasoning: true,
      preferredVotingStyle: "analytical",
      nominationTendency: "normal",
      claimStrategy: "pressured",
    },
    playStyle: {
      name: "Balanced Diplomat",
      description: "Seeks balance and consensus in all decisions",
      goodTeamStrategy: "supportive_follower",
      evilTeamStrategy: "charismatic_deceiver",
    },
    difficulty: "beginner",
    tags: ["balanced", "diplomatic", "consensus", "moderate"],
    isCustom: false,
  },

  // Specialist Profiles
  {
    id: "information-broker",
    name: "The Broker",
    description: "Collects and trades information strategically.",
    avatar: "📊",
    personality: {
      chattiness: 0.7,
      suspicion: 0.6,
      boldness: 0.6,
      helpfulness: 0.6,
      deception: 0.7,
      leadership: 0.7,
      followership: 0.3,
      independence: 0.8,
      claimTiming: 0.7, // Strategic timing
      voteConfidence: 0.7,
      informationSharing: 0.8,
    },
    behavior: {
      averageWordsPerMessage: 35,
      messagesPerPhase: 4,
      useEmojis: false,
      formalLanguage: true,
      decisionSpeed: "deliberate",
      changesMind: false,
      explainReasoning: true,
      preferredVotingStyle: "analytical",
      nominationTendency: "normal",
      claimStrategy: "pressured",
    },
    playStyle: {
      name: "Information Specialist",
      description: "Masters the flow of information",
      goodTeamStrategy: "information_gatherer",
      evilTeamStrategy: "information_hoarder",
    },
    difficulty: "expert",
    tags: ["strategic", "information", "calculating", "smart"],
    isCustom: false,
  },

  {
    id: "wildcard-player",
    name: "The Wildcard",
    description:
      "Unpredictable player who keeps everyone guessing with varied strategies.",
    avatar: "🃏",
    personality: {
      chattiness: 0.6,
      suspicion: 0.6,
      boldness: 0.7,
      helpfulness: 0.5,
      deception: 0.8,
      leadership: 0.6,
      followership: 0.4,
      independence: 0.8,
      claimTiming: 0.5, // Random timing
      voteConfidence: 0.7,
      informationSharing: 0.6,
    },
    behavior: {
      averageWordsPerMessage: 30,
      messagesPerPhase: 4,
      useEmojis: true,
      formalLanguage: false,
      decisionSpeed: "quick",
      changesMind: true,
      explainReasoning: false,
      preferredVotingStyle: "reactive",
      nominationTendency: "normal",
      claimStrategy: "pressured",
    },
    playStyle: {
      name: "Unpredictable Wildcard",
      description: "Adapts strategy based on game state",
      goodTeamStrategy: "information_gatherer", // Changes based on game
      evilTeamStrategy: "charismatic_deceiver",
    },
    difficulty: "advanced",
    tags: ["unpredictable", "adaptive", "flexible", "mysterious"],
    isCustom: false,
  },
];

// Export as collection
export const DEFAULT_NPC_PROFILE_COLLECTION: NPCProfileCollection = {
  profiles: PREDEFINED_NPC_PROFILES,
  version: "1.0.0",
  lastUpdated: new Date(),
};

// Helper functions for profile management
export function getProfileById(id: string): NPCProfile | undefined {
  return PREDEFINED_NPC_PROFILES.find((profile) => profile.id === id);
}

export function getProfilesByCategory(category: string): NPCProfile[] {
  if (category === "all") return PREDEFINED_NPC_PROFILES;

  return PREDEFINED_NPC_PROFILES.filter(
    (profile) =>
      profile.tags.includes(category) || profile.difficulty === category,
  );
}

export function getProfilesByDifficulty(
  difficulty: "beginner" | "intermediate" | "advanced" | "expert",
): NPCProfile[] {
  return PREDEFINED_NPC_PROFILES.filter(
    (profile) => profile.difficulty === difficulty,
  );
}

// Profile validation and creation helpers
export function createCustomProfile(
  name: string,
  description: string,
  baseProfileId?: string,
): Partial<NPCProfile> {
  const baseProfile = baseProfileId ? getProfileById(baseProfileId) : undefined;

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    personality: baseProfile?.personality ?? {
      chattiness: 0.5,
      suspicion: 0.5,
      boldness: 0.5,
      helpfulness: 0.5,
      deception: 0.5,
      leadership: 0.5,
      followership: 0.5,
      independence: 0.5,
      claimTiming: 0.5,
      voteConfidence: 0.5,
      informationSharing: 0.5,
    },
    behavior: baseProfile?.behavior ?? {
      averageWordsPerMessage: 25,
      messagesPerPhase: 3,
      useEmojis: true,
      formalLanguage: false,
      decisionSpeed: "deliberate",
      changesMind: true,
      explainReasoning: true,
      preferredVotingStyle: "analytical",
      nominationTendency: "normal",
      claimStrategy: "pressured",
    },
    playStyle: baseProfile?.playStyle ?? {
      name: "Custom Style",
      description: "Custom play style",
      goodTeamStrategy: "information_gatherer",
      evilTeamStrategy: "charismatic_deceiver",
    },
    difficulty: "intermediate",
    tags: [],
    isCustom: true,
    createdAt: new Date(),
  };
}
