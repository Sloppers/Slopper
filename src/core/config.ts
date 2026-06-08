import * as core from '@actions/core'
import { parse as parseYaml } from 'yaml'
import { GitHubClient } from '../clients/github'

export interface AutoCloseConfig {
  enabled: boolean
  threshold: number
  comment: string
}

export interface AutoApproveConfig {
  enabled: boolean
  threshold: number
}

export interface AutoRequestReviewConfig {
  enabled: boolean
  threshold: number
  reviewers: string[]
}

export interface ActionsConfig {
  auto_close: AutoCloseConfig
  auto_approve: AutoApproveConfig
  auto_request_review: AutoRequestReviewConfig
}

export interface ThresholdsConfig {
  low: number
  medium: number
  high: number
}

export interface SprayWeightsConfig {
  repos: number
  volume: number
  merge_ratio: number
  account_age: number
}

export type ScoreWeightsConfig = Record<string, number>

export interface LabelThresholdsConfig {
  spray_score: number
  spray_weights: SprayWeightsConfig
  new_account_days: number
  activity_burst_prs: number
  activity_burst_days: number
  merge_ratio_suspect: number
  security_review_score: number
  suspicious_score: number
  score_weights: ScoreWeightsConfig
}

export interface PatternsConfig {
  lockfiles: string[]
  manifest_files: string[]
  ci_paths: string[]
  dependency_files: string[]
  test_patterns: string[]
  source_extensions: string[]
  supply_chain_patterns: string[]
  linked_issue_patterns: string[]
  min_duplicate_lines: number
  min_duplicate_blocks: number
}

export interface RulesConfig {
  require_description: boolean
  require_linked_issue: boolean
  max_files_changed: number
  max_total_changes: number
  max_file_changes: number
  block_first_time_contributors: boolean
}

export interface SlopperConfig {
  vouched: string[]
  banned: string[]
  trusted_orgs: string[]
  actions: ActionsConfig
  thresholds: ThresholdsConfig
  label_thresholds: LabelThresholdsConfig
  ignore_paths: string[]
  ignore_folders: string[]
  patterns: PatternsConfig
  rules: RulesConfig
}

const DEFAULT_CONFIG: SlopperConfig = {
  vouched: [],
  banned: [],
  trusted_orgs: [],
  actions: {
    auto_close: {
      enabled: false,
      threshold: 9,
      comment: 'This PR was automatically closed by Slopper due to critical risk score.'
    },
    auto_approve: {
      enabled: false,
      threshold: 2
    },
    auto_request_review: {
      enabled: false,
      threshold: 6,
      reviewers: []
    }
  },
  thresholds: {
    low: 2,
    medium: 5,
    high: 8
  },
  label_thresholds: {
    spray_score: 60,
    new_account_days: 30,
    activity_burst_prs: 10,
    activity_burst_days: 7,
    spray_weights: {
      repos: 40,
      volume: 30,
      merge_ratio: 20,
      account_age: 10
    },
    merge_ratio_suspect: 0.4,
    security_review_score: 6,
    suspicious_score: 8,
    score_weights: {
      spray_and_pray: 3,
      supply_chain: 2,
      activity_burst: 2,
      new_account: 1,
      low_merge_ratio: 1,
      risky_user: 1,
      unsigned_commits: 1,
      no_tests: 1,
      first_time_contributor: 1,
      ci_modified: 1,
      dependencies_modified: 1,
      missing_description: 1,
      no_linked_issue: 1,
      too_many_files: 1,
      heavy_changes: 1,
      large_file: 1,
      code_duplication: 1,
      trusted_org: -2,
      verified_org: -1
    }
  },
  ignore_paths: [],
  ignore_folders: [],
  patterns: {
    lockfiles: [
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'Pipfile.lock', 'poetry.lock', 'go.sum',
      'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'pubspec.lock'
    ],
    manifest_files: [
      'package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml',
      'go.mod', 'Cargo.toml', 'Gemfile', 'composer.json', 'pubspec.yaml'
    ],
    ci_paths: [
      '.github/workflows/', '.github/actions/', '.gitlab-ci',
      '.circleci/', '.travis.yml', 'Jenkinsfile', 'azure-pipelines'
    ],
    dependency_files: [
      'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'requirements.txt', 'Pipfile.lock', 'poetry.lock', 'go.sum', 'go.mod',
      'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'pubspec.lock'
    ],
    test_patterns: [
      '/__tests__/', '\\.test\\.[jt]sx?$', '\\.spec\\.[jt]sx?$',
      '_test\\.go$', 'test_.*\\.py$', '.*_test\\.py$',
      '/tests?/', '\\.tests?\\.[jt]sx?$'
    ],
    source_extensions: [
      'ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rb', 'java', 'rs', 'cs', 'cpp', 'c', 'swift', 'kt'
    ],
    supply_chain_patterns: [
      '(-\\s*"version":\\s*"\\d+\\.\\d+\\.\\d+".*\\n\\+\\s*"version":\\s*"\\d+\\.\\d+\\.\\d+")',
      '\\+.*install_requires.*\\n.*(?:http|ftp|git\\+)',
      '\\+.*"resolved":\\s*"https?:\\/\\/(?!registry\\.npmjs\\.org|registry\\.yarnpkg\\.com)'
    ],
    linked_issue_patterns: [
      '(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#\\d+',
      '#\\d+'
    ],
    min_duplicate_lines: 6,
    min_duplicate_blocks: 2
  },
  rules: {
    require_description: false,
    require_linked_issue: false,
    max_files_changed: 0,
    max_total_changes: 1500,
    max_file_changes: 800,
    block_first_time_contributors: false
  }
}

