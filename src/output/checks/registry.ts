import { CheckDef, CheckContext } from './check'
import { Indicators } from '../label-factory'

// --- helpers for complex checks ---

function basename(filepath: string): string {
  return filepath.split('/').pop() ?? ''
}

function evaluateSupplyChain(ctx: CheckContext): boolean {
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

function evaluateNoTests(ctx: CheckContext): boolean {
  const testRegexes = ctx.patterns.test_patterns.map(p => new RegExp(p))
  const extRegex = new RegExp('\\.(' + ctx.patterns.source_extensions.join('|') + ')$')
  const isTest = (f: string) => testRegexes.some(r => r.test(f))

  const sourceFiles = ctx.files.filter(f =>
    extRegex.test(f.filename) && !isTest(f.filename) && f.additions > 0
  )
  if (sourceFiles.length === 0) return false

  return ctx.files.filter(f => isTest(f.filename) && f.additions > 0).length === 0
}

function evaluateCodeDuplication(ctx: CheckContext): boolean {
  if (!ctx.prData) return false
  const minLines = ctx.patterns.min_duplicate_lines
  const blocks = extractAddedBlocks(ctx.prData.diff, minLines)
  if (blocks.length < ctx.patterns.min_duplicate_blocks) return false
  const seen = new Set<string>()
  for (const block of blocks) {
    if (seen.has(block)) return true
    seen.add(block)
  }
  return false
}

function extractAddedBlocks(diff: string, minLines: number): string[] {
  const blocks: string[] = []
  let current: string[] = []

  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1).trim()
      if (content.length > 0) {
        current.push(content)
        continue
      }
    }
    if (current.length >= minLines) {
      blocks.push(current.join('\n'))
    }
    current = []
  }
  if (current.length >= minLines) {
    blocks.push(current.join('\n'))
  }
  return blocks
}

// --- registry ---

export const ALL_CHECKS: CheckDef[] = [
  {
    label: Indicators.FIRST_TIME_CONTRIBUTOR,
    weight: 1,
    evaluate: ctx => ctx.firstTimeContributor
  },
  {
    label: Indicators.CI_MODIFIED,
    weight: 1,
    evaluate: ctx => ctx.files.some(f => ctx.patterns.ci_paths.some(p => f.filename.includes(p)))
  },
  {
    label: Indicators.DEPENDENCIES_MODIFIED,
    weight: 1,
    evaluate: ctx => {
      const depFiles = new Set(ctx.patterns.dependency_files)
      return ctx.files.some(f => depFiles.has(basename(f.filename)))
    }
  },
  {
    label: Indicators.SPRAY_AND_PRAY,
    weight: 3,
    evaluate: ctx => !!ctx.authorProfile && ctx.authorProfile.spray_score > ctx.labelThresholds.spray_score,
    scoreFactor: ctx => ctx.authorProfile ? ctx.authorProfile.spray_score / 100 : 0
  },
  {
    label: Indicators.ACTIVITY_BURST,
    weight: 2,
    evaluate: ctx => {
      if (!ctx.authorProfile) return false
      const prs = ctx.authorProfile.prs_in_burst_window ?? ctx.authorProfile.prs_last_7d
      return prs > ctx.labelThresholds.activity_burst_prs
    }
  },
  {
    label: Indicators.NEW_ACCOUNT,
    weight: 1,
    evaluate: ctx => !!ctx.authorProfile && ctx.authorProfile.account_age_days < ctx.labelThresholds.new_account_days
  },
  {
    label: Indicators.MISSING_DESCRIPTION,
    weight: 1,
    evaluate: ctx => ctx.rules.require_description && !!ctx.prData && !ctx.prData.body.trim()
  },
  {
    label: Indicators.NO_LINKED_ISSUE,
    weight: 1,
    evaluate: ctx => {
      if (!ctx.rules.require_linked_issue || !ctx.prData) return false
      const body = ctx.prData.body
      const regexes = ctx.patterns.linked_issue_patterns.map(p => new RegExp(p, 'i'))
      return !regexes.some(r => r.test(body))
    }
  },
  {
    label: Indicators.TOO_MANY_FILES,
    weight: 1,
    evaluate: ctx =>
      ctx.rules.max_files_changed > 0 && !!ctx.prData && ctx.prData.changed_files_count > ctx.rules.max_files_changed
  },
  {
    label: Indicators.RISKY_USER,
    weight: 1,
    evaluate: ctx => !!ctx.riskyUser
  },
  {
    label: Indicators.TRUSTED_ORG,
    weight: -2,
    evaluate: ctx => !!ctx.trustedOrg
  },
  {
    label: Indicators.HEAVY_CHANGES,
    weight: 1,
    evaluate: ctx => {
      if (!ctx.prData || ctx.rules.max_total_changes <= 0) return false
      return ctx.prData.additions + ctx.prData.deletions > ctx.rules.max_total_changes
    }
  },
  {
    label: Indicators.LARGE_FILE,
    weight: 1,
    evaluate: ctx => {
      if (ctx.rules.max_file_changes <= 0) return false
      return ctx.files.some(f => f.additions + f.deletions > ctx.rules.max_file_changes)
    }
  },
  {
    label: Indicators.LOW_MERGE_RATIO,
    weight: 1,
    evaluate: ctx => !!ctx.authorProfile && ctx.authorProfile.merge_ratio < ctx.labelThresholds.merge_ratio_suspect
  },
  {
    label: Indicators.SUPPLY_CHAIN,
    weight: 2,
    evaluate: evaluateSupplyChain
  },
  {
    label: Indicators.UNSIGNED_COMMITS,
    weight: 1,
    evaluate: ctx => {
      if (!ctx.prData) return false
      const { commits } = ctx.prData
      return commits.unsigned_count > 0 || commits.author_committer_mismatches > 0
    },
    scoreFactor: ctx => {
      if (!ctx.prData) return 0
      const { commits } = ctx.prData
      if (commits.count === 0) return 0
      const unsignedRatio = commits.unsigned_count / commits.count
      const mismatchRatio = commits.author_committer_mismatches / commits.count
      return Math.min(1, unsignedRatio + mismatchRatio)
    }
  },
  {
    label: Indicators.NO_TESTS,
    weight: 1,
    evaluate: evaluateNoTests
  },
  {
    label: Indicators.CODE_DUPLICATION,
    weight: 1,
    evaluate: evaluateCodeDuplication
  },
  {
    label: Indicators.VERIFIED_ORG,
    weight: -1,
    evaluate: ctx => !!ctx.verifiedOrg
  }
]
