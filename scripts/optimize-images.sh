#!/usr/bin/env bash
# Re-encodes each WebP losslessly, keeping the result only when it's smaller, and runs svgo on each SVG.
set -euo pipefail

svgs=()
for f in "$@"; do
  case $f in
    *.webp)
      if ! command -v cwebp >/dev/null; then
        echo "error: cwebp not found; brew install webp" >&2
        exit 1
      fi
      tmp=$(mktemp)
      if cwebp -lossless -quiet "$f" -o "$tmp" && (($(wc -c <"$tmp") < $(wc -c <"$f"))); then
        cat "$tmp" >"$f"
      fi
      rm -f "$tmp"
      ;;
    *.svg) svgs+=("$f") ;;
  esac
done

if ((${#svgs[@]})); then
  bunx svgo --multipass --quiet "${svgs[@]}"
fi
