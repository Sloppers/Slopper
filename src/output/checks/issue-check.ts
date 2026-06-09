import { IssueData, AuthorProfileAnalysis } from '../../core/types'
import { ThresholdsConfig, LabelThresholdsConfig, IssueRulesConfig, SlopperConfig } from '../../core/config'
import { AgenticCheckBase } from './check'

export interface IssueCheckContext {
  score: number
  issueData: IssueData
  authorProfile?: AuthorProfileAnalysis
  recentIssues?: IssueData[]
  riskyUser?: boolean
  trustedOrg?: boolean
  verifiedOrg?: boolean
  thresholds: ThresholdsConfig
  labelThresholds: LabelThresholdsConfig
  rules: IssueRulesConfig
}

export interface IssueScoreResult {
  key: string
  factor: number
  weight: number
  points: number
}

export interface IssueCheckDef {
  label: string
  weight: number
  evaluate: (ctx: IssueCheckContext) => boolean
  scoreFactor?: (ctx: IssueCheckContext) => number
}

export interface IssueAgenticCheckDef extends AgenticCheckBase {
  buildPrompt: (ctx: IssueCheckContext) => { system: string; user: string }
}

const DEFAULT_THRESHOLDS: ThresholdsConfig = { low: 2, medium: 5, high: 8 }

const DEFAULT_LABEL_THRESHOLDS: LabelThresholdsConfig = {
  spray_score: 60, new_account_days: 30,
  activity_burst_prs: 10, activity_burst_days: 7,
  spray_weights: { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 },
  merge_ratio_suspect: 0.4, security_review_score: 6, suspicious_score: 8,
  score_weights: {}
}

const DEFAULT_ISSUE_RULES: IssueRulesConfig = {
  min_body_length: 30,
  duplicate_threshold: 0.7,
  duplicate_lookback: 50,
  auto_close_threshold: 8,
  auto_lock: false,
  auto_lock_threshold: 9
}

export interface IssueCheckContextOptions {
  score?: number
  issueData: IssueData
  authorProfile?: AuthorProfileAnalysis
  recentIssues?: IssueData[]
  riskyUser?: boolean
  trustedOrg?: boolean
  verifiedOrg?: boolean
}

export function buildIssueCheckContext(opts: IssueCheckContextOptions, config?: Partial<SlopperConfig>): IssueCheckContext {
  return {
    score: opts.score ?? 0,
    issueData: opts.issueData,
    authorProfile: opts.authorProfile,
    recentIssues: opts.recentIssues,
    riskyUser: opts.riskyUser,
    trustedOrg: opts.trustedOrg,
    verifiedOrg: opts.verifiedOrg,
    thresholds: config?.thresholds ?? DEFAULT_THRESHOLDS,
    labelThresholds: config?.label_thresholds ?? DEFAULT_LABEL_THRESHOLDS,
    rules: config?.issue_rules ?? DEFAULT_ISSUE_RULES
  }
}

export function issueSection(ctx: IssueCheckContext): string {
  const i = ctx.issueData
  let out = `## Issue #${i.issue_number}: ${i.title}\n\n`
  out += `**Body:**\n${i.body || '(empty)'}\n\n`
  out += `**Labels:** ${i.labels.length > 0 ? i.labels.join(', ') : '(none)'}\n`
  out += `**Comments:** ${i.comments_count}\n`
  out += `**Created:** ${i.created_at}\n`
  return out
}

export function issueAuthorSection(ctx: IssueCheckContext): string {
  const a = ctx.issueData.author
  let out = `## Author: @${a.login}\n\n`
  out += `**Account:**\n`
  out += `- Created: ${a.created_at}\n`
  out += `- Public repos: ${a.public_repos}\n`
  out += `- Followers: ${a.followers} | Following: ${a.following}\n`
  out += `- Bio: ${a.bio || '(empty)'}\n`
  out += `- Company: ${a.company || '(none)'}\n`
  out += `- Is bot: ${a.is_bot}\n`
  out += `- Past issues in this repo: ${a.past_issues_in_repo}\n`
  out += `- First time contributor: ${a.first_time_contributor}\n`

  const p = ctx.authorProfile
  if (p) {
    out += `\n**Activity profile:**\n`
    out += `- Account age: ${p.account_age_days} days\n`
    out += `- PRs in last 7 days: ${p.prs_last_7d}\n`
    out += `- PRs in last 30 days: ${p.prs_last_30d}\n`
    out += `- Distinct repos in last 30 days: ${p.distinct_repos_30d}\n`
    out += `- Total issues: ${p.total_issues}\n`
    out += `- Spray score: ${p.spray_score}/100\n`
    out += `- Activity burst: ${p.activity_burst}\n`
  }

  return out
}
