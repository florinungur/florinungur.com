# Decisions

Every architectural decision about this site, with its reason. An entry is its heading, its reason quoted from its record, and `Decided`, `Rules out`, and `Record` lines.

### Linting and tests run locally only, never in CI

"I'm the site's only maintainer and I run the checks before every push. I want CI fast and lean, so it spends no compute on checks that already ran."

- Decided: 2026-10-20
- Rules out: a CI step for linting or tests
- Record: `CLAUDE.md` § Linting at 5bb788d