export class ConfigLoader {
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    this.github = github
  }

  async load(): Promise<SlopperConfig> {
    const content = await this.github.getFileContent('.slopper')
    let config: SlopperConfig

    if (!content) {
      core.info('No .slopper configuration file found — using defaults')
      config = { ...DEFAULT_CONFIG }
    } else if (this.isYaml(content)) {
      config = this.parseYamlConfig(content)
    } else {
      config = this.parsePlainText(content)
    }

    await this.mergeUserLists(config)
    return config
  }

  private async mergeUserLists(config: SlopperConfig): Promise<void> {
    const [bannedFiles, vouchedFiles] = await Promise.all([
      this.github.listDirectory('.slopper.d/banned'),
      this.github.listDirectory('.slopper.d/vouched'),
    ])

    const bannedSet = new Set(config.banned.map(u => u.toLowerCase()))
    for (const name of bannedFiles) {
      if (!bannedSet.has(name.toLowerCase())) {
        config.banned.push(name)
        bannedSet.add(name.toLowerCase())
      }
    }

    const vouchedSet = new Set(config.vouched.map(u => u.toLowerCase()))
    for (const name of vouchedFiles) {
      if (!vouchedSet.has(name.toLowerCase())) {
        config.vouched.push(name)
        vouchedSet.add(name.toLowerCase())
      }
    }

    if (bannedFiles.length > 0 || vouchedFiles.length > 0) {
      core.info(`[config] Merged from .slopper.d/: ${bannedFiles.length} banned, ${vouchedFiles.length} vouched`)
    }
  }

  private isYaml(content: string): boolean {
    return /^\s*(vouched|banned|trusted_orgs|actions|thresholds|label_thresholds|ignore_paths|ignore_folders|patterns|rules)\s*:/m.test(content)
  }

  private parseYamlConfig(content: string): SlopperConfig {
    const parsed = parseYaml(content) ?? {}
    return this.mergeWithDefaults(parsed)
  }

  private parsePlainText(content: string): SlopperConfig {
    const vouched = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    return { ...DEFAULT_CONFIG, vouched }
  }

  private mergeWithDefaults(parsed: Record<string, unknown>): SlopperConfig {
    const vouched = Array.isArray(parsed.vouched)
      ? (parsed.vouched as string[])
      : DEFAULT_CONFIG.vouched

    const banned = Array.isArray(parsed.banned)
      ? (parsed.banned as string[])
      : DEFAULT_CONFIG.banned

    const trusted_orgs = Array.isArray(parsed.trusted_orgs)
      ? (parsed.trusted_orgs as string[])
      : DEFAULT_CONFIG.trusted_orgs

    const parsedActions = (parsed.actions ?? {}) as Record<string, unknown>
    const parsedAutoClose = (parsedActions.auto_close ?? {}) as Record<string, unknown>
    const parsedAutoApprove = (parsedActions.auto_approve ?? {}) as Record<string, unknown>
    const parsedAutoRequestReview = (parsedActions.auto_request_review ?? {}) as Record<string, unknown>

    const actions: ActionsConfig = {
      auto_close: {
        enabled: Boolean(parsedAutoClose.enabled ?? DEFAULT_CONFIG.actions.auto_close.enabled),
        threshold: Number(parsedAutoClose.threshold ?? DEFAULT_CONFIG.actions.auto_close.threshold),
        comment: String(parsedAutoClose.comment ?? DEFAULT_CONFIG.actions.auto_close.comment)
      },
      auto_approve: {
        enabled: Boolean(parsedAutoApprove.enabled ?? DEFAULT_CONFIG.actions.auto_approve.enabled),
        threshold: Number(parsedAutoApprove.threshold ?? DEFAULT_CONFIG.actions.auto_approve.threshold)
      },
      auto_request_review: {
        enabled: Boolean(parsedAutoRequestReview.enabled ?? DEFAULT_CONFIG.actions.auto_request_review.enabled),
        threshold: Number(parsedAutoRequestReview.threshold ?? DEFAULT_CONFIG.actions.auto_request_review.threshold),
        reviewers: Array.isArray(parsedAutoRequestReview.reviewers)
          ? (parsedAutoRequestReview.reviewers as string[])
          : DEFAULT_CONFIG.actions.auto_request_review.reviewers
      }
    }

    const parsedThresholds = (parsed.thresholds ?? {}) as Record<string, unknown>
    const thresholds: ThresholdsConfig = {
      low: Number(parsedThresholds.low ?? DEFAULT_CONFIG.thresholds.low),
      medium: Number(parsedThresholds.medium ?? DEFAULT_CONFIG.thresholds.medium),
      high: Number(parsedThresholds.high ?? DEFAULT_CONFIG.thresholds.high)
    }

    const parsedLabelThresholds = (parsed.label_thresholds ?? {}) as Record<string, unknown>
    const label_thresholds: LabelThresholdsConfig = {
      spray_score: Number(parsedLabelThresholds.spray_score ?? DEFAULT_CONFIG.label_thresholds.spray_score),
      new_account_days: Number(parsedLabelThresholds.new_account_days ?? DEFAULT_CONFIG.label_thresholds.new_account_days),
      activity_burst_prs: Number(parsedLabelThresholds.activity_burst_prs ?? DEFAULT_CONFIG.label_thresholds.activity_burst_prs),
      activity_burst_days: Number(parsedLabelThresholds.activity_burst_days ?? DEFAULT_CONFIG.label_thresholds.activity_burst_days),
      spray_weights: (() => {
        const pw = (parsedLabelThresholds.spray_weights ?? {}) as Record<string, unknown>
        const dw = DEFAULT_CONFIG.label_thresholds.spray_weights
        return {
          repos: Number(pw.repos ?? dw.repos),
          volume: Number(pw.volume ?? dw.volume),
          merge_ratio: Number(pw.merge_ratio ?? dw.merge_ratio),
          account_age: Number(pw.account_age ?? dw.account_age)
        }
      })(),
      merge_ratio_suspect: Number(parsedLabelThresholds.merge_ratio_suspect ?? DEFAULT_CONFIG.label_thresholds.merge_ratio_suspect),
      security_review_score: Number(parsedLabelThresholds.security_review_score ?? DEFAULT_CONFIG.label_thresholds.security_review_score),
      suspicious_score: Number(parsedLabelThresholds.suspicious_score ?? DEFAULT_CONFIG.label_thresholds.suspicious_score),
      score_weights: (() => {
        const pw = (parsedLabelThresholds.score_weights ?? {}) as Record<string, unknown>
        const merged: Record<string, number> = { ...DEFAULT_CONFIG.label_thresholds.score_weights }
        for (const [k, v] of Object.entries(pw)) {
          merged[k] = Number(v)
        }
        return merged
      })()
    }

    const ignore_paths = Array.isArray(parsed.ignore_paths)
      ? (parsed.ignore_paths as string[])
      : DEFAULT_CONFIG.ignore_paths

    const ignore_folders = Array.isArray(parsed.ignore_folders)
      ? (parsed.ignore_folders as string[])
      : DEFAULT_CONFIG.ignore_folders

    const parsedPatterns = (parsed.patterns ?? {}) as Record<string, unknown>
    const dp = DEFAULT_CONFIG.patterns
    const patterns: PatternsConfig = {
      lockfiles: Array.isArray(parsedPatterns.lockfiles)
        ? (parsedPatterns.lockfiles as string[]) : dp.lockfiles,
      manifest_files: Array.isArray(parsedPatterns.manifest_files)
        ? (parsedPatterns.manifest_files as string[]) : dp.manifest_files,
      ci_paths: Array.isArray(parsedPatterns.ci_paths)
        ? (parsedPatterns.ci_paths as string[]) : dp.ci_paths,
      dependency_files: Array.isArray(parsedPatterns.dependency_files)
        ? (parsedPatterns.dependency_files as string[]) : dp.dependency_files,
      test_patterns: Array.isArray(parsedPatterns.test_patterns)
        ? (parsedPatterns.test_patterns as string[]) : dp.test_patterns,
      source_extensions: Array.isArray(parsedPatterns.source_extensions)
        ? (parsedPatterns.source_extensions as string[]) : dp.source_extensions,
      supply_chain_patterns: Array.isArray(parsedPatterns.supply_chain_patterns)
        ? (parsedPatterns.supply_chain_patterns as string[]) : dp.supply_chain_patterns,
      linked_issue_patterns: Array.isArray(parsedPatterns.linked_issue_patterns)
        ? (parsedPatterns.linked_issue_patterns as string[]) : dp.linked_issue_patterns,
      min_duplicate_lines: Number(parsedPatterns.min_duplicate_lines ?? dp.min_duplicate_lines),
      min_duplicate_blocks: Number(parsedPatterns.min_duplicate_blocks ?? dp.min_duplicate_blocks)
    }

    const parsedRules = (parsed.rules ?? {}) as Record<string, unknown>
    const rules: RulesConfig = {
      require_description: Boolean(parsedRules.require_description ?? DEFAULT_CONFIG.rules.require_description),
      require_linked_issue: Boolean(parsedRules.require_linked_issue ?? DEFAULT_CONFIG.rules.require_linked_issue),
      max_files_changed: Number(parsedRules.max_files_changed ?? DEFAULT_CONFIG.rules.max_files_changed),
      max_total_changes: Number(parsedRules.max_total_changes ?? DEFAULT_CONFIG.rules.max_total_changes),
      max_file_changes: Number(parsedRules.max_file_changes ?? DEFAULT_CONFIG.rules.max_file_changes),
      block_first_time_contributors: Boolean(parsedRules.block_first_time_contributors ?? DEFAULT_CONFIG.rules.block_first_time_contributors)
    }

    return { vouched, banned, trusted_orgs, actions, thresholds, label_thresholds, ignore_paths, ignore_folders, patterns, rules }
  }
}
