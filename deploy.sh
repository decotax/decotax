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

if [ "$1" == "fonts" ]; then
  gcloud storage cp out/webpkg/fonts gs://deco_tax_assets/ -r \
      --cache-control="public, max-age=604800"
fi

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

./clean.sh
./build.sh

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

  # Cloudflare worker sets 24-hour TTL, purge main resource to see update.
  if [ -n "$CLOUDFLARE_PURGE_TOKEN_FILE" ]; then
    echo "Purging Cloudflare cache for deco_tax_assets/main..."
    curl --request POST \
      --url "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONEID}/purge_cache" \
      --header "Content-Type: application/json" \
      --header "Authorization: Bearer $(cat $CLOUDFLARE_PURGE_TOKEN_FILE)" \
      --data '{ "files": [ "https://storage.googleapis.com/deco_tax_assets/main" ] }'
    echo
  fi
)
