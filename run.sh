#!/bin/bash
# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

# Runs a local development server.
# Before running, use build.sh to build the project.

set -e  # Bail on errors.

(
  # Run Cloud Functions locally using the Functions Framework.
  # We use local URL in dev mode (see getCloudFunctionUrls in fb-config.js).

  # With the trailing '&' the server runs in the background but is still killed
  # when run.sh exits (e.g. by ^C).

  cd cloudfunc/process-new-form
  functions-framework --target=process_new_form &
)

echo
echo '    http://localhost:8000/main.html'
echo
(
  cd out/webpkg

  # Webpack has its own dev server but there is a lot of magic that I don't
  # fully understand and I want something "dumber" for now.
  python3 -m http.server
)
