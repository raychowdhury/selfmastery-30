#!/bin/bash
#
# Generates SelfMastery.xcodeproj.
#
# The three values a release needs are environment variables rather than edits
# to a checked-in file, so switching to your own identifier and backend is a
# shell export and not a diff you have to remember to keep local.
#
#   SELFMASTERY_BUNDLE_ID   your registered bundle identifier
#   SELFMASTERY_TEAM_ID     Apple Developer team ID (blank is fine for the simulator)
#   SELFMASTERY_API_URL     production backend, https only
#
# Example:
#   SELFMASTERY_BUNDLE_ID=com.yourname.selfmastery \
#   SELFMASTERY_TEAM_ID=ABCDE12345 \
#   SELFMASTERY_API_URL=https://selfmastery.example.com \
#   ./generate.sh
#
set -euo pipefail

export SELFMASTERY_BUNDLE_ID="${SELFMASTERY_BUNDLE_ID:-com.yourcompany.selfmastery}"
export SELFMASTERY_TEAM_ID="${SELFMASTERY_TEAM_ID:-}"
export SELFMASTERY_API_URL="${SELFMASTERY_API_URL:-https://selfmastery-30.vercel.app}"

# Release must never be able to reach a plaintext host. APIConfiguration also
# refuses at runtime, but failing here is cheaper than failing after an archive.
case "$SELFMASTERY_API_URL" in
  https://*) ;;
  *)
    echo "SELFMASTERY_API_URL must be https. Got: $SELFMASTERY_API_URL" >&2
    exit 1
    ;;
esac

# XcodeGen reads ${VAR}, and a bare '//' inside a build setting value is treated
# as a comment. Splitting it with an empty $() keeps the URL intact without
# introducing backslashes, which would end up in the built Info.plist verbatim.
export SELFMASTERY_API_URL="${SELFMASTERY_API_URL//:\/\//:/$()/}"

if [ "$SELFMASTERY_BUNDLE_ID" = "com.yourcompany.selfmastery" ]; then
  echo "note: using the placeholder bundle identifier. Set SELFMASTERY_BUNDLE_ID before archiving." >&2
fi

xcodegen generate
echo "Generated with bundle id: $SELFMASTERY_BUNDLE_ID"
