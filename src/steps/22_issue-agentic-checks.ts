import { PipelineStep, PipelineContext } from '../core/pipeline'
import { AiProvider } from '../ai/providers'
import { ProviderConfig, createProvider } from '../ai/providers'
import { agenticToolSchema, parseAgenticResult } from '../output/checks/check'
import { IssueAgenticCheckDef, IssueCheckContext, buildIssueCheckContext } from '../output/checks/issue-check'
import { allIssueAgenticChecks } from '../output/checks/issue-registry'
import { errorMessage } from '../core/utils'

export interface IssueAgenticChecksConfig {
  provider: AiProvider
  providerConfig: ProviderConfig
}

export class IssueAgenticChecksStep extends PipelineStep {
  readonly name = 'issue-agentic-checks'
  private readonly provider: AiProvider
  private readonly providerConfig: ProviderConfig

  constructor(config: IssueAgenticChecksConfig) {
    super()
    this.provider = config.provider
    this.providerConfig = config.providerConfig
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.issueData) {
      this.warn('No issue data — skipping agentic checks')
      return ctx
    }

    const checks = allIssueAgenticChecks()
    const checkCtx = buildIssueCheckContext({
      score: ctx.deterministicScore ?? 0,
      issueData: ctx.issueData,
      authorProfile: ctx.authorProfile,
      recentIssues: ctx.recentIssues,
      riskyUser: ctx.riskyUser,
      trustedOrg: ctx.trustedOrg,
      verifiedOrg: ctx.verifiedOrg
    }, ctx.config)

    this.log(`Running ${checks.length} issue agentic checks in parallel...`)

    const results = await Promise.allSettled(
      checks.map(async check => {
        try {
          const result = await this.callCheck(check, checkCtx)
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
    this.log(`${triggered.length}/${checks.length} checks triggered`)

    return ctx
  }

  private async callCheck(check: IssueAgenticCheckDef, ctx: IssueCheckContext) {
    const { system, user } = check.buildPrompt(ctx)
    const tool = agenticToolSchema(check)
    const strategy = createProvider(this.provider, this.providerConfig)
    const raw = await strategy.call(system, user, tool, 2048)
    return parseAgenticResult(check, raw)
  }
}
