#!/bin/bash
set -e

echo 'Visit: http://localhost:8000/main.html'
echo
(
  cd out/webpkg
  python3 -m http.server
)
