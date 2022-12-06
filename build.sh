#!/bin/bash
set -e

ASSET_DIR=$(cat VERSION)
(
  cd webpkg
  [ -d ./node_modules ] || npm install
  npx webpack --mode production --env assetDir=$ASSET_DIR
)
cp logo/favicon.ico out/webpkg
