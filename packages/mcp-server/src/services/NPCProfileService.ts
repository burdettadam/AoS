import type { NPCProfile } from "@ashes-of-salem/shared";
import type { MCPResponse, NPCBehaviorUpdate } from "../types/index.js";

export class NPCProfileService {
  private profiles = new Map<string, NPCProfile>();
  private behaviorOverrides = new Map<string, NPCBehaviorUpdate>();

  constructor() {
    this.initializeMockProfiles();
  }

  private initializeMockProfiles() {
    const mockProfiles: NPCProfile[] = [
      {
        id: "analytical-skeptic",
        name: "Analytical Skeptic",
        description:
          "Highly logical, questions everything, slow to trust claims",
        tags: ["analytical", "logical", "questioning"],
        personality: {
          chattiness: 0.6,
          suspicion: 0.8,
          boldness: 0.3,
          helpfulness: 0.7,
          deception: 0.2,
          leadership: 0.4,
          followership: 0.3,
          independence: 0.9,
          claimTiming: 0.8,
          voteConfidence: 0.7,
          informationSharing: 0.4,
        },
        behavior: {
          averageWordsPerMessage: 35,
          messagesPerPhase: 2,
          useEmojis: false,
          formalLanguage: true,
          decisionSpeed: "deliberate",
          changesMind: false,
          explainReasoning: true,
          preferredVotingStyle: "analytical",
          nominationTendency: "rare",
          claimStrategy: "late",
        },
        playStyle: {
          name: "Logical Analyzer",
          description: "Methodical approach to deduction",
          goodTeamStrategy: "information_gatherer",
          evilTeamStrategy: "quiet_saboteur",
        },
        difficulty: "intermediate",
        isCustom: false,
      },
      {
        id: "charismatic-manipulator",
        name: "Charismatic Manipulator",
        description: "Socially adept, influences others, may be deceptive",
        tags: ["charismatic", "social", "influential"],
        personality: {
          chattiness: 0.8,
          suspicion: 0.4,
          boldness: 0.8,
          helpfulness: 0.6,
          deception: 0.9,
          leadership: 0.9,
          followership: 0.2,
          independence: 0.7,
          claimTiming: 0.6,
          voteConfidence: 0.8,
          informationSharing: 0.7,
        },
        behavior: {
          averageWordsPerMessage: 45,
          messagesPerPhase: 4,
          useEmojis: true,
          formalLanguage: false,
          decisionSpeed: "quick",
          changesMind: true,
          explainReasoning: true,
          preferredVotingStyle: "aggressive",
          nominationTendency: "frequent",
          claimStrategy: "early",
        },
        playStyle: {
          name: "Social Leader",
          description: "Uses charisma to influence and lead",
          goodTeamStrategy: "social_leader",
          evilTeamStrategy: "charismatic_deceiver",
        },
        difficulty: "advanced",
        isCustom: false,
      },
    ];

    mockProfiles.forEach((profile) => {
      this.profiles.set(profile.id, profile);
    });
  }

  async getProfile(profileId: string): Promise<MCPResponse> {
    const profile = this.profiles.get(profileId);

    if (!profile) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Profile ${profileId} not found` }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(profile),
        },
      ],
    };
  }

  async listProfiles(category?: string): Promise<MCPResponse> {
    let profiles = Array.from(this.profiles.values());

    if (category) {
      profiles = profiles.filter((profile) =>
        profile.tags.includes(category.toLowerCase()),
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            profiles: profiles.map((profile) => ({
              id: profile.id,
              name: profile.name,
              description: profile.description,
              tags: profile.tags,
            })),
          }),
        },
      ],
    };
  }

  async updateBehavior(
    profileId: string,
    behaviors: NPCBehaviorUpdate,
  ): Promise<MCPResponse> {
    if (!this.profiles.has(profileId)) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Profile ${profileId} not found` }),
          },
        ],
      };
    }

    this.behaviorOverrides.set(profileId, behaviors);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            profileId,
            updatedBehaviors: behaviors,
          }),
        },
      ],
    };
  }
}
