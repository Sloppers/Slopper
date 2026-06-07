import { PipelineStep, PipelineContext } from '../core/pipeline'
import { GitHubClient } from '../clients/github'

export class VouchCheckStep extends PipelineStep {
  readonly name = 'vouch-check'
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    super()
    this.github = github
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    ctx.vouched = false

    const pr = await this.github.getPr(ctx.prNumber)
    const prAuthor = pr.user?.login ?? 'unknown'
    ctx.prAuthor = prAuthor

    const vouchedUsers = ctx.config?.vouched ?? []

    if (vouchedUsers.includes(prAuthor)) {
      this.log(`Author "${prAuthor}" is in .slopper vouched users — skipping analysis`)
      ctx.vouched = true
      ctx.vouchedBy = '.slopper'
      return ctx
    }

    const vouchComment = await this.findVouchCommand(ctx.prNumber)
    if (vouchComment) {
      const isCodeOwner = await this.github.isMaintainer(vouchComment.author)
      if (isCodeOwner) {
        this.log(`Code owner "${vouchComment.author}" vouched for "${prAuthor}"`)
        ctx.vouched = true
        ctx.vouchedBy = vouchComment.author
        ctx.addToSlopperFile = prAuthor
      } else {
        this.log(`"${vouchComment.author}" used /slopper vouch but is not a code owner — ignoring`)
      }
    }

    return ctx
  }

  private async findVouchCommand(
    prNumber: number
  ): Promise<{ author: string; commentId: number } | null> {
    const comments = await this.github.listComments(prNumber)

    for (const comment of comments) {
      const body = comment.body?.trim() ?? ''
      if (body.match(/^\/slopper\s+vouch\s*$/im)) {
        return {
          author: comment.user?.login ?? 'unknown',
          commentId: comment.id
        }
      }
    }
    return null
  }
}
