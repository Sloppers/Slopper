import * as core from '@actions/core'
import { AnalysisResult, PrData, AuthorProfileAnalysis, AiFingerprintResult } from './types'
import { SlopperConfig } from './config'
import { ScoreResult } from '../output/checks/check'
import { AgenticCheckResult } from '../output/checks/agentic-check'

export interface StepResult {
  name: string
  status: 'success' | 'failure'
  startTime: Date
  durationMs: number
  error?: string
}

export interface PipelineContext {
  prNumber: number
  config?: SlopperConfig
  prAuthor?: string
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  aiFingerprint?: AiFingerprintResult
  analysisResult?: AnalysisResult
  analysisFailed?: boolean
  deterministicScore?: number
  signalBreakdown?: ScoreResult[]
  agenticResults?: AgenticCheckResult[]
  stepResults?: StepResult[]
  labels?: string[]
  indicators?: string[]
  vouched?: boolean
  vouchedBy?: string
  addToSlopperFile?: string
  banned?: boolean
  riskyUser?: boolean
  trustedOrg?: boolean
}

export abstract class PipelineStep {
  abstract readonly name: string
  abstract execute(ctx: PipelineContext): Promise<PipelineContext>
}

export class AnalysisPipeline {
  private readonly steps: readonly PipelineStep[]

  constructor(steps: PipelineStep[]) {
    this.steps = steps
  }

  async run(initialContext: PipelineContext): Promise<PipelineContext> {
    let ctx = { ...initialContext }
    ctx.stepResults = ctx.stepResults ?? []

    for (const step of this.steps) {
      core.info(`[pipeline] Running step: ${step.name}`)
      const startTime = new Date()
      const startMs = startTime.getTime()

      try {
        ctx = await step.execute(ctx)
        const durationMs = Date.now() - startMs
        ctx.stepResults!.push({ name: step.name, status: 'success', startTime, durationMs })
        core.info(`[pipeline] Step "${step.name}" completed in ${durationMs}ms`)
      } catch (err) {
        const durationMs = Date.now() - startMs
        const message = err instanceof Error ? err.message : String(err)
        ctx.stepResults!.push({ name: step.name, status: 'failure', startTime, durationMs, error: message })
        core.error(`[pipeline] Step "${step.name}" failed after ${durationMs}ms: ${message}`)
        throw err
      }
    }

    return ctx
  }
}
