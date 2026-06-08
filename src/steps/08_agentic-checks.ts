import { PipelineStep, PipelineContext } from '../core/pipeline'
import { AiProvider } from '../ai/providers'
import { ProviderConfig, callAgenticCheck } from '../ai/check-caller'
import { AgenticCheckContext } from '../output/checks/agentic-check'
import { allAgenticChecks } from '../output/checks/agentic'
import { buildCheckContext } from '../output/checks/check'
import { errorMessage } from '../core/utils'

export interface AgenticChecksConfig {
  provider: AiProvider
  providerConfig: ProviderConfig
}

export class AgenticChecksStep extends PipelineStep {
  readonly name = 'agentic-checks'
  private readonly provider: AiProvider
  private readonly providerConfig: ProviderConfig

  constructor(config: AgenticChecksConfig) {
    super()
    this.provider = config.provider
    this.providerConfig = config.providerConfig
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prData) {
      this.warn('No PR data — skipping agentic checks')
      return ctx
    }

    const checks = allAgenticChecks()
    const baseCtx = buildCheckContext({
      score: ctx.deterministicScore ?? ctx.analysisResult?.risk_score ?? 0,
      analysis: ctx.analysisResult,
      files: ctx.prData.files,
      firstTimeContributor: ctx.prData.author.first_time_contributor,
      prData: ctx.prData,
      authorProfile: ctx.authorProfile,
      riskyUser: ctx.riskyUser,
      trustedOrg: ctx.trustedOrg
    }, ctx.config)

    const checkCtx: AgenticCheckContext = { ...baseCtx, prData: ctx.prData }

    this.log(` Running ${checks.length} agentic checks in parallel...`)

    const results = await Promise.allSettled(
      checks.map(async check => {
        try {
          const result = await callAgenticCheck(check, checkCtx, this.provider, this.providerConfig)
          if (result.triggered) {
            this.log(` ⚠ ${check.key}: ${result.reasoning}`)
          } else {
            this.log(` ✓ ${check.key}: passed`)
          }
          return result
        } catch (error: unknown) {
          this.warn(` ${check.key} failed: ${errorMessage(error)}`)
          return null
        }
      })
    )

    ctx.agenticResults = results
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter((r): r is NonNullable<typeof r> => r !== null)

    const triggered = ctx.agenticResults.filter(r => r.triggered)
    this.log(` ${triggered.length}/${checks.length} checks triggered`)

    return ctx
  }
}
