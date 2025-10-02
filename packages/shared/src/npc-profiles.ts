import { z } from "zod";

// NPC Profile System
// Defines configurable AI agent personalities and behaviors

export const NPCPersonalityTraitSchema = z.object({
  // Core personality traits (0-1 scale)
  chattiness: z.number().min(0).max(1).default(0.5), // How often they speak
  suspicion: z.number().min(0).max(1).default(0.5), // How paranoid/cautious they are
  boldness: z.number().min(0).max(1).default(0.5), // Likelihood to make risky moves
  helpfulness: z.number().min(0).max(1).default(0.5), // How much they help teammates
  deception: z.number().min(0).max(1).default(0.5), // Skill at lying (for evil roles)

  // Social traits
  leadership: z.number().min(0).max(1).default(0.5), // Tendency to guide discussions
  followership: z.number().min(0).max(1).default(0.5), // Tendency to follow others' leads
  independence: z.number().min(0).max(1).default(0.5), // Makes decisions independently

  // Game-specific traits
  claimTiming: z.number().min(0).max(1).default(0.5), // When to reveal role (early vs late)
  voteConfidence: z.number().min(0).max(1).default(0.5), // How confident they are in votes
  informationSharing: z.number().min(0).max(1).default(0.5), // How freely they share info
});
export type NPCPersonalityTrait = z.infer<typeof NPCPersonalityTraitSchema>;

export const NPCBehaviorSettingsSchema = z.object({
  // Communication patterns
  averageWordsPerMessage: z.number().min(5).max(100).default(25),
  messagesPerPhase: z.number().min(0).max(10).default(3),
  useEmojis: z.boolean().default(true),
  formalLanguage: z.boolean().default(false),

  // Decision making
  decisionSpeed: z
    .enum(["instant", "quick", "deliberate", "slow"])
    .default("deliberate"),
  changesMind: z.boolean().default(true),
  explainReasoning: z.boolean().default(true),

  // Strategic preferences
  preferredVotingStyle: z
    .enum(["aggressive", "cautious", "analytical", "reactive"])
    .default("analytical"),
  nominationTendency: z
    .enum(["never", "rare", "normal", "frequent"])
    .default("normal"),
  claimStrategy: z
    .enum(["immediate", "early", "pressured", "late", "never"])
    .default("pressured"),
});
export type NPCBehaviorSettings = z.infer<typeof NPCBehaviorSettingsSchema>;

export const NPCPlayStyleSchema = z.object({
  name: z.string(),
  description: z.string(),

  // Good team preferences when assigned good roles
  goodTeamStrategy: z
    .enum([
      "information_gatherer", // Focuses on collecting and sharing info
      "social_leader", // Takes charge of discussions
      "quiet_observer", // Watches and analyzes quietly
      "protective_helper", // Focuses on protecting others
      "aggressive_hunter", // Actively hunts for evil
      "supportive_follower", // Supports other players' leads
    ])
    .default("information_gatherer"),

  // Evil team preferences when assigned evil roles
  evilTeamStrategy: z
    .enum([
      "charismatic_deceiver", // Uses charm and misdirection
      "quiet_saboteur", // Works behind the scenes
      "false_leader", // Pretends to lead town
      "paranoia_sower", // Creates chaos and distrust
      "information_hoarder", // Withholds crucial information
      "aggressive_bluffer", // Makes bold false claims
    ])
    .default("charismatic_deceiver"),
});
export type NPCPlayStyle = z.infer<typeof NPCPlayStyleSchema>;

export const NPCProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  avatar: z.string().optional(), // Avatar/icon for the profile

  // Core configuration
  personality: NPCPersonalityTraitSchema,
  behavior: NPCBehaviorSettingsSchema,
  playStyle: NPCPlayStyleSchema,

  // Metadata
  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .default("intermediate"),
  tags: z.array(z.string()).default([]), // e.g., ['aggressive', 'talkative', 'analytical']

  // Usage tracking (optional)
  timesUsed: z.number().default(0).optional(),
  winRate: z.number().min(0).max(1).optional(),

  // Customization
  isCustom: z.boolean().default(false), // User-created vs predefined
  createdBy: z.string().optional(), // Creator username
  createdAt: z.date().optional(),
});
export type NPCProfile = z.infer<typeof NPCProfileSchema>;

// Collection of NPC profiles for easy management
export const NPCProfileCollectionSchema = z.object({
  profiles: z.array(NPCProfileSchema),
  version: z.string().default("1.0.0"),
  lastUpdated: z.date().default(() => new Date()),
});
export type NPCProfileCollection = z.infer<typeof NPCProfileCollectionSchema>;

// Utility types for profile selection
export type NPCProfilePreview = Pick<
  NPCProfile,
  "id" | "name" | "description" | "avatar" | "difficulty" | "tags"
>;

export type NPCProfileCategory =
  | "all"
  | "aggressive"
  | "defensive"
  | "social"
  | "analytical"
  | "chaotic"
  | "supportive"
  | "beginner"
  | "advanced";
