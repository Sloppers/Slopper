import { AnalysisResult, AuthorProfile, AuthorProfileAnalysis } from '../core/types'
import { SlopperConfig, ScoreWeightsConfig } from '../core/config'
import { CheckDef, CheckContext, CheckContextOptions, ScoreResult, buildCheckContext, allChecks, computeScore, DerivedIndicator, allDerivedIndicators } from './checks'
import { Labels, confidenceLabel, riskLabel } from './label-factory'

export type Check = CheckDef
export type { CheckContext, ScoreResult }
export type ComputeLabelsOptions = CheckContextOptions

export class LabelComputer {
  private readonly config: Partial<SlopperConfig>
  private readonly checks: CheckDef[]
  private readonly derivedIndicators: DerivedIndicator[]

  constructor(config?: Partial<SlopperConfig>) {
    this.config = config ?? {}
    this.checks = allChecks()
    this.derivedIndicators = allDerivedIndicators()
  }

  compute(opts: ComputeLabelsOptions): string[] {
    const score = opts.analysis
      ? opts.analysis.risk_score
      : this.computeScoreFromChecks(opts).score

    const thresholds = this.config.thresholds ?? { low: 2, medium: 5, high: 8 }
    if (score >= thresholds.medium) {
      return [Labels.SLOP.name]
    }
    return [Labels.LEGIT.name]
  }

  computeIndicators(opts: ComputeLabelsOptions): string[] {
    const score = opts.analysis
      ? opts.analysis.risk_score
      : this.computeScoreFromChecks(opts).score

    const ctx = buildCheckContext({ ...opts, score }, this.config)

    const indicators: string[] = []

    indicators.push(riskLabel(score, ctx.thresholds))

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
    const ctx = buildCheckContext(opts, this.config)
    const weights = ctx.labelThresholds.score_weights as unknown as Record<string, number>
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
