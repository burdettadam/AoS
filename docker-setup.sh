#!/bin/bash
set -euo pipefail
# Convenience script to run Docker setup from project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/docker" && ./docker-setup.sh