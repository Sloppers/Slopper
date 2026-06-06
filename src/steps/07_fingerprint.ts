import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { AiFingerprintAnalyzer } from '../analysis/ai-fingerprint'

export class FingerprintStep extends PipelineStep {
  readonly name = 'fingerprint'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prData) {
      core.warning('[fingerprint] No prData — skipping fingerprint analysis')
      return ctx
    }

    const analyzer = new AiFingerprintAnalyzer()
    ctx.aiFingerprint = analyzer.analyze(ctx.prData.diff, ctx.prData.commits.messages)

    core.info(
      `[fingerprint] Score: ${ctx.aiFingerprint.score}/100 — ` +
      ctx.aiFingerprint.signals
        .filter(s => s.score > 0)
        .map(s => `${s.name}=${s.score}`)
        .join(', ')
    )

    return ctx
  }
}
