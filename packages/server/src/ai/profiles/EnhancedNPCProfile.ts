/**
 * Enhanced NPC Profile Extensions
 * Extends existing NPCProfile with additional behavioral patterns
 */

import { NPCProfile } from "@ashes-of-salem/shared";

// Enhanced profile extensions (not modifying core types yet)
export interface CognitiveFramework {
  riskTolerance: "risk_averse" | "balanced" | "risk_seeking";
  informationProcessing: "analytical" | "intuitive" | "skeptical" | "trusting";
  decisionMaking:
    | "evidence_based"
    | "emotion_based"
    | "consensus_seeking"
    | "independent";
  possibilityFramework: {
    evaluatesMultipleScenarios: boolean;
    pessimisticBias: number; // 0-1
    overconfidenceLevel: number; // 0-1
    anchorsToFirstImpression?: boolean;
    considersLowProbabilityEvents?: boolean;
  };
}

export interface DeceptionPatterns {
  lieFrequency:
    | "never"
    | "rarely"
    | "when_pressured"
    | "frequently"
    | "constantly";
  preferredFallacies: Array<
    | "straw_man"
    | "ad_hominem"
    | "false_dilemma"
    | "appeal_to_authority"
    | "red_herring"
    | "bandwagon"
    | "slippery_slope"
    | "confirmation_bias"
    | "hasty_generalization"
    | "appeal_to_emotion"
  >;
  truthTelling: {
    mixesTruthWithLies?: boolean;
    tellsTruthUnderPressure?: boolean;
    avoidsDirectLies?: boolean;
    usesOmission?: boolean;
  };
}

export interface ActionConstraints {
  neverNominates?: boolean;
  onlyVotesWithEvidence?: boolean;
  avoidsEarlyVoting?: boolean;
  requiresConsensus?: boolean;
  neverChangesVote?: boolean;
  onlySpeaksWhenSpokenTo?: boolean;
  avoidsConflict?: boolean;
  mustExplainActions?: boolean;
}

// Enhanced NPC Profile that extends the base profile
export interface EnhancedNPCProfile extends NPCProfile {
  cognitiveFramework?: CognitiveFramework;
  deceptionPatterns?: DeceptionPatterns;
  actionConstraints?: ActionConstraints;
}

// Helper to create enhanced profiles from existing profiles
export function enhanceProfile(
  baseProfile: NPCProfile,
  extensions: {
    cognitiveFramework?: CognitiveFramework;
    deceptionPatterns?: DeceptionPatterns;
    actionConstraints?: ActionConstraints;
  },
): EnhancedNPCProfile {
  return {
    ...baseProfile,
    ...extensions,
  };
}

// Default enhanced patterns for different personality types
export const defaultCognitiveFrameworks: Record<string, CognitiveFramework> = {
  analytical: {
    riskTolerance: "risk_averse",
    informationProcessing: "analytical",
    decisionMaking: "evidence_based",
    possibilityFramework: {
      evaluatesMultipleScenarios: true,
      pessimisticBias: 0.3,
      overconfidenceLevel: 0.2,
      anchorsToFirstImpression: false,
      considersLowProbabilityEvents: true,
    },
  },
  charismatic: {
    riskTolerance: "risk_seeking",
    informationProcessing: "intuitive",
    decisionMaking: "emotion_based",
    possibilityFramework: {
      evaluatesMultipleScenarios: true,
      pessimisticBias: 0.2,
      overconfidenceLevel: 0.8,
      anchorsToFirstImpression: false,
      considersLowProbabilityEvents: false,
    },
  },
  paranoid: {
    riskTolerance: "risk_averse",
    informationProcessing: "skeptical",
    decisionMaking: "independent",
    possibilityFramework: {
      evaluatesMultipleScenarios: true,
      pessimisticBias: 0.9,
      overconfidenceLevel: 0.1,
      anchorsToFirstImpression: true,
      considersLowProbabilityEvents: true,
    },
  },
  naive: {
    riskTolerance: "balanced",
    informationProcessing: "trusting",
    decisionMaking: "consensus_seeking",
    possibilityFramework: {
      evaluatesMultipleScenarios: false,
      pessimisticBias: 0.2,
      overconfidenceLevel: 0.3,
      anchorsToFirstImpression: true,
      considersLowProbabilityEvents: false,
    },
  },
};

export const defaultDeceptionPatterns: Record<string, DeceptionPatterns> = {
  honest: {
    lieFrequency: "never",
    preferredFallacies: ["appeal_to_emotion"],
    truthTelling: {
      mixesTruthWithLies: false,
      tellsTruthUnderPressure: true,
      avoidsDirectLies: true,
      usesOmission: false,
    },
  },
  manipulative: {
    lieFrequency: "frequently",
    preferredFallacies: [
      "ad_hominem",
      "appeal_to_emotion",
      "red_herring",
      "straw_man",
    ],
    truthTelling: {
      mixesTruthWithLies: true,
      tellsTruthUnderPressure: false,
      avoidsDirectLies: false,
      usesOmission: false,
    },
  },
  careful: {
    lieFrequency: "when_pressured",
    preferredFallacies: ["false_dilemma", "appeal_to_authority"],
    truthTelling: {
      mixesTruthWithLies: true,
      tellsTruthUnderPressure: false,
      avoidsDirectLies: true,
      usesOmission: true,
    },
  },
};

export default {
  enhanceProfile,
  defaultCognitiveFrameworks,
  defaultDeceptionPatterns,
};
