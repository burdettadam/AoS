#!/bin/bash
# Create test-results directory structure
mkdir -p test-results/coverage
mkdir -p test-results/lighthouse
mkdir -p test-results/playwright
mkdir -p tests/ui/__screenshots__/baseline
mkdir -p tests/ui/__screenshots__/current
mkdir -p tests/ui/__screenshots__/diffs

echo "Test directory structure created!"