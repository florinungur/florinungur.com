#!/usr/bin/env bash
# Builds _site/ from the site's files and checks the result; make build and CI both run it.
set -euo pipefail
cd "$(dirname "$0")/.."

# What ships: tracked and untracked-but-not-ignored files under these pathspecs.
site=(':(glob)*.html' 'css/**' 'img/**' 'essays/**' CNAME robots.txt ':(exclude,glob)**/*.psd')

files=()
while IFS= read -r -d '' f; do
  if [[ -e $f ]]; then files+=("$f"); fi
done < <(git ls-files -z --cached --others --exclude-standard -- "${site[@]}")

rm -rf _site
mkdir _site
printf '%s\0' "${files[@]}" | rsync -a --from0 --files-from=- . _site/

bunx postcss _site/css/ --dir _site/css/ --use cssnano --no-map
bun scripts/generate-rss.mjs _site/rss.xml _site
bun scripts/generate-sitemap.mjs _site/sitemap.xml _site

images=()
for f in "${files[@]}"; do
  case $f in *.webp | *.svg) images+=("_site/$f") ;; esac
done
scripts/optimize-images.sh "${images[@]}"

xmllint --noout _site/rss.xml _site/sitemap.xml
for src in css/*.css; do
  if (($(wc -c <"_site/$src") >= $(wc -c <"$src"))); then
    echo "error: _site/$src is not smaller than $src" >&2
    exit 1
  fi
done

echo "Built _site/ from ${#files[@]} files"
