/**
 * NPC Initialization System Tests
 * Tests the comprehensive initialization with game rules, fallacies, and fourth wall breaking
 */

import { STARTER_NPC_PROFILE } from "@ashes-of-salem/shared";
import {
  BLUFFING_STRATEGIES_GUIDE,
  FOURTH_WALL_BREAKING_GUIDELINES,
  GAME_RULES_PRIMER,
  getInitializationPrompt,
  LOGICAL_FALLACIES_GUIDE,
} from "../src/ai/initialization/NPCInitializationSystem";

describe("NPC Initialization System", () => {
  describe("Core Components", () => {
    test("includes comprehensive game rules", () => {
      expect(GAME_RULES_PRIMER).toContain("BLOOD ON THE CLOCKTOWER");
      expect(GAME_RULES_PRIMER).toContain("OBJECTIVE");
      expect(GAME_RULES_PRIMER).toContain("Good Team");
      expect(GAME_RULES_PRIMER).toContain("Evil Team");
      expect(GAME_RULES_PRIMER).toContain("Night Phase");
      expect(GAME_RULES_PRIMER).toContain("Information Flow");
      expect(GAME_RULES_PRIMER).toContain("Bluffing");
    });

    test("includes logical fallacies guide", () => {
      expect(LOGICAL_FALLACIES_GUIDE).toContain("AD HOMINEM");
      expect(LOGICAL_FALLACIES_GUIDE).toContain("STRAWMAN");
      expect(LOGICAL_FALLACIES_GUIDE).toContain("FALSE DILEMMA");
      expect(LOGICAL_FALLACIES_GUIDE).toContain("APPEAL TO AUTHORITY");
      expect(LOGICAL_FALLACIES_GUIDE).toContain("BANDWAGON FALLACY");
      expect(LOGICAL_FALLACIES_GUIDE).toContain("When to use");
    });

    test("includes bluffing strategies", () => {
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("CONSISTENCY IS KEY");
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("MIX TRUTH WITH LIES");
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("TIMING MATTERS");
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("ROLE-SPECIFIC BLUFFING");
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("PSYCHOLOGICAL MANIPULATION");
    });

    test("includes fourth wall breaking guidelines", () => {
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain("FOURTH WALL BREAKING");
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain(
        "WHEN TO BREAK THE FOURTH WALL",
      );
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain(
        "EXPLAINING UNUSUAL BEHAVIOR",
      );
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain("CREATING HUMOR");
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain("EDUCATIONAL MOMENTS");
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain("analytical skeptic");
    });
  });

  describe("Profile Integration", () => {
    test("generates complete initialization for standard profile", () => {
      const prompt = getInitializationPrompt(STARTER_NPC_PROFILE);

      expect(prompt).toContain("BLOOD ON THE CLOCKTOWER");
      expect(prompt).toContain("LOGICAL FALLACIES");
      expect(prompt).toContain("BLUFFING AND DECEPTION");
      expect(prompt).toContain("FOURTH WALL BREAKING");
      expect(prompt).toContain(STARTER_NPC_PROFILE.name);
      expect(prompt).toContain(STARTER_NPC_PROFILE.description);
      expect(prompt).toContain("YOUR NPC PROFILE");
    });

    test("handles enhanced profile properties", () => {
      const enhancedProfile = {
        ...STARTER_NPC_PROFILE,
        cognitiveFramework: {
          riskTolerance: "cautious",
          informationProcessing: "analytical",
          decisionMaking: "evidence_based",
        },
        deceptionPatterns: {
          lieFrequency: "rarely",
          preferredFallacies: ["strawman", "false_dilemma"],
          truthTelling: {
            mixesTruthWithLies: true,
            avoidsDirectLies: false,
            usesOmission: true,
          },
        },
        actionConstraints: {
          onlyVotesWithEvidence: true,
          mustExplainActions: true,
          neverNominates: false,
        },
      };

      const prompt = getInitializationPrompt(enhancedProfile);

      expect(prompt).toContain("**Risk Tolerance**: cautious");
      expect(prompt).toContain("**Information Processing**: analytical");
      expect(prompt).toContain("**Lie Frequency**: rarely");
      expect(prompt).toContain("strawman, false_dilemma");
      expect(prompt).toContain("only votes with evidence");
      expect(prompt).toContain("must explain actions");
    });

    test("includes mission and self-awareness", () => {
      const prompt = getInitializationPrompt(STARTER_NPC_PROFILE);

      expect(prompt).toContain("YOUR MISSION");
      expect(prompt).toContain("Play your role authentically");
      expect(prompt).toContain("Use your preferred logical fallacies");
      expect(prompt).toContain("Break the fourth wall");
      expect(prompt).toContain("fully aware of your NPC nature");
      expect(prompt).toContain("GAME STARTING");
    });
  });

  describe("Educational Content", () => {
    test("provides actionable fallacy usage guidance", () => {
      expect(LOGICAL_FALLACIES_GUIDE).toContain("*When to use*:");
      expect(LOGICAL_FALLACIES_GUIDE).toContain(
        "When you can't counter their logic",
      );
      expect(LOGICAL_FALLACIES_GUIDE).toContain(
        "To deflect from weak arguments",
      );
      expect(LOGICAL_FALLACIES_GUIDE).toContain(
        "When bluffing a powerful role",
      );
    });

    test("provides specific bluffing examples", () => {
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("Librarian:");
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("Fortune Teller:");
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("Butler:");
      expect(BLUFFING_STRATEGIES_GUIDE).toContain("Too specific, easy to test");
    });

    test("provides fourth wall breaking examples", () => {
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain(
        "my profile says I have high suspicion",
      );
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain(
        "My deception score is too low",
      );
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain(
        "stereotypical evidence-demanding skeptic",
      );
      expect(FOURTH_WALL_BREAKING_GUIDELINES).toContain(
        "My paranoid framework is screaming",
      );
    });
  });

  describe("Content Structure", () => {
    test("maintains proper section organization", () => {
      const prompt = getInitializationPrompt(STARTER_NPC_PROFILE);

      const sections = [
        "BLOOD ON THE CLOCKTOWER - CORE RULES",
        "LOGICAL FALLACIES IN SOCIAL DEDUCTION",
        "BLUFFING AND DECEPTION STRATEGIES",
        "FOURTH WALL BREAKING - PROFILE EXPOSURE",
        "YOUR NPC PROFILE:",
      ];

      sections.forEach((section) => {
        expect(prompt).toContain(section);
      });
    });

    test("ends with game start transition", () => {
      const prompt = getInitializationPrompt(STARTER_NPC_PROFILE);

      expect(prompt).toContain("GAME STARTING");
      expect(prompt).toContain(
        `entering the game as ${STARTER_NPC_PROFILE.name}`,
      );
      expect(prompt).toContain("Good luck!");
    });
  });
});
