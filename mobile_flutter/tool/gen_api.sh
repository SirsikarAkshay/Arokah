#!/usr/bin/env bash
# Regenerates Dart API models from backend/openapi.yaml.
# Run from anywhere; cwd is normalised below.
#
# Prereqs: Java (already a Flutter prereq), Node/npx (for the generator wrapper).
# The generator is fetched on first run and cached under ~/.openapi-generator.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SPEC="$REPO_ROOT/backend/openapi.yaml"
OUT="$REPO_ROOT/mobile_flutter/lib/api/generated"

if [[ ! -f "$SPEC" ]]; then
  echo "ERROR: $SPEC not found. Run 'make schema' in backend/ first." >&2
  exit 1
fi

echo "▸ Generating Dart models from $SPEC → $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"

# Use the 'dart' generator (plain Dart, no Dio) — produces models + a thin client.
# We only consume the models; the existing ApiClient (lib/api/api_client.dart)
# keeps its hand-written token-refresh logic.
npx --yes @openapitools/openapi-generator-cli@2.13.4 generate \
  -i "$SPEC" \
  -g dart \
  -o "$OUT" \
  --additional-properties=pubName=ritha_api,pubLibrary=ritha_api,useEnumExtension=true \
  --global-property=models,modelTests=false,modelDocs=false,supportingFiles=false \
  >/dev/null

# Tidy up: openapi-generator emits files we don't want in our repo.
find "$OUT" -name '.openapi-generator' -type d -exec rm -rf {} + 2>/dev/null || true
find "$OUT" -name '.openapi-generator-ignore' -delete 2>/dev/null || true
rm -f "$OUT/.gitignore" "$OUT/README.md" "$OUT/pubspec.yaml" "$OUT/analysis_options.yaml"

echo "✓ Models written to $OUT/lib/model/"
echo "  Import: import 'package:ritha_mobile/api/generated/lib/model/clothing_item.dart';"
