# First Night Instructions Update Summary

This document summarizes the updates made to scripts and characters with detailed first night instructions based on official Blood on the Clocktower game rules.

## Scripts Updated

### Major Official Scripts

#### Trouble Brewing (`trouble-brewing.json`)

- **Enhanced firstNight**: Added detailed step-by-step first night order with specific character actions
- **Added otherNights**: Complete other nights order for all characters
- **Added nightOrder**: Array of character IDs in proper night order
- **Enhanced setupNotes**: Detailed character selection and setup process

#### Bad Moon Rising (`bad-moon-rising.json`)

- **Enhanced firstNight**: BMR-specific first night order including protection mechanics
- **Added otherNights**: Complex night order with multiple deaths and protections
- **Added nightOrder**: Array for BMR night sequence
- **Enhanced setupNotes**: Focus on protection balance and death resolution

#### Sects & Violets (`sects-and-violets.json`)

- **Enhanced firstNight**: SV-specific order with information roles and Demon effects
- **Added otherNights**: Information-heavy night sequence with transformations
- **Added nightOrder**: Array for SV night sequence
- **Enhanced setupNotes**: Emphasis on information webs and character changes

### Custom Scripts

#### Ravenswood_data (`Ravenswood_data.json`)

- **Enhanced firstNight**: Simplified beginner-friendly first night order
- **Added otherNights**: Basic night sequence for minimal setup
- **Added nightOrder**: Simple night order array
- **Enhanced setupNotes**: Beginner-focused setup instructions

#### Greatest Hits (`greatest-hits.json`)

- **Enhanced firstNight**: Cross-edition first night order with precedence rules
- **Added otherNights**: Mixed edition night sequence guidelines
- **Added nightOrder**: Cross-edition character precedence
- **Enhanced setupNotes**: Cross-edition compatibility instructions

## Characters Updated

### Information Gathering Characters

#### Clockmaker (`clockmaker.json`)

- **Added firstNight**: "1" (first priority)
- **Enhanced howToRun**: Step-by-step first night instructions
- **Added firstNightDescription**: Clear description of counting steps between Demon and Minion

#### Dreamer (`dreamer.json`)

- **Added firstNight**: "1" (acts on first night)
- **Added otherNights**: "2" (continues other nights)
- **Enhanced howToRun**: Instructions for showing good/evil character tokens
- **Added firstNightDescription**: Clear description of character selection process

#### Grandmother (`grandmother.json`)

- **Added firstNight**: "1" (first night action)
- **Enhanced howToRun**: Instructions for selecting grandchild
- **Added firstNightDescription**: Clear description of grandchild selection

## Schema Updates

### Script Schema (`script.schema.json`)

- **Added otherNights**: String field for other nights instructions
- **Added nightOrder**: Array field for character night order

## Key Improvements

1. **Detailed Night Orders**: Each major script now has comprehensive first night and other nights instructions
2. **Character Precedence**: Proper ordering of character abilities based on official rules
3. **Setup Instructions**: Detailed setup notes for each script type
4. **Cross-Edition Support**: Guidelines for mixing characters from different editions
5. **Character Actions**: Individual characters now have proper first night timing and descriptions

## Files Modified

### Scripts

- `data/scripts/trouble-brewing.json`
- `data/scripts/bad-moon-rising.json`
- `data/scripts/sects-and-violets.json`
- `data/scripts/Ravenswood_data.json`
- `data/scripts/greatest-hits.json`

### Characters

- `data/characters/clockmaker.json`
- `data/characters/dreamer.json`
- `data/characters/grandmother.json`

### Schemas

- `schemas/script.schema.json`

## Based On

These updates are based on official Blood on the Clocktower game rules and the board game reference materials. The night orders follow the official precedence and timing established in the base game editions.

## Next Steps

- Continue updating remaining characters with missing first night descriptions
- Add more detailed setup instructions to custom scripts
- Validate all night orders against official game references
- Consider adding visual night order references for storytellers
