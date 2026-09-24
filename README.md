![logo](img/logo/logo.svg)

This is the source code for my personal website at https://florinungur.com.

## How it's built

Pure HTML and CSS. No JavaScript, no external runtime dependencies, no framework. Pages are written by hand.

**Build** (`make build`): `scripts/build.sh` copies the site's files into `_site/`, minifies the CSS, builds the RSS feed from the essay pages, generates the sitemap, optimises images, and checks the output. CI runs the same script.

The `make serve` target builds and serves `_site/` on `http://127.0.0.1:8080`.

**Image optimisation:**

Images are compressed before they ever land in a commit. A pre-commit hook runs `scripts/optimize-images.sh`: `cwebp` on WebP files and `svgo` on SVGs. Run `make hooks` once after cloning to wire it up.

The build repeats the pass on `_site/` to catch anything the hook missed.

**Linting** (`make lint`, local only):

- `bunx stylelint` for CSS, config in `.stylelintrc.json`
- `bunx html-validate` for HTML, config in `.htmlvalidate.json`
- `resume.html` and `resume.css` are excluded – that file is optimised for print, not linting

The `make validate` target runs the build, which ends with its own output checks (xmllint on RSS and sitemap, CSS size comparison), then the linters.

**Deployment:**

GitHub Actions (`.github/workflows/deploy-website.yml`) builds `_site/` and deploys to GitHub Pages on every push to `main`. The workflow:

- Caches the Bun binary (keyed on version `1.3.10`) and the Bun package cache (keyed on `bun.lock` hash) – both restored in under 2 seconds on warm runs
- Caches apt packages (`webp`, `libxml2-utils`) as `.deb` files in a runner-writable directory; warm runs skip `apt-get` entirely and use `dpkg -i` directly (~3s vs ~16s cold)
- Runs `bun install --production` in CI – dev dependencies (stylelint, html-validate) are not installed on the runner
- Runs `scripts/build.sh`, whose output checks (xmllint on RSS and sitemap, CSS minification against source sizes) gate the deploy

**Prerequisites:** `brew install bun webp`
