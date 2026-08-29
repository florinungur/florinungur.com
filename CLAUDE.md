# CLAUDE.md

## What this is

A static personal website (florinungur.com) hosted on GitHub Pages. Pure HTML and CSS, no JavaScript, no external runtime dependencies.

## Local development

`make build` produces `_site/` matching what CI deploys (minified CSS, RSS, sitemap). `make serve` runs build then serves `_site/` on port 8080. `make hooks` installs pre-commit hooks. Prerequisites: `bun install`, `uv tool install pre-commit`.

## Adding a new essay

1. Create `essays/YYYY/MM/DD/slug.html` – copy the structure from an existing essay (e.g., `essays/2024/10/06/what-are-we-doing.html`). Favicon and CSS paths are relative (`../../../../`).
2. Add a card entry to `essays.html` at the top of the list – this is what the RSS generator reads. The card must use `.content-list > a` for the URL, `h2` for the title, `time` for the date (format: "Mon DD, YYYY"), and a `<p>` for the description.
3. Push. RSS and sitemap are generated at build time into `_site/` – nothing is committed back to `main`.

`generate-rss.mjs` exits 1 on an unparseable date or an empty item list, so a malformed card fails the deploy rather than shipping a broken feed.

## CSS

CSS files in `css/` are stored unminified (readable source). Minification happens at deploy time into `_site/` via postcss/cssnano. Edit CSS directly.

## Content Security Policy

Every HTML page embeds the same CSP in `<head>`. `default-src 'none'` is the whole design: nothing loads unless a directive below names it.

```
base-uri 'none'; default-src 'none'; font-src 'self'; form-action 'none';
img-src 'self'; manifest-src 'self'; object-src 'none'; script-src 'none';
style-src 'self'
```

No JavaScript ever, no external fonts, no forms, no third-party anything. Don't add something that needs a new directive – add the feature a different way, or don't add it.

## Image optimization

Run `make hooks` once after cloning to enable pre-commit image optimization (`.pre-commit-config.yaml`): `svgo` on SVGs, `cwebp` on WebPs, both re-encoding in place and keeping the result only when it's smaller. CI repeats the pass over `_site/` and caches the output, so a hook that was never installed costs a slower deploy rather than a fat image on the live site.

## GitHub Actions

| Workflow           | Trigger      | What it does                                                                          |
| ------------------ | ------------ | --------------------------------------------------------------------------------------- |
| deploy-website.yml | push to main | Builds `_site/`, optimizes images, validates the output, deploys to Pages in one job |

`paths-ignore` keeps a docs-only or config-only commit from redeploying. The validation step is the deploy's own gate: `xmllint` on the RSS and sitemap, every minified CSS file compared against its source size, and a non-zero HTML count. It does not lint – see below.

## Key CSS variables (defined in main.css)

- `--color-primary`: `#d1861f` (gold/amber – links, accents, logo mask)
- `--color-primary-accessible`: `#966016` – the same hue darkened to clear contrast ratios. Use it wherever the colour carries meaning against white rather than decorating.
- `--color-lightGrey` / `--color-grey`
- `--grid-gutter`: spacing unit

## Essay link conventions

Links in an essay's body open in a new tab: `target="_blank"`, plus `rel="noopener"` when the destination is external. Internal florinungur.com links get `target="_blank"` too and skip `rel="noopener"`. The header nav (`/`, `/essays`, `/rss.xml`) and the skip-link are the exception – they navigate in place.

`main.css` announces the convention to screen readers with `a[target="_blank"]::after { content: "" / " (opens in a new tab)" }` – empty visual content, alt text only. That means the attribute alone carries the accessibility hint; don't add a visible marker or a per-link label.

The archive-links script skips florinungur.com and web.archive.org URLs, so internal links won't get `[archived link]` annotations.

## Essay "Last updated" convention

Each essay carries at most ONE update note in the datetime div – the most recent substantive update. A new update replaces the old note; the full changelog lives in git history. Trivial fixes (dead links, typos) don't bump the note.

```html
<div class="datetime">
    <time datetime="YYYY-MM-DD">Mon DD, YYYY</time> |
    <i>Last updated <time datetime="YYYY-MM-DD">Mon DD, YYYY</time>: terse description</i>
</div>
```

Never chain multiple update notes.

## Archive links

`scripts/archive-links.mjs` checks every external link in the given HTML files against the Wayback Machine and inserts `[archived link]` annotations for any that aren't already annotated.

Full pass (new essay or first-time run):

```
bun scripts/archive-links.mjs essays/YYYY/MM/DD/slug.html
```

Targeted (fixed a single link, or added one new link to an existing essay):

```
bun scripts/archive-links.mjs <file> --url <exact-href>
```

Use `--url` whenever you only changed one link – it skips every other link in the file and archives just that one. Running the full script after a single-link change wastes several minutes re-trying permanently-unarchivable links (LinkedIn, Instagram) through their retry loops. `make archive-links` runs the full pass over every essay and is the slowest option of the three.

Links that fail archiving (Cloudflare-blocked sites, deleted pages) are logged as skipped but leave no annotation – they'll be re-tried on every full pass. That's expected; don't try to force them.

## Linting

`make lint` runs Stylelint on CSS and html-validate on HTML. `make validate` does a full build + lint + output check.

Linting is local only. CI installs with `bun install --production`, so stylelint and html-validate aren't on the runner at all – the pre-commit hooks are what actually gate a bad file, and skipping `make hooks` means nothing checks CSS or HTML before it deploys.

- `resume.html` and `resume.css` are excluded from linting (resume is optimized for printability, don't modify it)
- `resume.html` has a `<time>` element at the top of the page – update it to the current date whenever resume content changes
- Stylelint config: `.stylelintrc.json` – fix CSS issues instead of disabling rules; only disable rules that are genuinely not applicable
- HTML validate config: `.htmlvalidate.json` – void elements use self-closing style (`<meta/>` not `<meta>`)
