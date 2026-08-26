---
'@kernhq/module-template': patch
---

Start from the framework that exists.

The Apache-2.0 starting point declared `@kernhq/contracts ^0.5.0` and `@kernhq/ui ^0.8.0` — two
minors behind — and its own CI could not notice: the committed lockfile pinned `ui@0.8.0`, so
`--frozen-lockfile` stayed green forever while anyone starting a module here began against a
framework Kern no longer ships. It was also the only module repository without `check-ranges.mjs`,
which is the check that would have said so; `lint` runs it now, and it also checks the lockfile and
the peers of any module a package hosts.
