#!/bin/bash
# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

# Pushes build artifacts to GCP.
# Build first with build.sh.

set -e  # Bail on errors.

if [ "$1" == "favicon" ]; then
  gcloud storage cp logo/favicon.ico gs://deco_tax_assets/ \
      --cache-control="public, max-age=86400" \
      --content-type="image/x-icon"
  exit
fi

./clean.sh
./build.sh

ASSET_DIR=$(cat VERSION)

# Check if we have already pushed the current version.
EXISTING=$(
  curl -s -o /dev/null -I -w "%{http_code}" \
      https://storage.googleapis.com/deco_tax_assets/$ASSET_DIR/main.js
)

# Each push should use a new version since we are telling browsers to cache the
# versioned assets aggressively.  But skip this check if I passed -f.
[ "$EXISTING" == "404" ] || [ "$1" == "-f" ] || {
  echo "$ASSET_DIR already deployed; increment ./VERSION"
  exit 1
}

(
  cd out/webpkg

  # Push the versioned assets first.  Cache for a long time (1 week seems fine).
  gcloud storage cp $ASSET_DIR gs://deco_tax_assets/ \
      -r --cache-control="public, max-age=604800"

  # Push the main page.  Notes:
  # - Small and not versioned, so cache for only one minute (or else we can't
  #   change it quickly).
  # - We set public filename to "main" without .html suffix, but mark as html
  #   content type.  Explicit charset=UTF-8 to override windows-1252 default.
  # - Bucket is configured with "main" as the "Index (main) page suffix" in GCP
  #   console (Overflow menu > Edit website configuration).
  gcloud storage cp main.html gs://deco_tax_assets/main \
      --cache-control="public, max-age=60" \
      --content-type="text/html; charset=UTF-8"

  # Static bits are now live in the Cloud Storage bucket that Cloudflare proxies
  # deco.tax to, using worker fetch and 24-hour edge cache TTL (independent of
  # main page's 60s max-age for browser cache).  So we need to purge the edge
  # cache to see the update on deco.tax.  TODO: There's an API for this...
  echo 'TODO: Purge Cloudflare cache'
)
