#!/bin/bash
set -e

ASSET_DIR=$(cat VERSION)

EXISTING=$(
  curl -s -o /dev/null -I -w "%{http_code}" \
      http://s.deco.tax/$ASSET_DIR/main.js
)

[ "$EXISTING" -eq "404" ] || {
  echo "$ASSET_DIR already deployed; increment ./VERSION"
  exit 1
}

(
  cd out/webpkg

  gcloud storage cp $ASSET_DIR gs://s.deco.tax/ \
      -r --cache-control="public, max-age=604800"

  gcloud storage cp main.html gs://s.deco.tax/main \
      --cache-control="public, max-age=60" \
      --content-type="text/html; charset=UTF-8"

  echo 'TODO: Purge Cloudflare cache'
)
