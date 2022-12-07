#!/bin/bash
# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

# Builds the project.
# After building, use run.sh to run a local development server.

# TODO: cmake or something?

set -e  # Bail on errors.

# Version subdir for JS, CSS, etc.
ASSET_DIR=$(cat VERSION)
(
  cd webpkg

  # We don't check in node_modules (see .gitignore), but package.json declares
  # our dependencies and package-lock.json (auto-generated) pins their versions.
  # This command uses npm install to regenerate the node_modules directory if it
  # doesn't already exist.
  [ -d ./node_modules ] || npm install

  # This runs webpack, which will write to out/webpkg.
  npx webpack --mode production --env assetDir=$ASSET_DIR
)

# Copy any static files that webpack doesn't know about.
cp logo/favicon.ico out/webpkg
