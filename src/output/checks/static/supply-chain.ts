import { Check, CheckContext } from '../check'
import { Indicators } from '../../label-factory'

const LOCKFILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'Pipfile.lock', 'poetry.lock', 'go.sum',
  'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'pubspec.lock'
])

const MANIFEST_FILES = new Set([
  'package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml',
  'go.mod', 'Cargo.toml', 'Gemfile', 'composer.json', 'pubspec.yaml'
])

export class SupplyChainCheck extends Check {
  readonly label = Indicators.SUPPLY_CHAIN
  readonly defaultWeight = 2

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.prData) return false

    const hasLockfileChange = ctx.files.some(f => LOCKFILES.has(basename(f.filename)))
    const hasManifestChange = ctx.files.some(f => MANIFEST_FILES.has(basename(f.filename)))

    if (!hasLockfileChange && !hasManifestChange) return false

    return this.hasLockfileWithoutManifest(ctx) || this.hasSuspiciousDiffPatterns(ctx)
  }

  private hasLockfileWithoutManifest(ctx: CheckContext): boolean {
    const changedLockfiles = ctx.files.filter(f => LOCKFILES.has(basename(f.filename)))
    const changedManifests = ctx.files.filter(f => MANIFEST_FILES.has(basename(f.filename)))
    return changedLockfiles.length > 0 && changedManifests.length === 0
  }

  private hasSuspiciousDiffPatterns(ctx: CheckContext): boolean {
    if (!ctx.prData) return false
    const diff = ctx.prData.diff.toLowerCase()
    const patterns = [
      /(-\s*"version":\s*"\d+\.\d+\.\d+".*\n\+\s*"version":\s*"\d+\.\d+\.\d+")/,
      /\+.*install_requires.*\n.*(?:http|ftp|git\+)/,
      /\+.*"resolved":\s*"https?:\/\/(?!registry\.npmjs\.org|registry\.yarnpkg\.com)/,
    ]
    return patterns.some(p => p.test(diff))
  }
}

function basename(filepath: string): string {
  return filepath.split('/').pop() ?? ''
}
