import * as core from '@actions/core'
import * as github from '@actions/github'
import { PipelineStep, PipelineContext } from '../pipeline'
import { PrCommentManager } from '../commenter'
import { LabelComputer } from '../labels'
import { AnalysisResult, PrData } from '../types'

type Octokit = ReturnType<typeof github.getOctokit>

/**
 * Pipeline step that posts the analysis comment and applies labels to the PR.
 *
 * Upserts the comment (creates on first run, updates on re-runs) and
 * manages slopper/* labels (removes stale ones, creates missing ones, applies new ones).
 *
 * Reads `analysisResult`, `labels`, and `prNumber` from context.
 * Writes `risk-score`, `risk-level`, `confidence`, `labels` as action outputs.
 */
export class PostResultsStep extends PipelineStep {
  readonly name = 'post-results'
  private commentManager: PrCommentManager

  /**
   * @param octokit - Authenticated Octokit instance.
   * @param owner - Repository owner.
   * @param repo - Repository name.
   */
  constructor(octokit: Octokit, owner: string, repo: string) {
    super()
    this.commentManager = new PrCommentManager(octokit, owner, repo)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const result = ctx.analysisResult as AnalysisResult
    const labels = ctx.labels as string[]
    const prNumber = ctx.prNumber as number
    const prData = ctx.prData as PrData

    core.setOutput('risk-score', String(result.risk_score))
    core.setOutput('risk-level', result.risk_level)
    core.setOutput('confidence', result.confidence)
    core.setOutput('labels', labels.join(','))

    const labelComputer = new LabelComputer()
    const suggestVouch = labelComputer.shouldSuggestVouch(result, prData.author)
      ? { author: prData.author.login }
      : undefined

    const commentBody = this.commentManager.buildCommentBody(result, labels, suggestVouch)
    await this.commentManager.upsertComment(prNumber, commentBody)

    if (labels.length > 0) {
      core.info(`Applying labels: ${labels.join(', ')}`)
      await this.commentManager.applyLabels(prNumber, labels)
    }

    return ctx
  }
}
