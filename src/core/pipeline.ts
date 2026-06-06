import * as core from '@actions/core'
import { AnalysisResult, PrData, AuthorProfileAnalysis, AiFingerprintResult } from './types'
import { SlopperConfig } from './config'

export interface PipelineContext {
  prNumber: number
  config?: SlopperConfig
  prAuthor?: string
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  aiFingerprint?: AiFingerprintResult
  analysisResult?: AnalysisResult
  analysisFailed?: boolean
  labels?: string[]
  vouched?: boolean
  vouchedBy?: string
  addToSlopperFile?: string
  banned?: boolean
  riskyUser?: boolean
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

    for (const step of this.steps) {
      core.info(`[pipeline] Running step: ${step.name}`)
      const start = Date.now()
      ctx = await step.execute(ctx)
      const elapsed = Date.now() - start
      core.info(`[pipeline] Step "${step.name}" completed in ${elapsed}ms`)
    }

    return ctx
  }
}
