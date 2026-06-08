import { AnalysisResult, FileInfo, PrData, AuthorProfileAnalysis } from '../../core/types'
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig, PatternsConfig, SlopperConfig } from '../../core/config'
import { truncateDiff } from '../../core/utils'


export interface CheckContext {
  score: number
  analysis?: AnalysisResult
  files: FileInfo[]
  firstTimeContributor: boolean
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  riskyUser?: boolean
  trustedOrg?: boolean
  verifiedOrg?: boolean
  thresholds: ThresholdsConfig
  labelThresholds: LabelThresholdsConfig
  patterns: PatternsConfig
  rules: RulesConfig
}

export interface ScoreResult {
  key: string
  factor: number
  weight: number
  points: number
}

export interface CheckDef {
  label: string
  weight: number
  evaluate: (ctx: CheckContext) => boolean
  scoreFactor?: (ctx: CheckContext) => number
}

export type Check = CheckDef


export interface AgenticCheckResult {
  triggered: boolean
  label: string
  reasoning: string
  confidence: 'low' | 'medium' | 'high'
  evidence?: string[]
}

export interface AgenticCheckContext extends CheckContext {
  prData: PrData
}

export interface AgenticToolSchema {
  name: string
  description: string
  schema: Record<string, unknown>
}

export interface AgenticCheckDef {
  key: string
  label: string
  description: string
  triggerKey: string
  toolName: string
  triggerDescription: string
  weight: number
  buildPrompt: (ctx: AgenticCheckContext) => { system: string; user: string }
}

export type AgenticCheck = AgenticCheckDef

export function agenticToolSchema(check: AgenticCheckDef): AgenticToolSchema {
  return buildCheckSchema({
    toolName: check.toolName,
    triggerKey: check.triggerKey,
    triggerDescription: check.triggerDescription,
  })
}

export function parseAgenticResult(check: AgenticCheckDef, raw: Record<string, unknown>): AgenticCheckResult {
  return {
    triggered: raw[check.triggerKey] as boolean,
    label: check.label,
    reasoning: raw.reasoning as string,
    confidence: raw.confidence as 'low' | 'medium' | 'high',
    evidence: raw.evidence as string[]
  }
}


function buildCheckSchema(opts: {
  toolName: string
  triggerKey: string
  triggerDescription: string
}): AgenticToolSchema {
  return {
    name: opts.toolName,
    description: `Submit ${opts.toolName.replace(/^submit_/, '').replace(/_/g, ' ')}`,
    schema: {
      type: 'object' as const,
      additionalProperties: false,
      required: [opts.triggerKey, 'confidence', 'reasoning', 'evidence'],
      properties: {
        [opts.triggerKey]: { type: 'boolean' as const, description: opts.triggerDescription },
        confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
        reasoning: { type: 'string' as const, description: '2-3 sentence summary of findings' },
        evidence: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Specific findings with context'
        }
      }
    }
  }
}

export function prHeader(ctx: AgenticCheckContext): string {
  return `## PR: ${ctx.prData.title}`
}

export function prDescription(ctx: AgenticCheckContext): string {
  return `**Description:**\n${ctx.prData.body || '(no description)'}`
}

export function filesList(ctx: AgenticCheckContext, opts?: { showBinary?: boolean }): string {
  const lines = ctx.prData.files.map(f => {
    let line = `- ${f.filename} (+${f.additions}/-${f.deletions})`
    if (opts?.showBinary && f.is_binary) line += ' [BINARY]'
    return line
  })
  return `**Files changed:**\n${lines.join('\n')}`
}

export function diffBlock(ctx: AgenticCheckContext, maxLength: number): string {
  const diff = truncateDiff(ctx.prData.diff, maxLength)
  return `**Diff:**\n\`\`\`\n${diff}\n\`\`\``
}

export function commitMessages(ctx: AgenticCheckContext, max = 10): string {
  const msgs = ctx.prData.commits.messages.slice(0, max).map(m => `- ${m}`).join('\n')
  return `**Commits (${ctx.prData.commits.count}):**\n${msgs}`
}

export function prStats(ctx: AgenticCheckContext): string {
  return `**Files changed:** ${ctx.prData.changed_files_count}\n**Additions:** ${ctx.prData.additions} | **Deletions:** ${ctx.prData.deletions}`
}

