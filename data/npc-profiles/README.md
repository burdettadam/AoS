# NPC Profile Collection

This directory contains enhanced NPC profiles for AI agents in Blood on the Clock Tower. Each profile defines comprehensive behavioral patterns, cognitive frameworks, and deception strategies.

## Profile Structure

Each profile includes:

### Core Components

- **Personality Traits**: 11 traits rated 0-1 (chattiness, suspicion, boldness, etc.)
- **Behavior Settings**: Communication style and game preferences
- **Play Style**: Strategic preferences for good/evil teams

### Enhanced Features

- **Cognitive Framework**: How the NPC processes information and makes decisions
- **Deception Patterns**: Lie frequency, preferred logical fallacies, truth-telling behaviors
- **Action Constraints**: Behavioral limits that restrict available actions

## Available Profiles

### Beginner Difficulty

- **naive-helper.json**: Trusting and cooperative, easy to manipulate but valuable teammate

### Intermediate Difficulty

- **paranoid-survivor.json**: Highly suspicious, good at detecting lies but poor at teamwork

### Advanced Difficulty

- **analytical-skeptic.json**: Evidence-based decision maker, methodical but can overthink

### Expert Difficulty

- **charismatic-manipulator.json**: Master of persuasion and misdirection
- **chaos-agent.json**: Unpredictable disruptor who thrives on confusion

## Profile Features

### Logical Fallacies

Each profile specifies preferred logical fallacies for deception:

- **Straw Man**: Misrepresenting opponent's arguments
- **Ad Hominem**: Attacking the person rather than their argument
- **Red Herring**: Introducing irrelevant information
- **Appeal to Emotion**: Using emotional manipulation
- **False Dilemma**: Presenting only two options when more exist
- **Bandwagon**: "Everyone else believes this"
- **Confirmation Bias**: Only accepting supporting evidence

### Cognitive Frameworks

- **Risk Tolerance**: How willing to take chances
- **Information Processing**: Analytical vs intuitive vs skeptical vs trusting
- **Decision Making**: Evidence-based vs emotion-based vs consensus-seeking vs independent
- **Possibility Framework**: How they evaluate scenario likelihood

### Action Constraints

Behavioral limits that shape available actions:

- Never nominates others
- Only votes with sufficient evidence
- Avoids early voting
- Requires group consensus
- Never changes votes once cast
- Only speaks when directly addressed
- Avoids conflict situations
- Must explain all actions taken

## Usage

These profiles work with the enhanced NPC action system that uses two-stage prompting:

1. **Action Selection**: AI chooses from filtered list of available actions based on profile constraints
2. **Action Execution**: AI receives contextual prompt template based on selected action and profile traits

This system removes ambiguity by giving AI agents clear choices and structured response formats while maintaining personality-driven variation in decision-making.

## Testing

Use these profiles to test different behavioral patterns:

- Information sharing vs hoarding
- Aggressive vs defensive play styles
- Truth-telling vs deception strategies
- Social vs analytical approaches
- Risk-seeking vs risk-averse decision making

Each profile should produce consistent, predictable behavior patterns while still allowing for tactical variation based on game state.
