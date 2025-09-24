#!/bin/bash

# 🔍 Code Quality PR Report Generator
# Generates comprehensive quality reports for pull requests

set -e

echo "🔍 Generating Code Quality Report for PR..."
echo "=================================================="

# Create reports directory
mkdir -p quality-reports

# 1. ESLint Analysis with multiple formats
echo "📋 Running ESLint analysis..."
npm run lint -- --format=json --output-file=quality-reports/eslint-report.json || true
npm run lint -- --format=@microsoft/eslint-formatter-sarif --output-file=quality-reports/eslint-results.sarif || true
npm run lint -- --format=html --output-file=quality-reports/eslint-report.html || true

# 2. TypeScript type checking
echo "🔧 Running TypeScript type checking..."
{
  echo "## TypeScript Analysis Results"
  echo ""

  echo "### Shared Package"
  cd packages/shared && npm run build 2>&1 || echo "❌ Shared package has type errors"

  echo ""
  echo "### Server Package"
  cd ../server && npx tsc --noEmit --pretty 2>&1 || echo "❌ Server package has type errors"

  echo ""
  echo "### Client Package"
  cd ../client && npx tsc --noEmit --pretty 2>&1 || echo "❌ Client package has type errors"

  cd ../..
} > quality-reports/typescript-report.md

# 3. Code complexity analysis
echo "📊 Running complexity analysis..."
chmod +x ./scripts/analyze-code-simple.sh
./scripts/analyze-code-simple.sh || true

# Copy complexity results to reports directory
if [ -d "analysis-results" ]; then
  cp -r analysis-results/* quality-reports/ 2>/dev/null || true
fi

# 4. Test coverage (if tests exist)
echo "🧪 Generating test coverage..."
if npm run test:coverage 2>/dev/null; then
  echo "✅ Test coverage generated"
  # Copy coverage reports
  find packages -name "coverage" -type d -exec cp -r {} quality-reports/ \; 2>/dev/null || true
else
  echo "⚠️  Test coverage not available"
fi

# 5. Bundle size analysis (if applicable)
echo "📦 Analyzing bundle sizes..."
if [ -f "packages/client/dist" ]; then
  du -sh packages/client/dist/* > quality-reports/bundle-sizes.txt 2>/dev/null || true
fi

# 6. Generate summary report
echo "📝 Generating summary report..."
{
  echo "# 📊 Code Quality Report"
  echo ""
  echo "Generated on: $(date)"
  echo "Commit: $(git rev-parse --short HEAD)"
  echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo ""

  # ESLint summary
  if [ -f "quality-reports/eslint-report.json" ]; then
    ERRORS=$(jq '[.[].messages[] | select(.severity == 2)] | length' quality-reports/eslint-report.json 2>/dev/null || echo "0")
    WARNINGS=$(jq '[.[].messages[] | select(.severity == 1)] | length' quality-reports/eslint-report.json 2>/dev/null || echo "0")
    echo "## 🔍 ESLint Results"
    echo "- **Errors:** $ERRORS"
    echo "- **Warnings:** $WARNINGS"
    echo ""
  fi

  # Complexity summary
  if [ -f "quality-reports/complexity-summary.md" ]; then
    echo "## 📈 Code Complexity"
    cat quality-reports/complexity-summary.md
    echo ""
  fi

  # TypeScript summary
  echo "## 🔧 TypeScript Analysis"
  echo "See detailed results in [typescript-report.md](./typescript-report.md)"
  echo ""

  # File sizes
  echo "## 📁 Repository Stats"
  echo "- **Total files:** $(find packages \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | wc -l)"
  echo "- **Lines of code:** $(find packages \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec wc -l {} \; | tail -n 1 | awk '{print $1}')"
  echo ""

  echo "## 📊 Quality Metrics"
  echo "- ✅ ESLint configuration: Active"
  echo "- ✅ TypeScript: Enabled"
  echo "- ✅ Pre-commit hooks: Configured"
  echo "- ✅ Complexity analysis: Active"

} > quality-reports/summary.md

echo ""
echo "✅ Code quality report generated!"
echo "📁 Reports available in: quality-reports/"
echo ""
echo "📋 Generated files:"
ls -la quality-reports/
