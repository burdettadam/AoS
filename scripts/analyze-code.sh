#!/bin/bash
set -e

echo "🔍 Running comprehensive code quality and complexity analysis..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "${BLUE}[SECTION]${NC} $1"
}

# Create reports directory
mkdir -p reports/{complexity,lint,format}

print_section "1. Code Linting Analysis"
print_status "Running ESLint with complexity rules..."
npx eslint packages --ext .ts,.tsx,.js,.jsx --format=json --output-file=reports/lint/eslint-report.json || true
npx eslint packages --ext .ts,.tsx,.js,.jsx --format=html --output-file=reports/lint/eslint-report.html || true

# Show summary
if command -v jq > /dev/null 2>&1; then
    ERRORS=$(jq '[.[].messages[] | select(.severity == 2)] | length' reports/lint/eslint-report.json)
    WARNINGS=$(jq '[.[].messages[] | select(.severity == 1)] | length' reports/lint/eslint-report.json)
    echo -e "  📊 ESLint Results: ${RED}${ERRORS} errors${NC}, ${YELLOW}${WARNINGS} warnings${NC}"
fi

print_section "2. Code Formatting Check"
print_status "Checking code formatting with Prettier..."
npx prettier --check "packages/**/*.{ts,tsx,js,jsx,json,md}" > reports/format/prettier-check.txt 2>&1 || {
    print_warning "Formatting issues found. Run 'npm run format' to fix."
}

print_section "3. Cyclomatic Complexity Analysis"
print_status "Analyzing cyclomatic complexity..."

# Create TypeScript complexity report
npx ts-complex --output=reports/complexity/typescript-complexity.json packages || {
    print_warning "TypeScript complexity analysis failed. Installing fallback..."
    npm install -g typescript-complexity-report 2>/dev/null || true
}

# Alternative complexity analysis using Plato (JavaScript/TypeScript)
print_status "Running Plato complexity analysis..."
npx plato -r -d reports/complexity/plato packages || {
    print_warning "Plato analysis failed. Continuing..."
}

print_section "4. Custom Complexity Metrics"
print_status "Generating custom complexity report..."

# Create a custom complexity analysis script
cat > reports/complexity/custom-analysis.js << 'EOF'
const fs = require('fs');
const path = require('path');

const results = {
  summary: {
    totalFiles: 0,
    avgComplexity: 0,
    highComplexityFiles: [],
    longFiles: [],
    functionsWithManyParams: []
  },
  details: []
};

