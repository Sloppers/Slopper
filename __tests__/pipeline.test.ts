import { AnalysisPipeline, PipelineStep, PipelineContext } from '../src/pipeline'

// Mock @actions/core to prevent actual GitHub Actions output
jest.mock('@actions/core', () => ({
  info: jest.fn()
}))

class AddValueStep extends PipelineStep {
  readonly name = 'add-value'
  private key: string
  private value: unknown

  constructor(key: string, value: unknown) {
    super()
    this.key = key
    this.value = value
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    ctx[this.key] = this.value
    return ctx
  }
}

class TransformStep extends PipelineStep {
  readonly name = 'transform'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    ctx.doubled = (ctx.count as number) * 2
    return ctx
  }
}

class FailingStep extends PipelineStep {
  readonly name = 'failing'

  async execute(_ctx: PipelineContext): Promise<PipelineContext> {
    throw new Error('Step failed')
  }
}

describe('AnalysisPipeline', () => {
  it('runs steps in order and passes context through', async () => {
    const pipeline = new AnalysisPipeline([
      new AddValueStep('count', 5),
      new TransformStep()
    ])

    const result = await pipeline.run({})
    expect(result.count).toBe(5)
    expect(result.doubled).toBe(10)
  })

  it('preserves initial context', async () => {
    const pipeline = new AnalysisPipeline([
      new AddValueStep('extra', 'data')
    ])

    const result = await pipeline.run({ existing: true })
    expect(result.existing).toBe(true)
    expect(result.extra).toBe('data')
  })

  it('propagates errors from failing steps', async () => {
    const pipeline = new AnalysisPipeline([
      new AddValueStep('before', true),
      new FailingStep(),
      new AddValueStep('after', true)
    ])

    await expect(pipeline.run({})).rejects.toThrow('Step failed')
  })

  it('handles empty pipeline', async () => {
    const pipeline = new AnalysisPipeline([])
    const result = await pipeline.run({ value: 42 })
    expect(result.value).toBe(42)
  })
})
