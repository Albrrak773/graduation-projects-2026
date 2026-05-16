#!/bin/bash
TOTAL=(*.pdf)
echo "Converting ${#TOTAL[@]} PDF files to PNG..."

parallel --bar --eta \
  'out={.}; pdftocairo -png -r 300 -singlefile {} "$out" 2>/dev/null || echo "FAILED: {}" >&2' \
  ::: *.pdf

echo "Done!"