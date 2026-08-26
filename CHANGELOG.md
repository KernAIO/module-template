# @kernhq/module-template

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
