#!/usr/bin/env bash
# Deploy the offerpulse-app (dashboard) Vercel project.
#
# Usage:
#   ./scripts/deploy-offerpulse-app.sh              # Preview (uses Preview env in Vercel)
#   ./scripts/deploy-offerpulse-app.sh --preview     # same as above
#   ./scripts/deploy-offerpulse-app.sh --prod       # Production (uses Production env in Vercel)
#
# The build runs on Vercel’s builders; variables come from the Vercel project for the
# deployment target (Preview vs Production), not from apps/app/.env.local.
#
# Optional:
#   VERCEL_TEAM_SCOPE   Team slug (default: omnicentra)
#   VERCEL_TOKEN        Non-interactive auth (CI); see https://vercel.com/docs/cli/login
#
# Run from anywhere; the script cds to the monorepo root (next to .vercel/project.json).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCOPE="${VERCEL_TEAM_SCOPE:-omnicentra}"
EXPECTED_PROJECT="offerpulse-app"

usage() {
  cat <<'EOF'
Deploy offerpulse-app (dashboard) to Vercel.

Usage:
  scripts/deploy-offerpulse-app.sh [--preview | --prod] [-- extra vercel args]

  --preview       Preview deployment (default). Uses Preview env in the Vercel project.
  --prod          Production deployment. Uses Production env in the Vercel project.

Environment:
  VERCEL_TEAM_SCOPE   Team slug (default: omnicentra)
  VERCEL_TOKEN        Token for non-interactive deploys (CI)

Builds run on Vercel; apps/app/.env.local is not used for the deployment build.
EOF
  exit "${1:-0}"
}

TARGET="preview"
EXTRA=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preview)
      TARGET="preview"
      shift
      ;;
    --prod | --production)
      TARGET="production"
      shift
      ;;
    -h | --help)
      usage 0
      ;;
    --)
      shift
      EXTRA+=("$@")
      break
      ;;
    *)
      EXTRA+=("$1")
      shift
      ;;
  esac
done

if ! command -v vercel >/dev/null 2>&1; then
  echo "error: vercel CLI not found. Install with: pnpm add -g vercel@latest" >&2
  exit 1
fi

PROJECT_FILE="$REPO_ROOT/.vercel/project.json"
if [[ ! -f "$PROJECT_FILE" ]]; then
  echo "error: missing $PROJECT_FILE" >&2
  echo "From the repo root, link the dashboard project, e.g.:" >&2
  echo "  vercel link --yes --scope $SCOPE --project $EXPECTED_PROJECT" >&2
  exit 1
fi

# Lightweight guard against deploying with the wrong linked project.
if ! grep -q "\"projectName\"[[:space:]]*:[[:space:]]*\"$EXPECTED_PROJECT\"" "$PROJECT_FILE" 2>/dev/null; then
  echo "error: $PROJECT_FILE does not look linked to $EXPECTED_PROJECT (check projectName)." >&2
  exit 1
fi

cd "$REPO_ROOT"

run_vercel() {
  # Drop direnv / .zshrc exports so local secrets are not visible to any local subprocess
  # the CLI might spawn. Preview vs Production values still come from Vercel at build time.
  local -a e=(
    env -i
    "PATH=$PATH"
    "HOME=$HOME"
    "USER=${USER:-$(id -un)}"
    "TMPDIR=${TMPDIR:-/tmp}"
    "SHELL=${SHELL:-/bin/sh}"
  )
  [[ -n "${LANG:-}" ]] && e+=("LANG=$LANG")
  [[ -n "${VERCEL_TOKEN:-}" ]] && e+=("VERCEL_TOKEN=$VERCEL_TOKEN")
  [[ -n "${CI:-}" ]] && e+=("CI=$CI")
  "${e[@]}" vercel "$@"
}

ARGS=(deploy --yes --scope "$SCOPE")
if [[ "$TARGET" == "production" ]]; then
  ARGS+=(--prod)
  echo "Deploying $EXPECTED_PROJECT to Production (Vercel Production env)…"
else
  echo "Deploying $EXPECTED_PROJECT to Preview (Vercel Preview env)…"
fi

run_vercel "${ARGS[@]}" "${EXTRA[@]}"
