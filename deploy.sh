#!/bin/bash
# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

# Pushes build artifacts to GCP.
# Build first with build.sh.

set -e  # Bail on errors.

./clean.sh
./build.sh

ASSET_DIR=$(cat VERSION)

# Check if we have already pushed the current version.
EXISTING=$(
  curl -s -o /dev/null -I -w "%{http_code}" \
      http://s.deco.tax/$ASSET_DIR/main.js
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
  gcloud storage cp $ASSET_DIR gs://s.deco.tax/ \
      -r --cache-control="public, max-age=604800"

  # Push the main page.  Notes:
  # - Small and not versioned, so cache for only one minute (or else we can't
  #   change it quickly).
  # - We set public filename to "main" without .html suffix, but mark as html
  #   content type.  Explicit charset=UTF-8 to override windows-1252 default.
  # - Bucket is configured with "main" as the "Index (main) page suffix" in GCP
  #   console (Overflow menu > Edit website configuration).
  gcloud storage cp main.html gs://s.deco.tax/main \
      --cache-control="public, max-age=60" \
      --content-type="text/html; charset=UTF-8"

  # Static bits are now live on s.deco.tax which is CNAME'ed to Cloud Storage
  # bucket.  Cloudflare proxies naked domain deco.tax with worker fetch and
  # 24-hour edge cache TTL (independent of main page's 60s max-age for browser
  # cache).  So we need to purge the edge cache in Cloudflare UI to see the
  # update on deco.tax.  There's an API for this as well which I will figure out
  # at some point.
  echo 'TODO: Purge Cloudflare cache'
)
