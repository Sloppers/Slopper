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

export interface ScoreWeightsConfig {
  fingerprint: number
  spray: number
  new_account: number
  low_merge_ratio: number
  risky_user: number
  trusted_org: number
}

export interface LabelThresholdsConfig {
  ai_likely: number
  ai_possibly: number
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

export interface RulesConfig {
  require_description: boolean
  require_linked_issue: boolean
  max_files_changed: number
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
    ai_likely: 70,
    ai_possibly: 40,
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
      fingerprint: 4,
      spray: 3,
      new_account: 1,
      low_merge_ratio: 1,
      risky_user: 1,
      trusted_org: -2
    }
  },
  ignore_paths: [],
  rules: {
    require_description: false,
    require_linked_issue: false,
    max_files_changed: 0,
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
    if (!content) {
      core.info('No .slopper configuration file found — using defaults')
      return { ...DEFAULT_CONFIG }
    }

    if (this.isYaml(content)) {
      return this.parseYamlConfig(content)
    }

    return this.parsePlainText(content)
  }

  private isYaml(content: string): boolean {
    return /^\s*(vouched|banned|trusted_orgs|actions|thresholds|label_thresholds|ignore_paths|rules)\s*:/m.test(content)
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
      ai_likely: Number(parsedLabelThresholds.ai_likely ?? DEFAULT_CONFIG.label_thresholds.ai_likely),
      ai_possibly: Number(parsedLabelThresholds.ai_possibly ?? DEFAULT_CONFIG.label_thresholds.ai_possibly),
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
        const dw = DEFAULT_CONFIG.label_thresholds.score_weights
        return {
          fingerprint: Number(pw.fingerprint ?? dw.fingerprint),
          spray: Number(pw.spray ?? dw.spray),
          new_account: Number(pw.new_account ?? dw.new_account),
          low_merge_ratio: Number(pw.low_merge_ratio ?? dw.low_merge_ratio),
          risky_user: Number(pw.risky_user ?? dw.risky_user),
          trusted_org: Number(pw.trusted_org ?? dw.trusted_org)
        }
      })()
    }

    const ignore_paths = Array.isArray(parsed.ignore_paths)
      ? (parsed.ignore_paths as string[])
      : DEFAULT_CONFIG.ignore_paths

    const parsedRules = (parsed.rules ?? {}) as Record<string, unknown>
    const rules: RulesConfig = {
      require_description: Boolean(parsedRules.require_description ?? DEFAULT_CONFIG.rules.require_description),
      require_linked_issue: Boolean(parsedRules.require_linked_issue ?? DEFAULT_CONFIG.rules.require_linked_issue),
      max_files_changed: Number(parsedRules.max_files_changed ?? DEFAULT_CONFIG.rules.max_files_changed),
      block_first_time_contributors: Boolean(parsedRules.block_first_time_contributors ?? DEFAULT_CONFIG.rules.block_first_time_contributors)
    }

    return { vouched, banned, trusted_orgs, actions, thresholds, label_thresholds, ignore_paths, rules }
  }
}