export function authorSection(ctx: AgenticCheckContext): string {
  const a = ctx.prData.author
  let out = `## Author: @${a.login}\n\n`
  out += `**Account:**\n`
  out += `- Created: ${a.created_at}\n`
  out += `- Public repos: ${a.public_repos}\n`
  out += `- Followers: ${a.followers} | Following: ${a.following}\n`
  out += `- Bio: ${a.bio || '(empty)'}\n`
  out += `- Company: ${a.company || '(none)'}\n`
  out += `- Is bot: ${a.is_bot}\n`
  out += `- Is collaborator: ${a.is_collaborator}\n`
  out += `- Past merged PRs in this repo: ${a.past_merged_prs_in_repo}\n`
  out += `- Past issues in this repo: ${a.past_issues_in_repo}\n`
  out += `- First time contributor: ${a.first_time_contributor}\n`

  const p = ctx.authorProfile
  if (p) {
    out += `\n**Activity profile:**\n`
    out += `- Account age: ${p.account_age_days} days\n`
    out += `- PRs in last 7 days: ${p.prs_last_7d}\n`
    out += `- PRs in last 30 days: ${p.prs_last_30d}\n`
    out += `- Distinct repos in last 30 days: ${p.distinct_repos_30d}\n`
    out += `- Merge ratio: ${Math.round(p.merge_ratio * 100)}%\n`
    out += `- Total stars: ${p.total_stars}\n`
    out += `- Total issues: ${p.total_issues}\n`
    out += `- Spray score: ${p.spray_score}/100\n`
    out += `- Activity burst: ${p.activity_burst}\n`
  }

  out += `\n**PR context:**\n`
  out += `- PR title: ${ctx.prData.title}\n`
  out += `- Target repo: ${ctx.prData.repo}\n`
  out += `- Files changed: ${ctx.prData.changed_files_count}\n`

  return out
}

const DEFAULT_THRESHOLDS: ThresholdsConfig = { low: 2, medium: 5, high: 8 }

const DEFAULT_LABEL_THRESHOLDS: LabelThresholdsConfig = {
  spray_score: 60, new_account_days: 30,
  activity_burst_prs: 10, activity_burst_days: 7,
  spray_weights: { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 },
  merge_ratio_suspect: 0.4, security_review_score: 6, suspicious_score: 8,
  score_weights: {}
}

const DEFAULT_PATTERNS: PatternsConfig = {
  lockfiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Pipfile.lock', 'poetry.lock', 'go.sum', 'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'pubspec.lock'],
  manifest_files: ['package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'Gemfile', 'composer.json', 'pubspec.yaml'],
  ci_paths: ['.github/workflows/', '.github/actions/', '.gitlab-ci', '.circleci/', '.travis.yml', 'Jenkinsfile', 'azure-pipelines'],
  dependency_files: ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'requirements.txt', 'Pipfile.lock', 'poetry.lock', 'go.sum', 'go.mod', 'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'pubspec.lock'],
  test_patterns: ['/__tests__/', '\\.test\\.[jt]sx?$', '\\.spec\\.[jt]sx?$', '_test\\.go$', 'test_.*\\.py$', '.*_test\\.py$', '/tests?/', '\\.tests?\\.[jt]sx?$'],
  source_extensions: ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rb', 'java', 'rs', 'cs', 'cpp', 'c', 'swift', 'kt'],
  supply_chain_patterns: ['(-\\s*"version":\\s*"\\d+\\.\\d+\\.\\d+".*\\n\\+\\s*"version":\\s*"\\d+\\.\\d+\\.\\d+")', '\\+.*install_requires.*\\n.*(?:http|ftp|git\\+)', '\\+.*"resolved":\\s*"https?:\\/\\/(?!registry\\.npmjs\\.org|registry\\.yarnpkg\\.com)'],
  linked_issue_patterns: ['(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#\\d+', '#\\d+'],
  min_duplicate_lines: 6,
  min_duplicate_blocks: 2
}

const DEFAULT_RULES: RulesConfig = {
  require_description: false, require_linked_issue: false,
  max_files_changed: 0, max_total_changes: 1500, max_file_changes: 800,
  block_first_time_contributors: false
}

export interface CheckContextOptions {
  score?: number
  analysis?: AnalysisResult
  files: FileInfo[]
  firstTimeContributor: boolean
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  riskyUser?: boolean
  trustedOrg?: boolean
  verifiedOrg?: boolean
}

export function buildCheckContext(opts: CheckContextOptions, config?: Partial<SlopperConfig>): CheckContext {
  return {
    score: opts.score ?? 0,
    analysis: opts.analysis,
    files: opts.files,
    firstTimeContributor: opts.firstTimeContributor,
    prData: opts.prData,
    authorProfile: opts.authorProfile,
    riskyUser: opts.riskyUser,
    trustedOrg: opts.trustedOrg,
    verifiedOrg: opts.verifiedOrg,
    thresholds: config?.thresholds ?? DEFAULT_THRESHOLDS,
    labelThresholds: config?.label_thresholds ?? DEFAULT_LABEL_THRESHOLDS,
    patterns: config?.patterns ?? DEFAULT_PATTERNS,
    rules: config?.rules ?? DEFAULT_RULES
  }
}
