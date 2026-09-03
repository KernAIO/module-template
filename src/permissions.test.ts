/**
 * The permission matrix, blessed rather than assumed.
 *
 * Defaults are declared one permission at a time in `contract.ts`, which makes the whole picture —
 * which built-in role ends up holding what — impossible to read from any single line. This writes
 * it out in full and compares it against what the module declares, so "a guest can see a note" is
 * something a reviewer reads instead of derives. Rows list the *effective* grants, cascade
 * included: the kernel expands declared `defaultRoles` upward through guest ⊆ member ⊆ admin ⊆
 * owner, and `permissionMatrixDiff` applies the same expansion.
 *
 * Keep this file when you copy the template. Changing a default is meant to be deliberate: edit
 * `defaultRoles` → this fails naming every row that moved → confirm that is what you meant →
 * update `BLESSED` in the same commit.
 */
import { permissionMatrixDiff } from '@kernhq/testing'
import { describe, expect, it } from 'vitest'
import { MODULE_ID, templatePermissions } from './contract.js'

/** Every built-in role that holds the permission by default, lowest role first. */
const BLESSED: Record<string, readonly string[]> = {
  'template.note.view': ['guest', 'member', 'admin', 'owner'],
  'template.note.manage': ['member', 'admin', 'owner'],
}

/** Permissions whose misuse costs data or reaches outside the workspace. None yet. */
const DANGEROUS: string[] = []

describe(`${MODULE_ID} permissions`, () => {
  it('grants each permission to exactly the blessed roles', () => {
    expect(permissionMatrixDiff(templatePermissions, BLESSED)).toEqual([])
  })

  it('namespaces every key under the module id and declares it once', () => {
    const keys = templatePermissions.map((p) => p.key)
    expect(keys.filter((key) => !key.startsWith(`${MODULE_ID}.`))).toEqual([])
    expect(keys.filter((key, i) => keys.indexOf(key) !== i)).toEqual([])
  })

  it('marks exactly the destructive permissions dangerous', () => {
    const flagged = templatePermissions.filter((p) => p.dangerous).map((p) => p.key)
    expect(flagged.toSorted()).toEqual(DANGEROUS.toSorted())
  })
})
