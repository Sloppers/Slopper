import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'

const RISKY_USERS_URL =
  'https://raw.githubusercontent.com/malvads/slopper/main/.slopper_risky_users'

function parseRiskyUsers(raw: string): string[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
}

export class RiskyUserCheckStep extends PipelineStep {
  readonly name = 'risky-user-check'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prAuthor) return ctx

    let users: string[] = []
    try {
      const res = await fetch(RISKY_USERS_URL)
      if (res.ok) {
        users = parseRiskyUsers(await res.text())
      } else {
        core.warning(`[risky-user-check] Failed to fetch risky users list: ${res.status}`)
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`[risky-user-check] Could not reach risky users list: ${msg}`)
      return ctx
    }

    if (users.length === 0) return ctx

    const isRisky = users.some(
      u => u.toLowerCase() === ctx.prAuthor!.toLowerCase()
    )

    if (isRisky) {
      core.warning(`[risky-user-check] Author "${ctx.prAuthor}" is on the community risky users list`)
      ctx.riskyUser = true
    }

    return ctx
  }
}
