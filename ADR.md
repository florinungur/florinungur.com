# Decisions

Every architectural decision about this site, with its reason. An entry is its heading, its reason quoted from its record, and `Decided`, `Rules out`, and `Record` lines.

### Linting and tests run locally only, never in CI

"I'm the site's only maintainer and I run the checks before every push. I want CI fast and lean, so it spends no compute on checks that already ran."

- Decided: 2026-10-20
- Rules out: a CI step for linting or tests
- Record: `CLAUDE.md` § Linting at 5bb788d

### No browser-specific CSS

"I wouldn't add browser-specific configuration in my website." The reason is the one I hold for everything I build, "cutting complexity out of whatever I make".

- Decided: 2026-10-30
- Rules out: adding vendor-prefixed properties, autoprefixer, or declarations kept only for browsers that lack a feature
- Record: `CLAUDE.md` § Linting, added in https://github.com/florinungur/florinungur.com/pull/26; the reason quoted from my coding preferences
