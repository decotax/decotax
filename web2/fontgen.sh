#!/bin/bash

fonttools() {
  uvx --with brotli --from 'fonttools[woff]@latest' \
    -- fonttools "$@"
}
mkdir -p gen

SRCDIR="./node_modules/@fontsource-variable/source-sans-3/files"
SRC="${SRCDIR}/source-sans-3-latin-wght-normal.woff2"

URANGE='00-7F,A0,AD,200B,2011,FEFF,FFFD'
EXTRA='§¶½×÷–—‘’“”…∕éàèùçâêîôûëïüÉÀÈÙÇÂÊÎÔÛËÏÜ'

fonttools subset $SRC --flavor=woff2 --output-file=gen/ss3sub.woff2 \
  --unicodes="$URANGE" --text="$EXTRA"
fonttools varLib.instancer -o gen/ss3.woff2 gen/ss3sub.woff2 wght=400
rm gen/ss3sub.woff2

wc -c $SRC
wc -c gen/ss3.woff2
