#!/bin/bash
# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

# Runs a local development server.
# Before running, use build.sh to build the project.

set -e  # Bail on errors.

echo
echo '    http://localhost:8000/main.html'
echo
(
  cd out/webpkg

  # Webpack has its own dev server but there is a lot of magic that I don't
  # fully understand and I want something "dumber" for now.
  python3 -m http.server
)
