/**
 * Enhanced NPC Integration Tests
 * Tests backward-compatible enhanced NPC functionality
 */

import { STARTER_NPC_PROFILE } from "@botc/shared";
import {
  applyEnhancedBehavior,
  filterActionsForProfile,
  getEnhancedProperties,
  isEnhancedProfile,
} from "../src/ai/profiles/EnhancedNPCIntegration";

describe("Enhanced NPC Integration", () => {
  describe("Profile Detection", () => {
    test("identifies standard profile as not enhanced", () => {
      expect(isEnhancedProfile(STARTER_NPC_PROFILE)).toBe(false);
    });

    test("generates enhanced properties from standard profile", () => {
      const enhanced = getEnhancedProperties(STARTER_NPC_PROFILE);

      expect(enhanced.cognitiveFramework).toBeDefined();
      expect(enhanced.deceptionPatterns).toBeDefined();
      expect(enhanced.actionConstraints).toBeDefined();

      // Should derive from personality scores
      expect(enhanced.cognitiveFramework?.informationProcessing).toMatch(
        /analytical|intuitive/,
      );
      expect(enhanced.deceptionPatterns?.lieFrequency).toMatch(
        /never|rarely|sometimes|often|always/,
      );
    });
  });

  describe("Behavior Enhancement", () => {
    test("enhances prompts with cognitive framework", () => {
      const basePrompt = "You are an NPC in a game.";
      const enhanced = applyEnhancedBehavior(basePrompt, STARTER_NPC_PROFILE);

      expect(enhanced).toContain("Cognitive Approach:");
      expect(enhanced).toContain("Information Processing:");
      expect(enhanced).toContain("Decision Making:");
      expect(enhanced.length).toBeGreaterThan(basePrompt.length);
    });

    test("filters actions based on constraints", () => {
      const actions = ["speak", "nominate", "vote", "whisper"];
      const filtered = filterActionsForProfile(actions, STARTER_NPC_PROFILE);

      expect(Array.isArray(filtered)).toBe(true);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe("Enhanced Profile Support", () => {
    test("works with enhanced profile data", () => {
      const enhancedProfile = {
        ...STARTER_NPC_PROFILE,
        cognitiveFramework: {
          informationProcessing: "analytical",
          decisionMaking: "logical",
          riskTolerance: "cautious",
          possibilityFramework: "closed",
        },
        deceptionPatterns: {
          lieFrequency: "rarely",
          preferredFallacies: ["strawman"],
          truthTelling: {
            mixesTruthWithLies: false,
            avoidsDirectLies: true,
            usesOmission: true,
          },
        },
      };

      expect(isEnhancedProfile(enhancedProfile)).toBe(true);

      const enhanced = getEnhancedProperties(enhancedProfile);
      expect(enhanced.cognitiveFramework?.informationProcessing).toBe(
        "analytical",
      );
      expect(enhanced.deceptionPatterns?.lieFrequency).toBe("rarely");
    });
  });
});
