import { AnalysisResult, FileInfo, PrData, AuthorProfileAnalysis } from '../../core/types'
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig, PatternsConfig, SlopperConfig } from '../../core/config'

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
