# Enhanced NPC Profile System - Implementation Summary

## Overview

I've designed and implemented a comprehensive enhancement to the NPC system for Blood on the Clock Tower that addresses the key requirements:

1. **Action Selection Ambiguity Removal**: Two-stage prompting system that gives AI clear action choices
2. **Profile-Driven Behavior**: Comprehensive personality traits with logical fallacies and cognitive frameworks
3. **Behavioral Consistency**: Structured templates ensure predictable but varied NPC behavior
4. **Testing Framework**: Validation tests for profile behavioral patterns

## Key Components Implemented

### 1. Enhanced Profile Schema (`schemas/enhanced-npc-profile.schema.json`)

Extended the existing NPC profile system with:

**Cognitive Framework:**

- Risk tolerance (risk_averse, balanced, risk_seeking)
- Information processing style (analytical, intuitive, skeptical, trusting)
- Decision making approach (evidence_based, emotion_based, consensus_seeking, independent)
- Possibility framework for scenario evaluation

**Deception Patterns:**

- Lie frequency levels (never → constantly)
- Preferred logical fallacies (10 types: straw_man, ad_hominem, red_herring, etc.)
- Truth-telling behaviors (when they mix truth with lies, avoid direct lies, etc.)

**Action Constraints:**

- Behavioral limits that filter available actions
- Examples: never nominates, only votes with evidence, avoids conflict

### 2. Two-Stage Action System (`packages/server/src/ai/templates/ActionSelectionSystem.ts`)

**Stage 1: Action Selection**

- AI receives filtered list of available actions based on profile constraints
- Clear prompt template with personality context
- Structured response format: PRIMARY_ACTION, CONFIDENCE, REASONING, ALTERNATIVES

**Stage 2: Action Execution**

- Context-specific prompt templates for each action type
- Profile-driven behavioral modifiers applied to prompts
- Fallacy patterns and truth-telling behaviors incorporated

**Action Types Supported:**

- speak, nominate, vote, claimRole, defend, askQuestion, pass
- Evil-specific: bluff, misdirect, witholdInformation
- Social: supportPlayer, suspectPlayer, buildAlliance

### 3. Profile-Driven Prompt Generator (`packages/server/src/ai/templates/EnhancedNPCPromptGenerator.ts`)

**Features:**

- Generates action selection prompts with profile filtering
- Creates contextual execution prompts based on selected action
- Incorporates logical fallacy preferences for deception
- Applies cognitive framework to decision-making context
- Enforces action constraints through available action filtering

**Behavioral Integration:**

- Risk tolerance affects nomination and voting decisions
- Information processing style shapes question asking and analysis
- Deception patterns influence truth-telling in claims and defenses
- Possibility framework affects scenario evaluation and paranoia levels

### 4. Example NPC Profiles (`data/npc-profiles/`)

Created 5 diverse archetypes for testing:

**analytical-skeptic.json** (Advanced)

- High suspicion, methodical, evidence-based
- Fallacies: false_dilemma, appeal_to_authority, hasty_generalization
- Constraints: only votes with evidence, must explain actions

**charismatic-manipulator.json** (Expert)

- High deception, persuasive, risk-seeking
- Fallacies: ad_hominem, appeal_to_emotion, red_herring, straw_man
- Lie frequency: frequently, mixes truth with lies

**paranoid-survivor.json** (Intermediate)

- Maximum suspicion, defensive, untrusting
- Constraints: never nominates, only speaks when spoken to
- Fallacies: slippery_slope, confirmation_bias

**naive-helper.json** (Beginner)

- High helpfulness, trusting, cooperative
- Never lies, seeks consensus, avoids conflict
- Simple behavioral patterns for new players

**chaos-agent.json** (Expert)

- Unpredictable, disruptive, high chattiness
- Multiple fallacies, frequent lies, no constraints
- Creates confusion that can help or hurt either team

### 5. Enhanced Types (`packages/server/src/ai/profiles/EnhancedNPCProfile.ts`)

**Backward Compatible Extensions:**

- `CognitiveFramework`, `DeceptionPatterns`, `ActionConstraints` interfaces
- `EnhancedNPCProfile` extends existing `NPCProfile`
- Helper functions to enhance existing profiles with new capabilities
- Default patterns for different personality archetypes

