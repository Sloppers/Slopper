import { PipelineStep, PipelineContext } from '../core/pipeline'
import { ConfigLoader } from '../core/config'
import { GitHubClient } from '../clients/github'

export class LoadConfigStep extends PipelineStep {
  readonly name = 'load-config'
  private readonly loader: ConfigLoader

  constructor(github: GitHubClient) {
    super()
    this.loader = new ConfigLoader(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    ctx.config = await this.loader.load()
    this.log(`Loaded: ${ctx.config.vouched.length} vouched, ${ctx.config.banned.length} banned, ignore_paths=${ctx.config.ignore_paths.length}`)
    return ctx
  }
}
