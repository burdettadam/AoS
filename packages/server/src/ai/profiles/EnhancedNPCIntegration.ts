/**
 * Enhanced NPC Integration
 * Provides backward-compatible enhanced NPC functionality that works with existing NPCProfile types
 */

import { NPCProfile } from "@ashes-of-salem/shared";

// Enhanced profile properties (optional extensions)
export interface EnhancedProfileExtensions {
  cognitiveFramework?: {
    informationProcessing:
      | "analytical"
      | "intuitive"
      | "systematic"
      | "chaotic";
    decisionMaking: "logical" | "emotional" | "impulsive" | "deliberate";
    riskTolerance: "cautious" | "moderate" | "bold" | "reckless";
    possibilityFramework: "open" | "closed" | "selective" | "paranoid";
  };
  deceptionPatterns?: {
    lieFrequency: "never" | "rarely" | "sometimes" | "often" | "always";
    preferredFallacies: string[];
    truthTelling: {
      mixesTruthWithLies: boolean;
      avoidsDirectLies: boolean;
      usesOmission: boolean;
    };
  };
  actionConstraints?: {
    neverNominates: boolean;
    onlyVotesWithEvidence: boolean;
    avoidsEarlyVoting: boolean;
    requiresConsensus: boolean;
    avoidsConflict: boolean;
    mustExplainActions: boolean;
  };
}

// Type guard to check if a profile has enhanced properties
export function isEnhancedProfile(
  profile: NPCProfile,
): profile is NPCProfile & EnhancedProfileExtensions {
  return (
    "cognitiveFramework" in profile ||
    "deceptionPatterns" in profile ||
    "actionConstraints" in profile
  );
}

// Safely get enhanced properties with defaults
export function getEnhancedProperties(
  profile: NPCProfile,
): EnhancedProfileExtensions {
  if (isEnhancedProfile(profile)) {
    return {
      cognitiveFramework: profile.cognitiveFramework,
      deceptionPatterns: profile.deceptionPatterns,
      actionConstraints: profile.actionConstraints,
    };
  }

  // Return defaults based on base profile personality
  return {
    cognitiveFramework: {
      informationProcessing:
        profile.personality.suspicion > 7 ? "analytical" : "intuitive",
      decisionMaking:
        profile.personality.boldness > 7 ? "impulsive" : "deliberate",
      riskTolerance:
        profile.personality.boldness > 8
          ? "bold"
          : profile.personality.boldness < 4
            ? "cautious"
            : "moderate",
      possibilityFramework:
        profile.personality.suspicion > 8 ? "paranoid" : "open",
    },
    deceptionPatterns: {
      lieFrequency:
        profile.personality.deception > 8
          ? "often"
          : profile.personality.deception > 5
            ? "sometimes"
            : "rarely",
      preferredFallacies: [],
      truthTelling: {
        mixesTruthWithLies: profile.personality.deception > 6,
        avoidsDirectLies: profile.personality.deception < 4,
        usesOmission:
          profile.personality.deception > 4 &&
          profile.personality.deception < 8,
      },
    },
    actionConstraints: {
      neverNominates: profile.personality.boldness < 3,
      onlyVotesWithEvidence: profile.personality.suspicion > 7,
      avoidsEarlyVoting: profile.personality.boldness < 5,
      requiresConsensus: profile.personality.followership > 7,
      avoidsConflict: profile.personality.helpfulness > 7,
      mustExplainActions: profile.personality.independence < 4,
    },
  };
}

// Enhanced behavior modifier for existing prompts
export function applyEnhancedBehavior(
  basePrompt: string,
  profile: NPCProfile,
): string {
  const enhanced = getEnhancedProperties(profile);

  let modifiedPrompt = basePrompt;

  // Add cognitive framework context
  if (enhanced.cognitiveFramework) {
    const framework = enhanced.cognitiveFramework;
    modifiedPrompt += `\n\nCognitive Approach:
- Information Processing: ${framework.informationProcessing}
- Decision Making: ${framework.decisionMaking}
- Risk Tolerance: ${framework.riskTolerance}
- Possibility Framework: ${framework.possibilityFramework}`;
  }

  // Add deception context
  if (enhanced.deceptionPatterns) {
    const deception = enhanced.deceptionPatterns;
    modifiedPrompt += `\n\nDeception Patterns:
- Lie Frequency: ${deception.lieFrequency}
- Mixes truth with lies: ${deception.truthTelling.mixesTruthWithLies}
- Avoids direct lies: ${deception.truthTelling.avoidsDirectLies}`;
  }

  // Add action constraints
  if (enhanced.actionConstraints) {
    const constraints = enhanced.actionConstraints;
    const activeConstraints = [];

    if (constraints.neverNominates)
      activeConstraints.push("Never nominates players");
    if (constraints.onlyVotesWithEvidence)
      activeConstraints.push("Only votes with clear evidence");
    if (constraints.avoidsEarlyVoting)
      activeConstraints.push("Avoids early voting");
    if (constraints.requiresConsensus)
      activeConstraints.push("Prefers group consensus");
    if (constraints.avoidsConflict)
      activeConstraints.push("Avoids direct conflict");
    if (constraints.mustExplainActions)
      activeConstraints.push("Must explain actions");

    if (activeConstraints.length > 0) {
      modifiedPrompt += `\n\nBehavioral Constraints:
${activeConstraints.map((c) => `- ${c}`).join("\n")}`;
    }
  }

  return modifiedPrompt;
}

// Action filtering based on profile (backward compatible)
export function filterActionsForProfile(
  availableActions: string[],
  profile: NPCProfile,
): string[] {
  const enhanced = getEnhancedProperties(profile);
  let filteredActions = [...availableActions];

  if (enhanced.actionConstraints?.neverNominates) {
    filteredActions = filteredActions.filter(
      (action) => !action.toLowerCase().includes("nominate"),
    );
  }

  if (
    enhanced.actionConstraints?.avoidsEarlyVoting &&
    availableActions.includes("vote")
  ) {
    // Logic would need game context to determine if it's "early"
    // For now, just reduce voting probability
  }

  return filteredActions;
}
