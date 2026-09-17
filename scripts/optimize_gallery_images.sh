#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_root="$repo_root/images"
output_root="$source_root/web"

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick is required (missing 'convert')." >&2
  exit 1
fi

mkdir -p "$output_root"

find "$source_root" -type f \
  \( -iname '*.jpg' -o -iname '*.jpeg' \) \
  ! -path "$output_root/*" -print0 |
while IFS= read -r -d '' source; do
  relative="${source#"$source_root/"}"
  stem="${relative%.*}"
  destination="$output_root/$stem.webp"
  temporary="$(mktemp "${TMPDIR:-/tmp}/jazzing-webp.XXXXXX.webp")"

  mkdir -p "$(dirname "$destination")"

  echo "optimizing images/$relative -> images/web/$stem.webp"
  convert "$source" \
    -auto-orient \
    -strip \
    -resize '2200x2200>' \
    -quality 78 \
    -define webp:method=6 \
    "$temporary"

  if [[ ! -s "$temporary" ]]; then
    echo "Image optimization produced an empty file: $relative" >&2
    exit 1
  fi

  mv "$temporary" "$destination"
done
