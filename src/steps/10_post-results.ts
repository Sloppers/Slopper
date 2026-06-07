import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { PrCommentManager } from '../output/commenter'
import { LabelComputer } from '../output/labels'
import { GitHubClient } from '../clients/github'

export class PostResultsStep extends PipelineStep {
  readonly name = 'post-results'
  private readonly commentManager: PrCommentManager
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    super()
    this.github = github
    this.commentManager = new PrCommentManager(github)
  }

  private riskLevel(score: number, thresholds = { low: 2, medium: 5, high: 8 }): string {
    if (score <= thresholds.low) return 'low'
    if (score <= thresholds.medium) return 'medium'
    if (score <= thresholds.high) return 'high'
    return 'critical'
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.labels || !ctx.prData) {
      throw new Error('labels and prData are required but missing from context')
    }

    const { labels, prNumber, prData } = ctx
    const analysisResult = ctx.analysisFailed ? undefined : ctx.analysisResult

    const score = analysisResult?.risk_score ?? ctx.deterministicScore ?? 0
    const level = analysisResult?.risk_level ?? this.riskLevel(score, ctx.config?.thresholds)
    const confidence = analysisResult?.confidence ?? 'low'

    core.setOutput('risk-score', String(score))
    core.setOutput('risk-level', level)
    core.setOutput('confidence', confidence)
    core.setOutput('labels', labels.join(','))

    const labelComputer = new LabelComputer()
    const suggestVouch = analysisResult && !ctx.analysisFailed
      ? (labelComputer.shouldSuggestVouch(analysisResult, prData.author) ? { author: prData.author.login } : undefined)
      : undefined

    const commentBody = this.commentManager.buildCommentBody({
      result: analysisResult,
      deterministicScore: ctx.deterministicScore,
      riskLevel: level,
      signalBreakdown: ctx.signalBreakdown,
      agenticResults: ctx.agenticResults,
      stepResults: ctx.stepResults,
      labels,
      indicators: ctx.indicators,
      suggestVouch,
      authorProfile: ctx.authorProfile,
      aiFingerprint: ctx.aiFingerprint
    })
    await this.commentManager.upsertComment(prNumber, commentBody)

    if (labels.length > 0) {
      this.log(`Applying labels: ${labels.join(', ')}`)
      await this.commentManager.applyLabels(prNumber, labels)
    }

    return ctx
  }
}
