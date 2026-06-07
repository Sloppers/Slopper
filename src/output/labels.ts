import { AnalysisResult, AuthorProfile, FileInfo, PrData, AuthorProfileAnalysis } from '../core/types'
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig, ScoreWeightsConfig } from '../core/config'
import { Check, CheckContext, ScoreResult, allChecks, computeScore, DerivedIndicator, allDerivedIndicators } from './checks'
import { Labels, confidenceLabel, riskLabel } from './label-factory'

export type { CheckContext, ScoreResult }
export { Check }

export interface ComputeLabelsOptions {
  analysis?: AnalysisResult
  files: FileInfo[]
  firstTimeContributor: boolean
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  riskyUser?: boolean
  trustedOrg?: boolean
  verifiedOrg?: boolean
}

export class LabelComputer {
  private readonly thresholds: ThresholdsConfig
  private readonly labelThresholds: LabelThresholdsConfig
  private readonly rules: RulesConfig
  private readonly checks: Check[]
  private readonly derivedIndicators: DerivedIndicator[]

  constructor(
    thresholds?: ThresholdsConfig,
    rules?: RulesConfig,
    labelThresholds?: LabelThresholdsConfig,
    checks?: Check[]
  ) {
    this.thresholds = thresholds ?? { low: 2, medium: 5, high: 8 }
    this.labelThresholds = labelThresholds ?? {
      spray_score: 60,
      new_account_days: 30,
      activity_burst_prs: 10,
      activity_burst_days: 7,
      spray_weights: { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 },
      merge_ratio_suspect: 0.4,
      security_review_score: 6,
      suspicious_score: 8,
      score_weights: {}
    }
    this.rules = rules ?? {
      require_description: false,
      require_linked_issue: false,
      max_files_changed: 0,
      max_total_changes: 1500,
      max_file_changes: 800,
      block_first_time_contributors: false
    }
    this.checks = checks ?? allChecks()
    this.derivedIndicators = allDerivedIndicators()
  }

  compute(opts: ComputeLabelsOptions): string[] {
    const score = opts.analysis
      ? opts.analysis.risk_score
      : this.computeScoreFromChecks(opts).score

    if (score >= this.thresholds.medium) {
      return [Labels.SLOP.name]
    }
    return [Labels.LEGIT.name]
  }

  computeIndicators(opts: ComputeLabelsOptions): string[] {
    const score = opts.analysis
      ? opts.analysis.risk_score
      : this.computeScoreFromChecks(opts).score

    const ctx: CheckContext = {
      score,
      ...opts,
      thresholds: this.thresholds,
      labelThresholds: this.labelThresholds,
      rules: this.rules
    }

    const indicators: string[] = []

    indicators.push(riskLabel(score, this.thresholds))

    if (opts.analysis) {
      indicators.push(confidenceLabel(opts.analysis.confidence))
    }

    for (const check of this.checks) {
      if (check.evaluate(ctx)) {
        indicators.push(check.label)
      }
    }

    for (const indicator of this.derivedIndicators) {
      if (indicator.evaluate(ctx)) {
        indicators.push(indicator.label)
      }
    }

    return indicators
  }

  computeFailedLabels(): string[] {
    return [Labels.ANALYSIS_FAILED.name]
  }

  shouldSuggestVouch(analysis: AnalysisResult, author: AuthorProfile): boolean {
    if (analysis.risk_score !== 0) return false
    if (analysis.confidence !== 'high') return false
    if (analysis.author_assessment.trust_level !== 'trusted') return false
    if (author.is_bot) return false
    if (!author.is_collaborator && author.past_merged_prs_in_repo < 3) return false
    return true
  }

  computeScoreFromChecks(opts: ComputeLabelsOptions): { score: number; breakdown: ScoreResult[] } {
    const ctx: CheckContext = {
      score: 0,
      ...opts,
      thresholds: this.thresholds,
      labelThresholds: this.labelThresholds,
      rules: this.rules
    }
    const weights = this.labelThresholds.score_weights as unknown as Record<string, number>
    return computeScore(this.checks, ctx, weights)
  }

  static computeDeterministicScore(opts: {
    authorProfile?: AuthorProfileAnalysis
    riskyUser?: boolean
    trustedOrg?: boolean
    verifiedOrg?: boolean
    weights?: ScoreWeightsConfig
  }): number {
    const { score } = LabelComputer.computeDeterministicResult(opts)
    return score
  }

  static computeDeterministicResult(opts: {
    authorProfile?: AuthorProfileAnalysis
    riskyUser?: boolean
    trustedOrg?: boolean
    verifiedOrg?: boolean
    weights?: ScoreWeightsConfig
  }): { score: number; breakdown: ScoreResult[] } {
    const computer = new LabelComputer()
    return computer.computeScoreFromChecks({
      files: [],
      firstTimeContributor: false,
      authorProfile: opts.authorProfile,
      riskyUser: opts.riskyUser,
      trustedOrg: opts.trustedOrg,
      verifiedOrg: opts.verifiedOrg
    })
  }
}
