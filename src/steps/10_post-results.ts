import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { PrCommentManager } from '../output/commenter'
import { LabelComputer } from '../output/labels'
import { GitHubClient } from '../clients/github'

export class PostResultsStep extends PipelineStep {
  readonly name = 'post-results'
  private readonly commentManager: PrCommentManager

  constructor(github: GitHubClient) {
    super()
    this.commentManager = new PrCommentManager(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.analysisResult || !ctx.labels || !ctx.prData) {
      throw new Error('analysisResult, labels, and prData are required but missing from context')
    }

    const { analysisResult, labels, prNumber, prData } = ctx

    core.setOutput('risk-score', String(analysisResult.risk_score))
    core.setOutput('risk-level', analysisResult.risk_level)
    core.setOutput('confidence', analysisResult.confidence)
    core.setOutput('labels', labels.join(','))

    const labelComputer = new LabelComputer()
    const suggestVouch = labelComputer.shouldSuggestVouch(analysisResult, prData.author)
      ? { author: prData.author.login }
      : undefined

    const commentBody = this.commentManager.buildCommentBody({
      result: analysisResult,
      labels,
      suggestVouch,
      authorProfile: ctx.authorProfile,
      aiFingerprint: ctx.aiFingerprint
    })
    await this.commentManager.upsertComment(prNumber, commentBody)

    if (labels.length > 0) {
      core.info(`Applying labels: ${labels.join(', ')}`)
      await this.commentManager.applyLabels(prNumber, labels)
    }

    return ctx
  }
}
