# Decisions

Every architectural decision about this site, with its reason. An entry is its heading, its reason distilled from what I said, and `Decided`, `Rules out`, and `Record` lines.

### The site is hand-written HTML and CSS with no JavaScript, and its CSP blocks anything it doesn't name

I wanted to share my thoughts and my CV with the world.

- Decided: undated; in place at the first commit of the current history, 2026-03-22
- Rules out: JavaScript; a framework or a site generator; external fonts, forms, and anything third-party
- Record: my answer of 1 Nov 2026; the CSP in every page's `<head>` since 2dee0f5

### Linting and tests run locally only, never in CI

"I'm the site's only maintainer and I run the checks before every push. I want CI fast and lean, so it spends no compute on checks that already ran."

- Decided: 2026-10-20
- Rules out: a CI step for linting or tests
- Record: `CLAUDE.md` § Linting at 5bb788d

### No browser-specific CSS

I wouldn't add browser-specific configuration to my website, since I cut complexity out of whatever I make.

- Decided: 2026-10-30
- Rules out: adding vendor-prefixed properties, autoprefixer, or declarations kept only for browsers that lack a feature
- Record: `CLAUDE.md` § Linting, added in https://github.com/florinungur/florinungur.com/pull/26; the reason from my coding preferences
