.PHONY: serve build hooks optimize-svg clean-png compress-webp archive-links help lint validate clean

help:
	@echo "serve        — build and serve on localhost:8080"
	@echo "build        — produce _site/ (minified CSS, RSS, sitemap)"
	@echo "validate     — build, then check outputs and run linters"
	@echo "lint         — run CSS linter and HTML validator (no build)"
	@echo "hooks        — install git hooks"
	@echo "optimize-svg — optimize all SVGs in repo"
	@echo "clean-png    — losslessly optimize all PNGs"
	@echo "compress-webp— re-encode all WebPs"
	@echo "archive-links— check/add Wayback Machine archive links"
	@echo "clean        — remove _site/ and node_modules/"

serve: build
	python3 -m http.server 8080 --bind 127.0.0.1 --directory _site

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
	  --exclude=.stylelintrc.json \
	  --exclude=.htmlvalidate.json \
	  . _site/
	bunx postcss _site/css/ --dir _site/css/ --use cssnano --no-map
	bun scripts/generate-rss.mjs _site/rss.xml _site
	bun scripts/generate-sitemap.mjs _site/sitemap.xml _site

lint:
	@echo "Running CSS linter..."
	@bunx stylelint "css/**/*.css"
	@echo "Running HTML validator..."
	@bunx html-validate "index.html" "essays.html" "ideas.html" "essays/**/*.html"
	@echo "Linting passed."

validate: build lint
	@echo "Validating build outputs..."
	@test -f _site/rss.xml || (echo "error: rss.xml missing" >&2 && exit 1)
	@test -f _site/sitemap.xml || (echo "error: sitemap.xml missing" >&2 && exit 1)
	@test -f _site/index.html || (echo "error: index.html missing" >&2 && exit 1)
	@echo "Build looks good."

hooks:
	pre-commit install

optimize-svg:
	bunx svgo -r -f . --multipass --exclude=node_modules --exclude=_site

clean-png:
	find . -name '*.png' -not -path './.git/*' -not -path './_site/*' -not -path './node_modules/*' -exec optipng {} +

compress-webp:
	find . -name '*.webp' -not -path './.git/*' -not -path './_site/*' -not -path './node_modules/*' | \
	  while IFS= read -r f; do tmp="$$(mktemp)"; cwebp -lossless -quiet "$$f" -o "$$tmp" && [ "$$(wc -c < "$$tmp")" -lt "$$(wc -c < "$$f")" ] && mv "$$tmp" "$$f" || rm -f "$$tmp"; done

archive-links:
	bun scripts/archive-links.mjs essays/

clean:
	rm -rf _site node_modules
