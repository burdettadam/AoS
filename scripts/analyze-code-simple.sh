#!/bin/bash

# Code Complexity and Quality Analysis Script
# Focuses on source code analysis, excluding build artifacts

set -e

echo "🔍 Starting comprehensive code analysis..."
echo "=========================================="

# Create output directory
mkdir -p analysis-results

# Create ESLint ignore file for build artifacts
cat > .eslintignore <<EOF
# Build directories
**/dist/**
**/build/**
**/node_modules/**
**/*.d.ts
**/*.min.js
**/coverage/**

# Keep source files only
!packages/*/src/**
EOF

# 1. ESLint Analysis on source files only
echo
echo "1. 📊 Running ESLint complexity analysis on source files..."
npx eslint "packages/*/src/**/*.{ts,tsx,js,jsx}" --format json > analysis-results/eslint-report.json 2>/dev/null || true
npx eslint "packages/*/src/**/*.{ts,tsx,js,jsx}" --format html > analysis-results/eslint-report.html 2>/dev/null || true

if [ -f "analysis-results/eslint-report.json" ]; then
    echo "  ✅ ESLint analysis complete"

    # Count complexity-related issues
    COMPLEXITY_ISSUES=$(grep -o '"ruleId":"complexity"' analysis-results/eslint-report.json | wc -l || echo "0")
    MAX_DEPTH_ISSUES=$(grep -o '"ruleId":"max-depth"' analysis-results/eslint-report.json | wc -l || echo "0")
    MAX_LINES_ISSUES=$(grep -o '"ruleId":"max-lines"' analysis-results/eslint-report.json | wc -l || echo "0")
    MAX_PARAMS_ISSUES=$(grep -o '"ruleId":"max-params"' analysis-results/eslint-report.json | wc -l || echo "0")

    echo "  📈 Complexity Issues Found:"
    echo "    - Functions with high complexity (>10): $COMPLEXITY_ISSUES"
    echo "    - Functions with deep nesting (>4): $MAX_DEPTH_ISSUES"
    echo "    - Files with too many lines (>300): $MAX_LINES_ISSUES"
    echo "    - Functions with too many parameters (>4): $MAX_PARAMS_ISSUES"
else
    echo "  ⚠️  ESLint analysis had issues"
fi

# 2. Generate Complexity Report Summary
echo
echo "2. 📋 Generating complexity report summary..."
cat > analysis-results/complexity-summary.md <<EOF
# Code Complexity Analysis Report

Generated on: $(date)

## Overview
This report provides an analysis of code complexity and quality issues in the Blood on the Clocktower Digital project.

## ESLint Complexity Analysis

### Key Metrics
- Functions with high complexity (>10): $COMPLEXITY_ISSUES
- Functions with deep nesting (>4): $MAX_DEPTH_ISSUES
- Files with too many lines (>300): $MAX_LINES_ISSUES
- Functions with too many parameters (>4): $MAX_PARAMS_ISSUES

### Analysis Focus Areas
- **Cyclomatic Complexity**: Functions exceeding complexity threshold of 10
- **Nesting Depth**: Code blocks nested deeper than 4 levels
- **File Length**: Files exceeding 300 lines
- **Parameter Count**: Functions with more than 4 parameters

## Recommendations
1. Break down complex functions into smaller, focused functions
2. Reduce nesting depth through early returns and guard clauses
3. Split large files into smaller, more cohesive modules
4. Consider using object parameters for functions with many parameters
5. Add unit tests for complex functions to ensure maintainability

## Files
- Detailed ESLint report: \`analysis-results/eslint-report.html\`
- Raw ESLint data: \`analysis-results/eslint-report.json\`

EOF

echo "  ✅ Complexity summary generated"

# 3. Quick complexity heuristics on TypeScript source files
echo
echo "3. 🎯 Quick complexity heuristics..."

# Count complex functions (rough heuristic)
COMPLEX_FUNCTIONS=$(find packages/*/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "if.*if.*if" | wc -l || echo "0")
LONG_LINES=$(find packages/*/src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}' || echo "0")
TOTAL_FILES=$(find packages/*/src -name "*.ts" -o -name "*.tsx" | wc -l || echo "0")

echo "  📊 Quick Analysis:"
echo "    - Total source files: $TOTAL_FILES"
echo "    - Total lines of source code: $LONG_LINES"
echo "    - Files with multiple nested conditions: $COMPLEX_FUNCTIONS"

# 4. Generate final report
echo
echo "4. 📄 Final Report"
echo "=================="
echo "Code quality analysis complete!"
echo
echo "📁 Generated files:"
echo "  - analysis-results/eslint-report.html (detailed HTML report)"
echo "  - analysis-results/eslint-report.json (machine-readable data)"
echo "  - analysis-results/complexity-summary.md (summary report)"
echo
echo "🎯 Key Findings:"
echo "  - Complexity violations: $COMPLEXITY_ISSUES"
echo "  - Deep nesting issues: $MAX_DEPTH_ISSUES"
echo "  - Oversized files: $MAX_LINES_ISSUES"
echo "  - Parameter count issues: $MAX_PARAMS_ISSUES"
echo

if [ "$COMPLEXITY_ISSUES" -gt "10" ]; then
    echo "⚠️  High number of complexity issues detected. Consider refactoring."
elif [ "$COMPLEXITY_ISSUES" -gt "5" ]; then
    echo "🔄 Moderate complexity issues. Room for improvement."
else
    echo "✅ Good complexity levels overall."
fi

echo
echo "✨ Analysis complete! Check the reports in analysis-results/"
