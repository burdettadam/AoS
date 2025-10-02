import { NPCProfile } from "./npc-profiles";

/**
 * A minimal, generic NPC profile intended as a starting point.
 * Edit values and duplicate this file to create new custom profiles.
 */
export const STARTER_NPC_PROFILE: NPCProfile = {
  id: "starter-generic",
  name: "Starter NPC",
  description: "A balanced, generic NPC profile you can modify.",
  avatar: "🧩",
  personality: {
    // Core personality (0 - 1)
    chattiness: 0.5, // 0 = almost never talks, 1 = talks a lot
    suspicion: 0.5, // 0 = trusts everyone, 1 = trusts no one
    boldness: 0.5, // 0 = avoids risk, 1 = takes big risks
    helpfulness: 0.5, // 0 = selfish, 1 = highly cooperative
    deception: 0.4, // 0 = always honest, 1 = constantly lies
    leadership: 0.5, // 0 = never leads, 1 = dominates discussions
    followership: 0.5, // 0 = ignores others, 1 = tends to follow others
    independence: 0.5, // 0 = relies on others, 1 = fully self-driven
    claimTiming: 0.5, // 0 = reveals role immediately, 1 = as late as possible
    voteConfidence: 0.5, // 0 = rarely votes / abstains, 1 = always votes decisively
    informationSharing: 0.5, // 0 = withholds info, 1 = shares freely
  },
  behavior: {
    averageWordsPerMessage: 25, // Typical length of messages
    messagesPerPhase: 3, // How many times they speak per day/night cycle
    useEmojis: true, // Adds light flavor
    formalLanguage: false, // Casual tone
    decisionSpeed: "deliberate", // 'instant' | 'quick' | 'deliberate' | 'slow'
    changesMind: true, // Can reconsider votes/statements
    explainReasoning: true, // Shares reasoning for actions
    preferredVotingStyle: "analytical", // 'aggressive' | 'cautious' | 'analytical' | 'reactive'
    nominationTendency: "normal", // 'never' | 'rare' | 'normal' | 'frequent'
    claimStrategy: "pressured", // 'immediate' | 'early' | 'pressured' | 'late' | 'never'
  },
  playStyle: {
    name: "Balanced",
    description: "Flexible, moderately talkative, and neutral in style.",
    goodTeamStrategy: "information_gatherer",
    evilTeamStrategy: "charismatic_deceiver",
  },
  difficulty: "beginner",
  tags: ["balanced", "starter", "generic"],
  isCustom: true,
  createdAt: new Date(),
  timesUsed: 0,
};

export default STARTER_NPC_PROFILE;
