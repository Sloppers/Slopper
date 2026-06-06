import * as core from '@actions/core'
import { PipelineStep, PipelineContext, StepResult } from '../core/pipeline'
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

  private buildPipelineLog(steps: StepResult[]): string {
    const lines: string[] = ['Slopper Pipeline Execution Log', '='.repeat(40), '']
    for (const s of steps) {
      const icon = s.status === 'success' ? 'PASS' : 'FAIL'
      const time = s.startTime.toISOString()
      const secs = Math.round(s.durationMs / 1000)
      lines.push(`[${icon}] ${s.name}`)
      lines.push(`       Started: ${time}`)
      lines.push(`       Duration: ${secs}s (${s.durationMs}ms)`)
      if (s.error) {
        lines.push(`       Error: ${s.error}`)
      }
      lines.push('')
    }
    const passed = steps.filter(s => s.status === 'success').length
    const failed = steps.filter(s => s.status === 'failure').length
    lines.push('='.repeat(40))
    lines.push(`Total: ${steps.length} steps — ${passed} passed, ${failed} failed`)
    return lines.join('\n')
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

    let pipelineGistUrl: string | undefined
    if (ctx.stepResults && ctx.stepResults.length > 0) {
      try {
        const logContent = this.buildPipelineLog(ctx.stepResults)
        pipelineGistUrl = await this.github.createGist(
          `Slopper pipeline logs — ${this.github.owner}/${this.github.repo}#${prNumber}`,
          'slopper-pipeline.log',
          logContent
        )
      } catch (err) {
        core.warning(`Failed to create pipeline gist: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    const commentBody = this.commentManager.buildCommentBody({
      result: analysisResult,
      deterministicScore: ctx.deterministicScore,
      riskLevel: level,
      signalBreakdown: ctx.signalBreakdown,
      agenticResults: ctx.agenticResults,
      stepResults: ctx.stepResults,
      pipelineGistUrl,
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