### 6. Testing Framework (`packages/server/__tests__/`)

**Profile Validation Tests:**

- Personality trait consistency (values 0-1, logical relationships)
- Behavioral pattern validation (chattiness → message frequency)
- Play style consistency (leadership → strategy matching)
- Difficulty calibration (beginner vs expert complexity)
- Comprehensive archetype coverage across personality spectrum

## How It Works

### Action Selection Process

1. **Context Analysis**: Game state, available players, current phase
2. **Profile Filtering**: Remove actions that violate constraints (e.g., "never nominates")
3. **Action Selection Prompt**: AI chooses from filtered actions with personality context
4. **Action Execution Prompt**: Context-specific template with behavioral modifiers
5. **Response Parsing**: Extract structured decision with reasoning

### Behavioral Consistency

**Personality Traits Drive Decisions:**

- Chattiness 0.9 → speaks frequently, gets multiple action options
- Suspicion 0.9 → high evidence requirements, paranoid interpretations
- Boldness 0.2 → avoids risky nominations, cautious voting

**Cognitive Frameworks Shape Reasoning:**

- Analytical processing → evidence-based prompts, multiple scenario evaluation
- Intuitive processing → emotion-based prompts, gut feeling emphasis
- Risk-averse → conservative options highlighted, low-probability concerns

**Deception Patterns Control Lies:**

- "frequently" lie frequency → evil actions favor misdirection
- Preferred fallacies → specific logical errors in reasoning
- Truth-telling behaviors → when to mix truth with lies vs avoid direct lies

### Profile Examples in Action

**Analytical Skeptic voting on nomination:**

```
You must vote with HIGH evidence requirement.
Evidence standard: high (only votes with evidence constraint)
Analyze likelihood nominee is evil: [percentage]
Consider multiple scenarios (evaluatesMultipleScenarios: true)
Pessimistic bias: 0.7 (tends toward negative interpretations)
```

**Charismatic Manipulator defending accusation:**

```
Defense strategies: EMOTIONAL_APPEAL, DEFLECTION, COUNTER_ATTACK
Fallacy preferences: ad_hominem, appeal_to_emotion, red_herring
Lie frequency: frequently (mix truth with lies: true)
Confidence: 8/10 (overconfidenceLevel: 0.8)
```

## Benefits Achieved

### 1. Ambiguity Removal

- AI gets clear action choices instead of open-ended prompts
- Structured response formats ensure parseable decisions
- Profile constraints filter impossible actions upfront

### 2. Behavioral Predictability

- Consistent personality expression across game phases
- Logical trait relationships prevent contradictory behavior
- Difficulty scaling through complexity management

### 3. Strategic Depth

- Evil NPCs use sophisticated deception patterns
- Good NPCs adapt information gathering to personality
- Team strategies align with individual traits

### 4. Player Experience

- Distinct, memorable NPC personalities
- Appropriate challenge levels for different skill tiers
- Educational value through reasoning explanations

## Integration Path

### Immediate Integration

1. Add enhanced profile types to shared package
2. Update NPC creation endpoints to accept enhanced profiles
3. Integrate action selection system with existing AI agent
4. Load example profiles from data directory

### Gradual Migration

1. Existing profiles continue working unchanged
2. New profiles use enhanced features
3. Migrate popular profiles to enhanced system over time
4. Add UI for profile selection with enhanced metadata

### Testing Strategy

1. Run behavioral validation tests on all profiles
2. A/B test enhanced vs traditional NPCs in games
3. Collect player feedback on NPC believability and challenge
4. Monitor win rates and player satisfaction across difficulty levels

## Future Enhancements

### Additional Fallacy Types

- Appeal to tradition, false cause, genetic fallacy
- Complexity scaling for expert players

### Dynamic Adaptation

- NPCs learn from successful strategies
- Personality drift based on game outcomes
- Meta-game awareness for expert difficulty

### Social Dynamics

- Alliance formation patterns
- Trust/distrust relationship modeling
- Group psychology behaviors

This enhanced NPC system provides the foundation for sophisticated, believable AI opponents that remove decision-making ambiguity while maintaining rich behavioral diversity through profile-driven personality expression.
