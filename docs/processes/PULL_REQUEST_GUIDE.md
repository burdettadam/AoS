# Pull Request Process Guide

## 🎯 Overview

This document outlines the complete pull request process for the Blood on the Clocktower Digital project, including automated quality checks, review guidelines, and best practices.

## 📋 PR Workflow

### 1. Before Creating a PR

**Preparation Checklist:**

- [ ] Create feature branch from `main`: `git checkout -b feature/your-feature-name`
- [ ] Ensure your code follows project standards
- [ ] Run local quality checks: `npm run quality:check`
- [ ] Test your changes locally: `npm test`
- [ ] Build successfully: `npm run build`

**Branch Naming Conventions:**

```
feature/new-awesome-feature     # New features
fix/bug-description            # Bug fixes
chore/update-dependencies      # Maintenance
docs/update-readme            # Documentation
refactor/improve-performance  # Code improvements
```

### 2. Creating the Pull Request

**PR Title Format:**

```
type: brief description

Examples:
feat: add voice chat integration
fix: resolve game state synchronization issue
chore: update TypeScript to v5.2
docs: improve API documentation
refactor: modularize action handlers
```

**PR Description Template:**

```markdown
## 🎯 What does this PR do?

Brief description of the changes

## 🔄 Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement

## 🧪 Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] UI changes tested across browsers

## 📋 Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated documentation where necessary
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works

## 📸 Screenshots (if applicable)

Add screenshots for UI changes

## 🔗 Related Issues

Closes #123
Fixes #456
```

### 3. Automated Quality Checks

Every PR automatically triggers comprehensive quality analysis:

#### **🔍 Code Quality Report**

- **ESLint Analysis**: Complexity rules, code standards, best practices
- **TypeScript Checking**: Type safety validation across packages
- **Code Complexity**: Automated analysis with configurable limits
- **Bundle Analysis**: Build size tracking and optimization hints

#### **📊 Quality Metrics Tracked**

- **Complexity Violations**: Functions exceeding complexity 10
- **File Size**: Files exceeding 300 lines (automatic failure)
- **Type Errors**: TypeScript compilation issues
- **Lint Errors**: ESLint rule violations
- **Test Coverage**: Coverage deltas and thresholds

#### **🤖 Automated Comments**

The PR will automatically receive:

- **Quality Summary**: Overview of all metrics
- **ESLint Annotations**: Inline comments on problematic code
- **Complexity Analysis**: Recommendations for improvements
- **Coverage Reports**: Test coverage changes

### 4. Review Process

#### **👥 Review Requirements**

- **Required Reviewers**: 1 maintainer approval minimum
- **Auto-Request**: Reviews automatically requested from CODEOWNERS
- **Quality Gates**: All automated checks must pass

#### **🔍 What Reviewers Look For**

**Code Quality:**

- Follows established patterns and conventions
- Appropriate abstractions and modularity
- Error handling and edge cases covered
- Performance considerations addressed

**Functionality:**

- Feature works as intended
- No breaking changes to existing functionality
- Proper integration with existing systems
- UI/UX consistency maintained

**Testing:**

- Adequate test coverage for new code
- Tests are meaningful and cover edge cases
- Manual testing verification for UI changes

**Documentation:**

- Code is self-documenting or well-commented
- README/docs updated for user-facing changes
- API changes documented

#### **📝 Review Response Guidelines**

**For Authors:**

- Address all review comments
- Push updates to the same branch
- Re-request review after making changes
- Respond to feedback constructively

**For Reviewers:**

- Provide specific, actionable feedback
- Explain the reasoning behind suggestions
- Approve when satisfied with changes
- Use conventional review comments:
  - `nit:` for minor style suggestions
  - `question:` for clarification requests
  - `suggestion:` for improvement ideas
  - `blocking:` for must-fix issues

### 5. Quality Gates & Requirements

#### **✅ Required Checks (Must Pass)**

- **Build Status**: All packages build successfully
- **Type Check**: No TypeScript errors
- **Lint Status**: No ESLint errors (warnings allowed)
- **Tests**: All test suites pass
- **Complexity**: No functions exceed complexity 10
- **File Size**: No files exceed 300 lines

#### **⚠️ Warning Checks (Informational)**

- **ESLint Warnings**: Should be addressed but don't block
- **Coverage Decrease**: Significant coverage drops flagged
- **Bundle Size**: Large bundle increases highlighted

#### **🚫 Automatic Failures**

- **Security Issues**: Vulnerabilities detected by scanning
- **Breaking Changes**: Unintentional API changes
- **Oversized Files**: Files exceeding line limits
- **High Complexity**: Functions with cyclomatic complexity > 10

### 6. Merge Process

#### **📋 Pre-Merge Checklist**

- [ ] All required reviews approved
- [ ] All automated checks passing
- [ ] No merge conflicts
- [ ] Feature branch up-to-date with main
- [ ] Quality report shows no critical issues

#### **🔀 Merge Options**

**Squash and Merge (Preferred):**

- Use for feature branches with multiple commits
- Creates clean linear history
- Maintains meaningful commit messages

**Regular Merge:**

- Use for important milestone branches
- Preserves detailed commit history
- Good for complex features with logical commit structure

**Rebase and Merge:**

- Use for simple, single-commit changes
- Maintains linear history without merge commits

#### **📝 Merge Commit Message**

```
feat: add voice chat integration (#123)

* Implement WebRTC voice chat functionality
* Add push-to-talk controls
* Update UI for voice controls
* Add comprehensive tests for voice features

Closes #45, #67
```

### 7. Post-Merge Process

#### **🧹 Cleanup**

- Delete feature branch after successful merge
- Update project board/issues if applicable
- Monitor for any deployment issues

#### **📊 Quality Tracking**

- Review quality metrics trends
- Address any new technical debt introduced
- Update documentation if needed

## ⚙️ Configuration Files

### **`.github/workflows/pr-quality-report.yml`**

Automated PR quality analysis workflow

### **`sonar-project.properties`**

SonarCloud configuration for code quality tracking

### **`.eslintrc.json`**

ESLint rules including complexity limits

### **`scripts/generate-quality-report.sh`**

Local quality report generation

## 🚀 Quick Commands

```bash
# Create feature branch
git checkout -b feature/my-feature

# Run full quality check
npm run quality:check

# Generate local quality report
npm run quality:report

# Test everything
npm test

# Build and verify
npm run build
```

## 📚 Related Documentation

- [Development Setup](../development/DEVELOPMENT.md)
- [Code Quality Standards](../development/CODE_QUALITY.md)
- [Architecture Guidelines](../architecture/design.md)
- [Testing Guide](../development/TESTING.md)

---

## 💡 Tips for Success

1. **Run Quality Checks Early**: Use `npm run quality:check` before pushing
2. **Small, Focused PRs**: Easier to review and less likely to conflict
3. **Descriptive Commits**: Help reviewers understand your changes
4. **Address Feedback Quickly**: Keep the review process moving
5. **Test Thoroughly**: Both automated and manual testing prevent issues

**Questions?** Check our [Development Guide](../development/DEVELOPMENT.md) or ask in the team chat!
