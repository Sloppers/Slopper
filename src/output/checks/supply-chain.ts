import { CheckDef, CheckContext, basename } from './check'
import { Indicators } from '../label-factory'

function evaluate(ctx: CheckContext): boolean {
  if (!ctx.prData) return false
  const lockfiles = new Set(ctx.patterns.lockfiles)
  const manifests = new Set(ctx.patterns.manifest_files)

  const hasLockfile = ctx.files.some(f => lockfiles.has(basename(f.filename)))
  const hasManifest = ctx.files.some(f => manifests.has(basename(f.filename)))
  if (!hasLockfile && !hasManifest) return false

  const lockfileWithoutManifest =
    ctx.files.some(f => lockfiles.has(basename(f.filename))) &&
    !ctx.files.some(f => manifests.has(basename(f.filename)))

  if (lockfileWithoutManifest) return true

  const diff = ctx.prData.diff.toLowerCase()
  return ctx.patterns.supply_chain_patterns
    .map(p => new RegExp(p))
    .some(r => r.test(diff))
}

export const supplyChain: CheckDef = {
  label: Indicators.SUPPLY_CHAIN,
  weight: 2,
  evaluate
}
