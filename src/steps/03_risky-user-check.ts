import { PipelineStep, PipelineContext } from '../core/pipeline'
import { SlopperClient } from '../clients/slopper'
import { errorMessage } from '../core/utils'

export class RiskyUserCheckStep extends PipelineStep {
  readonly name = 'risky-user-check'
  private readonly slopper: SlopperClient

  constructor(slopper: SlopperClient) {
    super()
    this.slopper = slopper
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prAuthor) return ctx

    let users: string[] = []
    try {
      users = await this.slopper.fetchRiskyUsers()
    } catch (error: unknown) {
      this.warn(`Could not fetch risky users list: ${errorMessage(error)}`)
      return ctx
    }

    if (users.length === 0) return ctx

    const isRisky = users.some(
      u => u.toLowerCase() === ctx.prAuthor!.toLowerCase()
    )

    if (isRisky) {
      this.warn(`Author "${ctx.prAuthor}" is on the community risky users list`)
      ctx.riskyUser = true
    }

    return ctx
  }
}
