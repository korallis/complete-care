#!/bin/bash
set -e

echo "=== Complete Care: Environment Setup ==="

# Ensure bun is available
if ! command -v bun &> /dev/null; then
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Install dependencies
echo "Installing dependencies..."
bun install

# Check for .env.local
if [ ! -f .env.local ]; then
  echo "WARNING: .env.local not found. Copy .env.example and fill in credentials."
fi

# Generate Drizzle types if schema exists
if [ -d "src/lib/db/schema" ]; then
  echo "Generating database types..."
  bun run db:generate 2>/dev/null || true
fi

echo "=== Setup complete ==="
