# @kernhq/module-template

## 0.2.11

### Patch Changes

- 41afa4c: Peer `@kernhq/kernel` at `^0.10.0`.

  A caret on 0.x does not cross a minor, so `^0.9.1` stopped reaching the framework the moment 0.10.0
  was published — `check-ranges.mjs` fails on it, and CI stops at the lint step before a single test
  runs. The module builds and tests against 0.10.0 unchanged.

  This is the package a third party clones to start a module, so the stale peer was the first thing
  an outsider met.

## 0.2.10

### Patch Changes

- test: bless the permission matrix, and name the one way to start

## 0.2.9

### Patch Changes

- docs: module services are sibling repos, not in-repo

## 0.2.8

### Patch Changes

- 829d9b9: Peer @kernhq/kernel ^0.9.1 and @kernhq/ui ^0.14.0 — the framework published; the module's ranges follow so one install resolves a single consistent kernel.

## 0.2.7

### Patch Changes

- c9cb3fc: Reach the published `@kernhq/ui`, and refresh the lockfile the range edit invalidates.

  `^0.10.0` cannot install 0.12.5 — a caret on 0.x never crosses a minor — so a host resolving this
  module from the registry is told it needs a framework two minors behind the one every service runs.
  The lockfile moves in the same commit because `--frozen-lockfile` compares specifiers, so a range
  edit on its own fails install having built nothing.

## 0.2.6

### Patch Changes

- 78cfef3: Declare the framework this is built against: `@kernhq/contracts@0.7.0`.

  `^0.6.1` cannot install 0.7.0 — a caret on 0.x never crosses a minor — so a host resolving this
  module from the registry would be told it needs a contracts two releases behind the one every
  service now runs. Typechecked against 0.7.0 in the workspace before the range moved, which is the
  only order that means anything: the umbrella pins contracts to `workspace:*`, so raising a range
  first and compiling second compiles against the old copy and proves nothing.

  The lockfile is refreshed in the same change, because `--frozen-lockfile` compares specifiers and
  a range edit alone fails install before anything is built.

## 0.2.5

### Patch Changes

- 10ed9f5: Start from the framework that exists.

  The Apache-2.0 starting point declared `@kernhq/contracts ^0.5.0` and `@kernhq/ui ^0.8.0` — two
  minors behind — and its own CI could not notice: the committed lockfile pinned `ui@0.8.0`, so
  `--frozen-lockfile` stayed green forever while anyone starting a module here began against a
  framework Kern no longer ships. It was also the only module repository without `check-ranges.mjs`,
  which is the check that would have said so; `lint` runs it now, and it also checks the lockfile and
  the peers of any module a package hosts.

## 0.2.4

### Patch Changes

- docs: update repo references for kern->app and app->shell rename

## 0.2.3

### Patch Changes

- fix: declare @kernhq/kernel and @kernhq/contracts as peerDependencies

## 0.2.2

### Patch Changes

- docs: the map — what a module is, and the one optional part

## 0.2.1

### Patch Changes

- chore: refresh the lockfile for the changesets dependency

## 0.2.0

### Minor Changes

- 74bbf84: Publish the module template.

  It was `private: true`, so the Apache-2.0 half of the licensing split — the package a third party
  copies to write a closed module — could only be got by cloning an AGPL-3.0 repository. The promise
  in ADR 0005 was real in the licence header and unreachable in practice.

  `files` now ships the whole source tree, the migrations, the drizzle config and the tsconfigs: this
  package is published to be read and copied, not imported.
