import { PipelineStep, PipelineContext } from '../core/pipeline'
import { errorMessage, parseTextList } from '../core/utils'

const RISKY_USERS_URL =
  'https://raw.githubusercontent.com/malvads/slopper/main/.slopper_risky_users'

export class RiskyUserCheckStep extends PipelineStep {
  readonly name = 'risky-user-check'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prAuthor) return ctx

    let users: string[] = []
    try {
      const res = await fetch(RISKY_USERS_URL)
      if (res.ok) {
        users = parseTextList(await res.text())
      } else {
        this.warn(` Failed to fetch risky users list: ${res.status}`)
      }
    } catch (error: unknown) {
      this.warn(` Could not reach risky users list: ${errorMessage(error)}`)
      return ctx
    }

    if (users.length === 0) return ctx

    const isRisky = users.some(
      u => u.toLowerCase() === ctx.prAuthor!.toLowerCase()
    )

    if (isRisky) {
      this.warn(` Author "${ctx.prAuthor}" is on the community risky users list`)
      ctx.riskyUser = true
    }

    return ctx
  }
}
