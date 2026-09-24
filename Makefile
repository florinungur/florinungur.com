.PHONY: serve build hooks optimize-images archive-links help lint validate clean

help:
	@echo "serve           – build and serve on localhost:8080"
	@echo "build           – build and check _site/ with scripts/build.sh, the same as CI"
	@echo "validate        – build, then run the linters"
	@echo "lint            – run the CSS linter and HTML validator (no build)"
	@echo "hooks           – install git hooks"
	@echo "optimize-images – re-encode every tracked WebP and SVG in place"
	@echo "archive-links   – check/add Wayback Machine archive links"
	@echo "clean           – remove _site/ and node_modules/"

serve: build
	python3 -m http.server 8080 --bind 127.0.0.1 --directory _site

build:
	scripts/build.sh

validate: build lint

lint:
	@echo "Running CSS linter..."
	@bunx stylelint "css/**/*.css"
	@echo "Running HTML validator..."
	@bunx html-validate $$(git ls-files --cached --others --exclude-standard -- '*.html' ':!resume.html')
	@echo "Linting passed."

hooks:
	pre-commit install

optimize-images:
	git ls-files -z -- '*.webp' '*.svg' | xargs -0 scripts/optimize-images.sh

archive-links:
	bun scripts/archive-links.mjs essays/

clean:
	rm -rf _site node_modules
