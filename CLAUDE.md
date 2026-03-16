# CLAUDE.md

## What this is

A static personal website (florinungur.com) hosted on GitHub Pages. Pure HTML and CSS, no JavaScript, no external runtime dependencies.

## Local development

`make build` produces `_site/` matching what CI deploys (minified CSS, RSS, sitemap). `make serve` runs build then serves `_site/` on port 8080. `make hooks` installs the pre-commit hook. Prerequisites: `brew install bun optipng webp`.

## Adding a new essay

1. Create `essays/YYYY/MM/DD/slug.html` — copy the structure from an existing essay (e.g., `essays/2024/10/06/what-are-we-doing.html`). Favicon and CSS paths are relative (`../../../../`).
2. Add a card entry to `essays.html` at the top of the list — this is what the RSS generator reads. The card must use `.content-list > a` for the URL, `h2` for the title, `time` for the date (format: "Mon DD, YYYY"), and a `<p>` for the description.
3. Push. RSS and sitemap are generated at build time into `_site/` — nothing is committed back to `main`.

## CSS

CSS files in `css/` are stored unminified (readable source). Minification happens at deploy time into `_site/` via postcss/cssnano. Edit CSS directly.

## Content Security Policy

Every HTML page embeds a strict CSP in `<head>`:

- `script-src 'none'` — no JavaScript, ever
- `style-src 'self'` — only self-hosted stylesheets
- `font-src 'self'` — no external fonts
- `form-action 'none'` — no forms

Don't add anything that would violate this CSP.

## Image optimization

Images are optimized locally via a pre-commit hook (`.githooks/pre-commit`) before they ever land in a commit. Run `make hooks` once after cloning to wire it up. The hook aborts the commit if `bunx`, `optipng`, or `cwebp` isn't installed.

## GitHub Actions

| Workflow           | Trigger      | What it does                                                       |
| ------------------ | ------------ | ------------------------------------------------------------------ |
| deploy-website.yml | push to main | Builds `_site/` (CSS minification, RSS, sitemap), deploys to Pages |

The RSS generator (`scripts/generate-rss.mjs`) reads `essays.html` using CSS selectors (`.content-list > a`, `h2`, `time`). If the structure of essay cards in `essays.html` changes, the RSS feed breaks.

## Key CSS variables (defined in main.css)

- `--color-primary`: `#d1861f` (gold/amber — used for links, accents, logo mask)
- `--color-lightGrey` / `--color-grey`
- `--grid-gutter`: spacing unit

## Essay HTML template structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Settings (CSP, viewport, charset) -->
    <!-- Webpage info (title, og:*, canonical, author, description) -->
    <!-- Favicons (4 links, paths relative: ../../../../img/favicon/...) -->
    <!-- CSS: main.css + essays.css (paths: ../../../../css/...) -->
    <!-- RSS alternate link -->
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header><!-- logo --></header>
    <nav aria-label="Back to essays"><a href="/essays">← Essays</a></nav>
    <main id="main-content">
      <h1>Essay title</h1>
      <div class="datetime">
        <time datetime="YYYY-MM-DD">Mon DD, YYYY</time>
      </div>
      <!-- essay body paragraphs -->
    </main>
    <footer>
      <p>Thoughts? Send them to <code>florin at $website</code>.</p>
      <p>Want to subscribe to my newsletter? Send me another email.</p>
    </footer>
  </body>
</html>
```

## Essay "Updated on" convention

When modifying an essay, add an update note in the datetime div:

```html
<div class="datetime">
    <time datetime="YYYY-MM-DD">Mon DD, YYYY</time> |
    <i>Updated on <time datetime="YYYY-MM-DD">Mon DD, YYYY</time>: short description of changes</i>
</div>
```

Multiple updates are chained with ` | `. See `hello-world.html` for an example with two update notes.

## Linting

`make lint` runs Stylelint on CSS and html-validate on HTML. `make validate` does a full build + lint + output check.

- `resume.html` and `resume.css` are excluded from linting (resume is optimized for printability, don't modify it)
- Stylelint config: `.stylelintrc.json` — fix CSS issues instead of disabling rules; only disable rules that are genuinely not applicable
- HTML validate config: `.htmlvalidate.json` — void elements use self-closing style (`<meta/>` not `<meta>`)
