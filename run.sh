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
  functions-framework --target=process_new_form --port 8081 &
)

if [ "$1" == "development" ]; then

  # Run webpack dev server (supports live reloading).
  echo
  echo '    http://localhost:8080/'
  echo
  (
    cd webpkg
    npx webpack serve --mode development
  )

else

  # Serve output of production build (from build.sh).
  # (Unfortunately Python http.server can't route / to main.html.)
  echo
  echo '    http://localhost:8080/main.html'
  echo
  (
    cd out/webpkg
    python3 -m http.server 8080
  )

fi
