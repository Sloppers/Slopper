import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { GitHubClient } from '../clients/github'
import { SlopperConfig } from '../core/config'
import { errorMessage } from '../core/utils'

export class AutoActionsStep extends PipelineStep {
  readonly name = 'auto-actions'
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    super()
    this.github = github
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.config) return ctx

    const score = ctx.analysisResult?.risk_score ?? ctx.deterministicScore
    if (score === undefined) return ctx

    const { config, prNumber } = ctx

    if (this.shouldBlockFirstTimer(config, ctx)) {
      await this.closeWithComment(prNumber,
        'This PR was automatically closed by Slopper — this repository does not accept PRs from first-time contributors. Please open an issue first.')
      return ctx
    }

    await Promise.all([
      this.tryAutoClose(config, prNumber, score),
      this.tryAutoApprove(config, prNumber, score, ctx.analysisResult?.confidence),
      this.tryRequestReview(config, prNumber, score),
    ])

    return ctx
  }

  private shouldBlockFirstTimer(config: SlopperConfig, ctx: PipelineContext): boolean {
    return config.rules.block_first_time_contributors && !!ctx.prData?.author.first_time_contributor
  }

  private async tryAutoClose(config: SlopperConfig, prNumber: number, score: number): Promise<void> {
    const { auto_close } = config.actions
    if (!auto_close.enabled || score < auto_close.threshold) return

    core.info(`[auto-actions] Closing PR — risk score ${score} >= threshold ${auto_close.threshold}`)
    await this.closeWithComment(prNumber, auto_close.comment)
  }

  private async tryAutoApprove(config: SlopperConfig, prNumber: number, score: number, confidence?: string): Promise<void> {
    const { auto_approve } = config.actions
    if (!auto_approve.enabled || score > auto_approve.threshold || confidence !== 'high') return

    core.info(`[auto-actions] Approving PR — risk score ${score} <= threshold ${auto_approve.threshold}`)
    await this.safeCall('approve PR',
      () => this.github.approvePr(prNumber, 'Automatically approved by Slopper — low risk score with high confidence.'))
  }

  private async tryRequestReview(config: SlopperConfig, prNumber: number, score: number): Promise<void> {
    const { auto_request_review } = config.actions
    if (!auto_request_review.enabled || score < auto_request_review.threshold) return

    const { reviewers } = auto_request_review
    if (reviewers.length === 0) return

    core.info(`[auto-actions] Requesting review from: ${reviewers.join(', ')}`)
    await this.safeCall('request reviewers',
      () => this.github.requestReviewers(prNumber, reviewers))
  }

  private async closeWithComment(prNumber: number, comment: string): Promise<void> {
    await this.safeCall('close PR', async () => {
      await this.github.createComment(prNumber, comment)
      await this.github.closePr(prNumber)
    })
  }

  private async safeCall(action: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn()
    } catch (error: unknown) {
      core.warning(`[auto-actions] Failed to ${action}: ${errorMessage(error)}`)
    }
  }
}
