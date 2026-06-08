import { CheckDef, CheckContext, AgenticCheckDef, AgenticCheckContext, prHeader, prDescription, commitMessages, prStats, diffBlock, filesList, authorSection } from './check'
import { Indicators } from '../label-factory'


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


export const ALL_AGENTIC_CHECKS: AgenticCheckDef[] = [
  {
    key: 'slop-content',
    label: Indicators.AI_SLOP_CONTENT,
    description: 'Detects generic AI-generated slop: phantom fixes, boilerplate inflation, templated descriptions',
    triggerKey: 'is_slop',
    toolName: 'submit_slop_check',
    triggerDescription: 'Whether this PR appears to be AI-generated slop',
    weight: 2,
    buildPrompt: (ctx: AgenticCheckContext) => ({
      system: `You are a slop detector for open source pull requests. Your job is to determine if a PR is generic AI-generated noise that wastes maintainer time.

Signs of slop:
- Phantom fixes: claims to fix a problem that doesn't exist or nobody reported
- Boilerplate inflation: generic commit messages, templated PR descriptions, verbose comments that restate obvious code
- Well-formed noise: syntactically clean code that adds no real value — duplicate functionality, unnecessary abstractions, cosmetic refactors
- Generic descriptions: "Improve robustness", "Enhance maintainability", "Refactor for clarity" with no specific context

Signs it's NOT slop:
- References a specific issue or bug report
- Addresses a real, documented need
- Author has engaged in discussion before submitting
- Changes are specific and targeted, not sweeping

Be skeptical but fair. Call the tool with your assessment.`,
      user: [prHeader(ctx), prDescription(ctx), commitMessages(ctx), prStats(ctx), diffBlock(ctx, 8000)].join('\n\n')
    })
  },
  {
    key: 'description-mismatch',
    label: Indicators.AI_DESCRIPTION_MISMATCH,
    description: 'Detects when PR description does not match what the diff actually does',
    triggerKey: 'has_mismatch',
    toolName: 'submit_mismatch_check',
    triggerDescription: 'Whether the description misrepresents the actual changes',
    weight: 1,
    buildPrompt: (ctx: AgenticCheckContext) => ({
      system: `You are a PR description auditor. Your job is to determine if a pull request's title and description accurately reflect what the code diff actually does.

Flag a mismatch when:
- The description claims to fix something but the diff doesn't address it
- The description is vague/generic while the changes are specific (or vice versa)
- The description mentions features or changes not present in the diff
- The diff contains significant changes not mentioned in the description

Do NOT flag when:
- The description is simply brief but accurate
- Minor omissions of trivial details
- The PR has no description (that's a different check)

Call the tool with your assessment.`,
      user: [prHeader(ctx), prDescription(ctx), filesList(ctx), diffBlock(ctx, 8000)].join('\n\n')
    })
  },
  {
    key: 'code-quality',
    label: Indicators.AI_CODE_QUALITY,
    description: 'Detects subtle code quality issues: missing edge cases, unnecessary complexity, duplicate functionality',
    triggerKey: 'has_issues',
    toolName: 'submit_quality_check',
    triggerDescription: 'Whether significant quality issues were found',
    weight: 1,
    buildPrompt: (ctx: AgenticCheckContext) => ({
      system: `You are a code quality reviewer focused on detecting "well-formed noise" — code that looks clean on the surface but has real problems underneath.

Flag quality issues when you find:
- Missing edge cases: error handling absent, boundary conditions ignored, null/undefined not considered
- Unnecessary complexity: abstraction layers that add no value, over-engineered solutions for simple problems
- Duplicate functionality: code that reimplements something already available in the project or standard library
- Logic errors: subtle bugs that would pass CI but fail in production
- Performance anti-patterns: O(n²) when O(n) is trivial, unnecessary allocations in hot paths

Do NOT flag:
- Style preferences (naming, formatting)
- Minor improvements that are debatable
- Code that follows the project's existing patterns even if you'd do it differently

Be specific. Vague concerns are not useful. Call the tool with your assessment.`,
      user: [prHeader(ctx), filesList(ctx), diffBlock(ctx, 10000)].join('\n\n')
    })
  },
  {
    key: 'security-concern',
    label: Indicators.AI_SECURITY_CONCERN,
    description: 'Detects security concerns: obfuscated code, credential patterns, suspicious URLs, backdoors',
    triggerKey: 'has_concerns',
    toolName: 'submit_security_check',
    triggerDescription: 'Whether security concerns were found',
    weight: 2,
    buildPrompt: (ctx: AgenticCheckContext) => ({
      system: `You are a security reviewer for open source pull requests. Your job is to detect potentially malicious or dangerous code changes.

Flag security concerns when you find:
- Obfuscated code: base64 blobs, hex-encoded strings, minified code in non-minified contexts
- Dynamic code execution: eval(), exec(), Function constructor, import() with variable arguments
- Credential/secret patterns: hardcoded API keys, tokens, passwords, connection strings
- Suspicious URLs: raw IPs, unusual domains, data exfiltration endpoints
- CI/CD tampering: changes to workflows that add code execution, modify permissions, or disable checks
- Dependency manipulation: adding unexpected packages, changing registries, typosquatting names
- Backdoor patterns: hidden functionality, conditional execution based on environment, network calls to external services

Do NOT flag:
- Standard use of environment variables for configuration
- Normal CI/CD pipeline changes (adding tests, updating versions)
- Dependencies that are well-known and appropriate for the project

Err on the side of caution — false positives are better than missed security issues. Call the tool with your assessment.`,
      user: [prHeader(ctx), filesList(ctx, { showBinary: true }), diffBlock(ctx, 10000)].join('\n\n')
    })
  },
  {
    key: 'suspicious-author',
    label: Indicators.AI_SUSPICIOUS_AUTHOR,
    description: 'Evaluates the PR author profile for patterns common in slop accounts',
    triggerKey: 'is_suspicious',
    toolName: 'submit_author_check',
    triggerDescription: 'Whether this author profile shows suspicious patterns',
    weight: 2,
    buildPrompt: (ctx: AgenticCheckContext) => ({
      system: `You are an investigator analyzing GitHub user profiles to detect accounts likely used for AI slop spam, reputation farming, or supply-chain attacks.

Suspicious patterns:
- Very new account with high PR volume across many unrelated repos
- Low or zero merge ratio despite many PRs (contributions get rejected or ignored)
- No meaningful activity besides opening PRs (no issues, no discussions, no stars)
- Bot-like behavior: burst activity patterns, PRs submitted at regular intervals
- Username follows common bot/throwaway patterns (random characters, sequential numbers)
- Bio or profile is empty or contains generic AI-generated text
- Account follows many users but has very few followers (follow-farming)
- PRs target unrelated repos with no domain focus (spray-and-pray)

Signs of a legitimate contributor:
- Consistent history in a specific domain or ecosystem
- Healthy merge ratio (most PRs get accepted)
- Engages in issues and discussions, not just PRs
- Account age proportional to activity level
- Has starred repos related to their contributions

Be fair. New accounts are not automatically suspicious — look for the combination of signals. Call the tool with your assessment.`,
      user: authorSection(ctx)
    })
  }
]

export function allAgenticChecks(): AgenticCheckDef[] {
  return [...ALL_AGENTIC_CHECKS]
}
