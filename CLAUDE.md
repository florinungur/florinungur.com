# CLAUDE.md

## What this is

A static personal website (florinungur.com) hosted on GitHub Pages. Pure HTML and CSS, no JavaScript, no external runtime dependencies.

## Local development

`README.md` covers the build, which CI runs as well, the local server, the image pass, linting, the deploy, and the prerequisites. What ships is the allowlist at the top of `scripts/build.sh`, so a new top-level file or directory that isn't an HTML page has to be added there.

## Adding a new essay

1. Create `essays/YYYY/MM/DD/slug.html` – copy the structure from an existing essay (e.g., `essays/2024/10/06/what-are-we-doing.html`). Favicon and CSS paths are relative (`../../../../`).
2. Add a card to the top of `essays.html`, copying an existing one. Its URL, title, description, and date must match the essay page's canonical link, `og:title`, meta description, and first `.datetime` date. Every `<time>` reads like its `datetime` in the short form (`Oct 6, 2024`).
3. Push. RSS and sitemap are generated at build time into `_site/` – nothing is committed back to `main`.

The `generate-rss.mjs` script builds the feed from the essay pages themselves and checks every card against its essay. It exits 1 when an essay or its card breaks a rule in step 2, so a mistake fails the deploy rather than shipping a broken feed.

## Content Security Policy

Every HTML page embeds the same CSP in `<head>`. The `default-src 'none'` directive is the whole design: nothing loads unless a directive below names it.

```
base-uri 'none'; default-src 'none'; font-src 'self'; form-action 'none';
img-src 'self'; manifest-src 'self'; object-src 'none'; script-src 'none';
style-src 'self'
```

No JavaScript ever, no external fonts, no forms, no third-party anything. Don't add something that needs a new directive – add the feature a different way, or don't add it.

## CSS variables

The colour and spacing variables sit at the top of `css/main.css`. Use `--color-primary-accessible`, the primary hue darkened to clear contrast ratios, wherever the colour carries meaning against white rather than decorating.

## Essay link conventions

Links in an essay's body, its `<main>`, open in a new tab: `target="_blank"`, plus `rel="noopener"` when the link leaves florinungur.com. A link outside `<main>`, such as the header nav, the footer, or the skip-link, navigates in place.

The `main.css` file announces the convention to screen readers with `a[target="_blank"]::after { content: "" / " (opens in a new tab)" }` – empty visual content, alt text only. That means the attribute alone carries the accessibility hint; don't add a visible marker or a per-link label.

The archive-links script skips florinungur.com, web.archive.org, and the site's own GitHub repo (`github.com/florinungur/florinungur.com`), so those links won't get `[archived link]` annotations.

## Essay "Last updated" convention

Each essay carries at most ONE update note in the datetime div – the most recent substantive update. A new update replaces the old note; the full changelog lives in git history. Trivial fixes (dead links, typos) don't bump the note.

```html
<div class="datetime">
    <time datetime="YYYY-MM-DD">Mon D, YYYY</time> |
    <i>Last updated <time datetime="YYYY-MM-DD">Mon D, YYYY</time>: terse description</i>
</div>
```

## Archive links

The `scripts/archive-links.mjs` script checks every external link in the given HTML files against the Wayback Machine and inserts `[archived link]` annotations for any that aren't already annotated.

Full pass (new essay or first-time run):

```
bun scripts/archive-links.mjs essays/YYYY/MM/DD/slug.html
```

Targeted (fixed a single link, or added one new link to an existing essay):

```
bun scripts/archive-links.mjs <file> --url <url>
```

Use `--url` whenever you only changed one link – it skips every other link in the file and archives just that one. It matches the link's URL exactly, with entities decoded: pass `&`, not the `&amp;` the source writes. Running the full script after a single-link change wastes several minutes re-trying permanently-unarchivable links (LinkedIn, Instagram) through their retry loops. The `make archive-links` target runs the full pass over every essay and is the slowest option of the three.

Links that fail archiving (Cloudflare-blocked sites, deleted pages) are logged as skipped but leave no annotation – they'll be re-tried on every full pass. That's expected; don't try to force them.

Its tests run with `bun test scripts/`, and a pre-commit hook runs them on any commit that touches `scripts/`.

## Linting

Linting and tests run locally only, so the pre-commit hooks `make hooks` installs are what gate a bad file, and skipping them means nothing checks CSS or HTML before it deploys. `ADR.md` says why; don't propose a CI step for either.

- `resume.html` has a `<time>` element at the top of the page – update it to the current date whenever resume content changes
- Fix a Stylelint or html-validate finding rather than disable its rule, unless the rule doesn't apply
- Don't add browser-specific CSS: vendor prefixes, autoprefixer, or fallback declarations for browsers that lack a feature; `ADR.md` says why
- Void elements take the self-closing form, `<meta/>` not `<meta>`
