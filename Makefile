.PHONY: serve build hooks optimize-svg clean-png compress-webp clean

serve: build
	python3 -m http.server 8080 --directory _site

build:
	rsync -a --delete \
	  --exclude=node_modules \
	  --exclude=.claude \
	  --exclude=.git \
	  --exclude=.github \
	  --exclude=.githooks \
	  --exclude=.gitignore \
	  --exclude=_site \
	  --exclude=scripts \
	  --exclude=Makefile \
	  --exclude=package.json \
	  --exclude=bun.lock \
	  --exclude=CLAUDE.md \
	  --exclude=README.md \
	  --exclude=LICENSE \
	  . _site/
	bunx postcss _site/css/ --dir _site/css/ --use cssnano --no-map
	bun scripts/generate-rss.mjs _site/rss.xml _site
	bun scripts/generate-sitemap.mjs _site/sitemap.xml _site

hooks:
	git config core.hooksPath .githooks

optimize-svg:
	bunx svgo -r -f . --multipass --exclude=node_modules --exclude=_site

clean-png:
	find . -name '*.png' -not -path './.git/*' -not -path './_site/*' -not -path './node_modules/*' -exec optipng {} +

compress-webp:
	find . -name '*.webp' -not -path './.git/*' -not -path './_site/*' -not -path './node_modules/*' | \
	  while read f; do cwebp "$$f" -o "$$f"; done

clean:
	rm -rf _site node_modules
