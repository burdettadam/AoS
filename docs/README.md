# Documentation Index

Welcome to the Blood on the Clocktower Digital documentation! This guide will help you find the information you need.

## 🚀 Getting Started

- **[README](../README.md)** - Project overview and quick start
- **[Development Setup](development/DEVELOPMENT.md)** - Complete development environment setup
- **[Monorepo Setup](development/MONOREPO_SETUP.md)** - Understanding the project structure

## 🏗️ Architecture

- **[System Design](architecture/design.md)** - Core architecture and patterns
- **[Game Architecture Proposal](architecture/Game%20architecture%20proposal.pdf)** - High-level system design
- **[UX Design](architecture/Game%20ux%20design.pdf)** - User experience design document
- **[Action System](architecture/ACTION_SYSTEM_SUMMARY.md)** - Game action system overview
- **[Game Action Refactoring](architecture/GAME_ACTION_SYSTEM_REFACTORING.md)** - Action system improvements
- **[Meta Actions](architecture/META_ACTIONS_UPDATE.md)** - Meta-action system documentation

## 👨‍💻 Development

- **[Development Guide](development/DEVELOPMENT.md)** - Comprehensive development setup
- **[TypeScript Implementation](development/TYPESCRIPT_DATA_IMPLEMENTATION.md)** - TypeScript patterns and practices
- **[Code Quality Standards](processes/CODE_QUALITY.md)** - Quality metrics and standards
- **[Pull Request Guide](processes/PULL_REQUEST_GUIDE.md)** - Complete PR process documentation

## 🚀 Deployment

- **[Docker Setup](deployment/DOCKER_README.md)** - Container deployment guide

## ✨ Features

- **[Journal Feature](features/JOURNAL_FEATURE_SUMMARY.md)** - Game journal system
- **[Public Games](features/PUBLIC_GAMES_IMPLEMENTATION.md)** - Public game functionality
- **[Keycloak Theme](features/KEYCLOAK_THEME_IMPLEMENTATION.md)** - Authentication theme customization
- **[Playwright Tests](features/PLAYWRIGHT_TESTS.md)** - UI testing framework

## 🔄 Migration & Updates

- **[Character Migration](migration/CHARACTER_MIGRATION_GUIDE.md)** - Character data migration
- **[Data Migration](migration/DATA_MIGRATION_README.md)** - General data migration guide
- **[Migration Status](migration/MIGRATION_STATUS.md)** - Current migration progress
- **[First Night Updates](migration/FIRST_NIGHT_UPDATES.md)** - First night mechanics updates

## 📋 Processes

- **[Pull Request Guide](processes/PULL_REQUEST_GUIDE.md)** - Complete PR workflow
- **[Code Quality Standards](processes/CODE_QUALITY.md)** - Quality metrics and tools

## 🔧 Quick Reference

### Common Commands

```bash
# Development
npm run dev                    # Start development servers
npm run build                  # Build all packages
npm test                       # Run all tests

# Quality
npm run quality:check          # Full quality analysis
npm run quality:report         # Generate quality report
npm run lint                   # ESLint validation
npm run format                 # Prettier formatting

# Docker
npm run docker:up              # Start Docker services
npm run docker:down            # Stop Docker services
npm run docker:logs            # View Docker logs
```

### Project Structure

```
botct/
├── packages/
│   ├── client/               # React frontend
│   ├── server/               # Node.js backend
│   └── shared/               # Shared types & utilities
├── docs/                     # Documentation (you are here!)
├── scripts/                  # Build & utility scripts
├── tests/                    # End-to-end tests
└── docker/                   # Docker configuration
```

## 🆘 Getting Help

### For Developers

1. Check the relevant documentation section above
2. Look at existing code patterns in the codebase
3. Review automated PR feedback for guidance
4. Ask questions in team discussions

### For New Contributors

1. Start with [Development Setup](development/DEVELOPMENT.md)
2. Read the [Pull Request Guide](processes/PULL_REQUEST_GUIDE.md)
3. Review [Code Quality Standards](processes/CODE_QUALITY.md)
4. Look at recent PRs for examples

### For Architecture Questions

1. Review [System Design](architecture/design.md)
2. Check architecture documents in `/architecture`
3. Look at implementation patterns in existing code

### For Deployment Issues

1. Check [Docker Setup](deployment/DOCKER_README.md)
2. Review CI/CD workflows in `.github/workflows/`
3. Check environment configuration files

## 📝 Contributing to Documentation

Help keep our documentation up-to-date:

1. **Found outdated info?** Create a PR with updates
2. **Missing documentation?** Add new guides following existing patterns
3. **Unclear instructions?** Improve clarity and add examples
4. **New features?** Document them in the appropriate section

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Add table of contents for long documents
- Link to related documentation
- Keep formatting consistent

---

**Need something not covered here?** Check the [README](../README.md) or create an issue to request new documentation!
