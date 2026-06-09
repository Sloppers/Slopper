import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { IssueCommentManager } from '../output/issue-commenter'
import { GitHubClient } from '../clients/github'

export class PostIssueResultsStep extends PipelineStep {
  readonly name = 'post-issue-results'
  private readonly commentManager: IssueCommentManager

  constructor(github: GitHubClient) {
    super()
    this.commentManager = new IssueCommentManager(github)
  }

  private riskLevel(score: number, thresholds = { low: 2, medium: 5, high: 8 }): string {
    if (score <= thresholds.low) return 'low'
    if (score <= thresholds.medium) return 'medium'
    if (score <= thresholds.high) return 'high'
    return 'critical'
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.labels || !ctx.issueData) {
      throw new Error('labels and issueData are required but missing from context')
    }

    const { labels, prNumber, issueData } = ctx
    const score = ctx.deterministicScore ?? 0
    const level = this.riskLevel(score, ctx.config?.thresholds)

    core.setOutput('risk-score', String(score))
    core.setOutput('risk-level', level)
    core.setOutput('labels', labels.join(','))

    const commentBody = this.commentManager.buildCommentBody({
      issueData,
      deterministicScore: ctx.deterministicScore,
      riskLevel: level,
      signalBreakdown: ctx.signalBreakdown,
      agenticResults: ctx.agenticResults,
      stepResults: ctx.stepResults,
      labels,
      indicators: ctx.indicators,
      recentIssues: ctx.recentIssues,
      duplicateThreshold: ctx.config?.issue_rules?.duplicate_threshold,
      authorProfile: ctx.authorProfile
    })
    await this.commentManager.upsertComment(prNumber, commentBody)

    if (labels.length > 0) {
      this.log(`Applying labels: ${labels.join(', ')}`)
      await this.commentManager.applyLabels(prNumber, labels)
    }

    return ctx
  }
}
