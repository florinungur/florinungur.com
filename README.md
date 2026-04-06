![logo](img/logo/logo.svg)

This is the source code for my personal website at https://florinungur.com.

## How it's built

Pure HTML and CSS. No JavaScript, no external runtime dependencies, no framework. Pages are written by hand.

**Build pipeline** (`make build`):

1. `rsync` copies source files into `_site/`, excluding dev artifacts and config files
2. `bunx postcss` with cssnano minifies the CSS in place inside `_site/css/`
3. `bun scripts/generate-rss.mjs` generates `_site/rss.xml` by parsing `essays.html`
4. `bun scripts/generate-sitemap.mjs` generates `_site/sitemap.xml`

`make serve` builds and serves `_site/` on `http://127.0.0.1:8080`.

**Image optimization:**

Images are compressed before they ever land in a commit. A pre-commit hook (`.githooks/pre-commit`) runs `optipng` on PNGs, `cwebp` on WebP files, and `bunx svgo` on SVGs. The hook aborts the commit if any of these aren't installed. Run `make hooks` once after cloning to wire it up.

CI repeats the optimization pass on the built `_site/` to catch anything the hook missed.

**Linting** (`make lint`, local only):

- `bunx stylelint` for CSS, config in `.stylelintrc.json`
- `bunx html-validate` for HTML, config in `.htmlvalidate.json`
- `resume.html` and `resume.css` are excluded – that file is optimized for print, not linting

`make validate` runs a full build + lint + output sanity checks (xmllint on RSS and sitemap, CSS size comparison, HTML file count).

**Deployment:**

GitHub Actions (`.github/workflows/deploy-website.yml`) builds `_site/` and deploys to GitHub Pages on every push to `main`. The workflow:

- Caches the Bun binary (keyed on version `1.3.10`) and the Bun package cache (keyed on `bun.lock` hash) – both restored in under 2 seconds on warm runs
- Caches apt packages (`optipng`, `webp`, `libxml2-utils`) as `.deb` files in a runner-writable directory; warm runs skip `apt-get` entirely and use `dpkg -i` directly (~3s vs ~16s cold)
- Runs `bun install --production` in CI – dev dependencies (stylelint, html-validate) are not installed on the runner
- Validates the build: xmllint checks RSS and sitemap XML, CSS minification is verified against source sizes, HTML file count is checked, SVGs are checked for unoptimized patterns

**Prerequisites:** `brew install bun optipng webp`