function analyzeFile(filePath) {
  if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Count lines (excluding comments and blank lines)
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    }).length;

    // Simple complexity heuristics
    const cyclomaticMarkers = (content.match(/if|while|for|catch|switch|case|\?\?|\|\||&&/g) || []).length;
    const functions = (content.match(/function\s+\w+|=>\s*{|=\s*\([^)]*\)\s*=>/g) || []).length;

    const fileAnalysis = {
      file: path.relative(process.cwd(), filePath),
      lines: codeLines,
      complexity: cyclomaticMarkers,
      functions: functions,
      avgComplexityPerFunction: functions > 0 ? Math.round(cyclomaticMarkers / functions * 100) / 100 : 0
    };

    results.details.push(fileAnalysis);
    results.summary.totalFiles++;

    if (codeLines > 300) {
      results.summary.longFiles.push({ file: fileAnalysis.file, lines: codeLines });
    }

    if (fileAnalysis.complexity > 15) {
      results.summary.highComplexityFiles.push({
        file: fileAnalysis.file,
        complexity: fileAnalysis.complexity
      });
    }

  } catch (error) {
    console.warn(`Warning: Could not analyze ${filePath}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !['node_modules', 'dist', 'build', 'coverage'].includes(file)) {
      walkDirectory(fullPath);
    } else if (stat.isFile()) {
      analyzeFile(fullPath);
    }
  }
}

// Analyze packages directory
walkDirectory('packages');

// Calculate averages
if (results.summary.totalFiles > 0) {
  const totalComplexity = results.details.reduce((sum, file) => sum + file.complexity, 0);
  results.summary.avgComplexity = Math.round(totalComplexity / results.summary.totalFiles * 100) / 100;
}

// Sort high complexity files
results.summary.highComplexityFiles.sort((a, b) => b.complexity - a.complexity);
results.summary.longFiles.sort((a, b) => b.lines - a.lines);

// Write results
fs.writeFileSync('reports/complexity/custom-report.json', JSON.stringify(results, null, 2));

console.log('📊 Complexity Analysis Complete:');
console.log(`  📁 Total Files Analyzed: ${results.summary.totalFiles}`);
console.log(`  🧮 Average Complexity: ${results.summary.avgComplexity}`);
console.log(`  ⚠️  High Complexity Files: ${results.summary.highComplexityFiles.length}`);
console.log(`  📏 Long Files (>300 lines): ${results.summary.longFiles.length}`);

if (results.summary.highComplexityFiles.length > 0) {
  console.log('\n🔥 Most Complex Files:');
  results.summary.highComplexityFiles.slice(0, 5).forEach(file => {
    console.log(`    ${file.file}: ${file.complexity}`);
  });
}
EOF

node reports/complexity/custom-analysis.js

print_section "5. Bundle Size Analysis"
if [ -d "packages/client/dist" ]; then
    print_status "Analyzing bundle size..."
    cd packages/client
    npx vite-bundle-analyzer dist --mode json > ../../reports/complexity/bundle-analysis.json 2>/dev/null || {
        print_warning "Bundle analysis requires built client. Run 'npm run build:client' first."
    }
    cd ../..
else
    print_warning "Client not built. Skipping bundle analysis."
fi

print_section "6. Summary Report"
print_status "Generating comprehensive summary..."

cat > reports/complexity/README.md << EOF
# Code Quality & Complexity Report

Generated on: $(date)

## Overview
This report provides comprehensive analysis of code quality, complexity, and maintainability metrics for the BotC Digital project.

## Reports Generated

### 1. ESLint Analysis
- **Location**: \`reports/lint/\`
- **Files**: \`eslint-report.html\`, \`eslint-report.json\`
- **Purpose**: Code quality issues, style violations, and complexity warnings

### 2. Prettier Format Check
- **Location**: \`reports/format/\`
- **Files**: \`prettier-check.txt\`
- **Purpose**: Code formatting consistency

### 3. Complexity Analysis
- **Location**: \`reports/complexity/\`
- **Files**: Various complexity reports and metrics
- **Purpose**: Cyclomatic complexity, maintainability index, and structural analysis

## Key Metrics to Monitor

### Complexity Thresholds
- **Cyclomatic Complexity**: < 10 (warning at 10+)
- **Lines per File**: < 300 (warning at 300+)
- **Parameters per Function**: < 4 (warning at 4+)
- **Statements per Function**: < 20 (warning at 20+)

### Quality Gates
- **ESLint Errors**: 0 (must be 0 for production)
- **ESLint Warnings**: < 50 (target for continuous improvement)
- **Formatting Issues**: 0 (must be consistent)

## Actions Required

Run these commands to address issues:
\`\`\`bash
# Fix auto-fixable ESLint issues
npm run lint:fix

# Format code consistently
npm run format

# Re-run analysis
npm run analyze
\`\`\`

## CI/CD Integration

This analysis runs automatically on:
- Pre-commit hooks (basic linting/formatting)
- Pull requests (full analysis)
- Main branch pushes (with reporting)

EOF

print_status "✅ Analysis complete!"
echo ""
echo "📋 Reports generated in ./reports/"
echo "   📊 View HTML reports by opening:"
echo "      - reports/lint/eslint-report.html"
echo "      - reports/complexity/plato/index.html (if available)"
echo ""
echo "📈 Key metrics:"

if [ -f "reports/complexity/custom-report.json" ]; then
    if command -v jq > /dev/null 2>&1; then
        TOTAL_FILES=$(jq '.summary.totalFiles' reports/complexity/custom-report.json)
        AVG_COMPLEXITY=$(jq '.summary.avgComplexity' reports/complexity/custom-report.json)
        HIGH_COMPLEXITY=$(jq '.summary.highComplexityFiles | length' reports/complexity/custom-report.json)
        LONG_FILES=$(jq '.summary.longFiles | length' reports/complexity/custom-report.json)

        echo "   📁 Files analyzed: $TOTAL_FILES"
        echo "   🧮 Average complexity: $AVG_COMPLEXITY"
        echo "   ⚠️  High complexity files: $HIGH_COMPLEXITY"
        echo "   📏 Long files (>300 lines): $LONG_FILES"
    fi
fi

echo ""
print_status "Use 'npm run lint:fix' and 'npm run format' to address issues."
