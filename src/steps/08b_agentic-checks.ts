import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { AiProvider } from '../ai/providers'
import { ProviderConfig, callAgenticCheck } from '../ai/check-caller'
import { AgenticCheckContext } from '../output/checks/agentic-check'
import { allAgenticChecks } from '../output/checks/agentic'

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
      core.warning('[agentic-checks] No PR data — skipping agentic checks')
      return ctx
    }

    const checks = allAgenticChecks()
    const checkCtx: AgenticCheckContext = {
      score: ctx.deterministicScore ?? ctx.analysisResult?.risk_score ?? 0,
      analysis: ctx.analysisResult,
      files: ctx.prData.files,
      firstTimeContributor: ctx.prData.author.first_time_contributor,
      prData: ctx.prData,
      authorProfile: ctx.authorProfile,
      aiFingerprint: ctx.aiFingerprint,
      riskyUser: ctx.riskyUser,
      trustedOrg: ctx.trustedOrg,
      thresholds: ctx.config?.thresholds ?? { low: 2, medium: 5, high: 8 },
      labelThresholds: ctx.config?.label_thresholds ?? {
        ai_likely: 70, ai_possibly: 40, spray_score: 60, new_account_days: 30,
        activity_burst_prs: 10, activity_burst_days: 7,
        spray_weights: { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 },
        merge_ratio_suspect: 0.4, security_review_score: 6, suspicious_score: 8,
        score_weights: { fingerprint: 4, spray: 3, new_account: 1, low_merge_ratio: 1, risky_user: 1, trusted_org: -2 }
      },
      rules: ctx.config?.rules ?? {
        require_description: false, require_linked_issue: false,
        max_files_changed: 0, max_total_changes: 1500, max_file_changes: 800,
        block_first_time_contributors: false
      }
    }

    core.info(`[agentic-checks] Running ${checks.length} agentic checks in parallel...`)

    const results = await Promise.allSettled(
      checks.map(async check => {
        try {
          const result = await callAgenticCheck(check, checkCtx, this.provider, this.providerConfig)
          if (result.triggered) {
            core.info(`[agentic-checks] ⚠ ${check.key}: ${result.reasoning}`)
          } else {
            core.info(`[agentic-checks] ✓ ${check.key}: passed`)
          }
          return result
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error)
          core.warning(`[agentic-checks] ${check.key} failed: ${msg}`)
          return null
        }
      })
    )

    ctx.agenticResults = results
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter((r): r is NonNullable<typeof r> => r !== null)

    const triggered = ctx.agenticResults.filter(r => r.triggered)
    core.info(`[agentic-checks] ${triggered.length}/${checks.length} checks triggered`)

    return ctx
  }
}
