# Scripts Directory

This directory contains various scripts used for development, data processing, and maintenance of the Blood on the Clocktower Digital project.

## Directory Structure

### Core Scripts (Root Level)

- **`analyze-code-simple.sh`** - Simple code analysis for complexity metrics
- **`analyze-code.sh`** - Comprehensive code analysis
- **`ensure-actions.ts`** - Ensures all characters have proper action definitions
- **`gen-ux-spec.ts`** - Generates UX specifications
- **`generate-quality-report.sh`** - Generates comprehensive quality reports for PRs
- **`lint-data.ts`** - Lints and validates data files
- **`setup-test-dirs.sh`** - Sets up test directories
- **`standardize-characters.ts`** - Standardizes character data format
- **`standardize-scripts.ts`** - Standardizes script data format
- **`test-all.sh`** - Runs all tests
- **`validate-data.ts`** - Validates data integrity

### `/utilities/`

Contains utility scripts that are actively used in development.

- **`download-artwork.js`** - Downloads character artwork from remote sources
- **`find-missing.js`** - Finds missing files or data
- **`resolve-lineup.js`** - Resolves game lineups (available as `botct-resolve` CLI command)
- **`run-enhanced-tb-test.js`** - Runs enhanced Trouble Brewing tests

## Usage

Most scripts can be run directly, but many are integrated into npm scripts in the root `package.json`:

```bash
# Data processing
npm run data:standardize          # Standardize character data
npm run data:standardize:scripts  # Standardize script data
npm run data:ensure:actions       # Ensure all characters have actions
npm run data:validate            # Validate data integrity
npm run data:lint                # Lint data files

# Code analysis
npm run analyze:complexity       # Run complexity analysis
npm run quality:full            # Full quality analysis
npm run quality:report          # Generate quality report

# CLI tools
npx botct-resolve               # Resolve game lineups
```

## Safe to Remove

The following files can be safely removed as they are backup files and the current TypeScript versions are working:

- All files in `/archived/` directory
- Migration scripts in `/data-migration/` (if migrations are complete)

## Dependencies

- Node.js scripts require `node` runtime
- TypeScript scripts require `ts-node` for execution
- Shell scripts require bash/zsh shell
