#!/usr/bin/env bash
# Deterministic gate for the docs-driven-build loop.
# Producer/judge split: this is a PROGRAM with a binary verdict, no AI involved.
# The loop reads ONLY the exit code, never this prose.
#
# Usage:  verifier.sh [repo-root]
# Exit:   0 = green (typecheck + build pass) · 1 = red · 2 = misuse/setup error
set -uo pipefail

# Default repo root = three levels up from this script (.claude/skills/docs-driven-build).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"

cd "$ROOT" || { echo "FAIL: cannot cd to repo root: $ROOT" >&2; exit 2; }
if [ ! -f package.json ]; then
  echo "FAIL: no package.json at $ROOT — wrong repo root?" >&2; exit 2
fi

echo "== verifier: bun run typecheck =="
if ! bun run typecheck; then
  echo "FAIL: typecheck (tsc --noEmit) returned non-zero" >&2; exit 1
fi

echo "== verifier: bun run build =="
if ! bun run build; then
  echo "FAIL: next build returned non-zero" >&2; exit 1
fi

echo "PASS: typecheck + build green"
exit 0
