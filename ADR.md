# Decisions

Every architectural decision about this site, with its reason. An entry is its heading, its reason distilled from what I said, and `Decided`, `Rules out`, and `Record` lines.

### The site is hand-written HTML and CSS with no JavaScript, and its CSP blocks anything it doesn't name

I wanted to share my thoughts and my CV with the world.

- Decided: undated; in place at the first commit of the current history, 2026-03-22
- Rules out: JavaScript; a framework or a site generator; external fonts, forms, and anything third-party
- Record: my answer of 1 Nov 2026; the CSP in every page's `<head>` since 2dee0f5
