#!/bin/bash
# Scan staged files for leaked secrets before commit.
# Catches: private keys (hex), AWS keys, API tokens, etc.

SECRETS_FOUND=0

# Patterns that should never appear in committed code
PATTERNS=(
  # Ethereum/EVM private keys (64 hex chars, often prefixed)
  '["\x27]?[0-9a-fA-F]{64}["\x27]?'
  # AWS keys
  'AKIA[0-9A-Z]{16}'
  # Generic secret/password assignments with values
  '(SECRET|PASSWORD|PRIVATE_KEY)\s*=\s*["\x27][^\s"'\'']{8,}'
  # JWT tokens
  'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.'
)

# Files to exclude from scanning
EXCLUDES="node_modules|\.lock$|pnpm-lock|package-lock|\.svg$|\.png$|\.ico$"

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -vE "$EXCLUDES")

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(echo "$STAGED_FILES" | xargs grep -lnE "$pattern" 2>/dev/null | grep -v "check-secrets.sh" | grep -v ".env.example")
  if [ -n "$MATCHES" ]; then
    echo "⚠️  Potential secret detected matching pattern:"
    echo "   $pattern"
    echo ""
    echo "$STAGED_FILES" | xargs grep -nE "$pattern" 2>/dev/null | grep -v "check-secrets.sh" | grep -v ".env.example" | head -5
    echo ""
    SECRETS_FOUND=1
  fi
done

# Explicitly check for .env files being committed (shouldn't happen but safety net)
ENV_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^\.env$|^blockchain/\.env$|^logging-server/\.env$')
if [ -n "$ENV_FILES" ]; then
  echo "🚫 .env file staged for commit:"
  echo "$ENV_FILES"
  echo "   These should be in .gitignore."
  SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 1 ]; then
  echo ""
  echo "❌ Commit blocked: potential secrets detected."
  echo "   If this is a false positive, use: git commit --no-verify"
  exit 1
fi

exit 0
