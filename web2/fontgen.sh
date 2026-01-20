#!/bin/bash

fonttools() {
  uvx --with brotli --from 'fonttools[woff]@latest' fonttools "$@"
}
mkdir -p gen

process() {
  PKG=$1
  SRCBASE=$2
  DSTBASE=$3
  WGHT=$4

  SRCDIR="./node_modules/@fontsource-variable/${PKG}/files"
  SRC="${SRCDIR}/${SRCBASE}.woff2"
  INT="gen/${DSTBASE}-sub.woff2"
  DST="gen/${DSTBASE}.woff2"

  URANGE='00-7F,A0,AD,200B,2011,FEFF,FFFD'
  EXTRA='§¶½×÷–—‘’“”…∕éàèùçâêîôûëïüÉÀÈÙÇÂÊÎÔÛËÏÜ'

  fonttools subset $SRC --flavor=woff2 --output-file=${INT} \
    --unicodes="$URANGE" --text="$EXTRA"
  fonttools varLib.instancer -o ${DST} -q ${INT} wght=${WGHT}
  rm ${INT}

  SZ1=$(wc -c < ${SRC})
  SZ2=$(wc -c < ${DST})
  RED=$(printf "%.1f" "$(echo "scale = 4; 100 - ($SZ2 / $SZ1) * 100" | bc)")
  echo "${SRCBASE} $SZ1 -> ${DSTBASE} $SZ2 -${RED}%"
}

process "source-sans-3" "source-sans-3-latin-wght-normal" "ss3" 400
process "source-sans-3" "source-sans-3-latin-wght-italic" "ss3i" 400
process "source-sans-3" "source-sans-3-latin-wght-normal" "ss3b" 700
process "source-sans-3" "source-sans-3-latin-wght-italic" "ss3bi" 700
