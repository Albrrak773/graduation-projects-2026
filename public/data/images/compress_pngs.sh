#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUALITY=${1:-82}
JOBS=${2:-2}

if ! command -v cwebp &>/dev/null; then
  echo "ERROR: cwebp not found. Install it: sudo pacman -S libwebp-utils"
  exit 1
fi

mapfile -t PNGS < <(find "$DIR" -maxdepth 1 -type f -name '*.png' | sort)
TOTAL=${#PNGS[@]}
if [ "$TOTAL" -eq 0 ]; then
  echo "No PNGs found in $DIR"
  exit 0
fi

TOTAL_ORIG=0
for f in "${PNGS[@]}"; do
  s=$(stat -c%s "$f")
  TOTAL_ORIG=$((TOTAL_ORIG + s))
done

COMPRESSED=0
TOTAL_NEW=0
COUNT=0

echo "Compressing $TOTAL PNGs -> WebP (quality=$QUALITY, jobs=$JOBS)"
echo "Using cwebp with nice/ionice to keep system responsive"
echo ""

for src in "${PNGS[@]}"; do
  COUNT=$((COUNT + 1))
  base="$(basename "$src" .png)"
  dst="${src%.png}.webp"
  orig_size=$(stat -c%s "$src")

  printf "[%d/%d] %-55s  " "$COUNT" "$TOTAL" "$base"

  if nice -n 19 ionice -c 3 cwebp -quiet -q "$QUALITY" -mt 1 "$src" -o "$dst" 2>/dev/null; then
    new_size=$(stat -c%s "$dst")

    if [ "$new_size" -ge "$orig_size" ]; then
      rm -f "$dst"
      printf "NO SAVINGS (kept PNG)\n"
      TOTAL_NEW=$((TOTAL_NEW + orig_size))
    else
      rm "$src"
      pct=$((100 - (new_size * 100 / orig_size)))
      printf "%s -> %s  (%d%% smaller)\n" \
        "$(numfmt --to=iec "$orig_size")" "$(numfmt --to=iec "$new_size")" "$pct"
      TOTAL_NEW=$((TOTAL_NEW + new_size))
      COMPRESSED=$((COMPRESSED + 1))
    fi
  else
    rm -f "$dst" 2>/dev/null || true
    printf "FAILED\n"
    TOTAL_NEW=$((TOTAL_NEW + orig_size))
  fi

  if [ "$JOBS" -gt 1 ] && [ $((COUNT % JOBS)) -eq 0 ]; then
    sleep 0.5
  fi
done

SAVED=$((TOTAL_ORIG - TOTAL_NEW))
PCT=$((100 - (TOTAL_NEW * 100 / TOTAL_ORIG)))

echo ""
echo "========================================="
echo "  Converted: $COMPRESSED/$TOTAL files"
echo "  Original:   $(numfmt --to=iec "$TOTAL_ORIG")"
echo "  Compressed: $(numfmt --to=iec "$TOTAL_NEW")"
echo "  Saved:       $(numfmt --to=iec "$SAVED") ($PCT% reduction)"
echo "========================================="