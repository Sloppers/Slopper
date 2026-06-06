import * as core from '@actions/core'

/**
 * Context object passed through the analysis pipeline.
 * Each step reads from and writes to this shared context.
 */
export interface PipelineContext {
  [key: string]: unknown
}

/**
 * Abstract base class for a single step in the analysis pipeline.
 *
 * Subclass this to create discrete, testable analysis steps.
 * Each step receives the shared context, performs its work,
 * and returns the (potentially modified) context.
 *
 * @example
 * ```ts
 * class MyStep extends PipelineStep {
 *   readonly name = 'my-step'
 *   async execute(ctx: PipelineContext): Promise<PipelineContext> {
 *     ctx.myResult = await doSomething()
 *     return ctx
 *   }
 * }
 * ```
 */
export abstract class PipelineStep {
  /** Unique identifier for this step, used in logging. */
  abstract readonly name: string

  /**
   * Executes the pipeline step.
   * @param ctx - Shared pipeline context.
   * @returns The context, potentially with new or modified fields.
   */
  abstract execute(ctx: PipelineContext): Promise<PipelineContext>
}

/**
 * Orchestrates a sequence of {@link PipelineStep} instances.
 *
 * Steps execute in order. If a step throws, the pipeline halts
 * and the error propagates. Each step receives the context
 * returned by the previous step.
 *
 * @example
 * ```ts
 * const pipeline = new AnalysisPipeline([
 *   new CollectDataStep(octokit, owner, repo),
 *   new AiAnalysisStep(provider, config),
 *   new ComputeLabelsStep(),
 *   new PostResultsStep(octokit, owner, repo),
 * ])
 * await pipeline.run({ prNumber: 42 })
 * ```
 */
export class AnalysisPipeline {
  private steps: PipelineStep[]

  /**
   * @param steps - Ordered list of pipeline steps to execute.
   */
  constructor(steps: PipelineStep[]) {
    this.steps = steps
  }

  /**
   * Runs all steps in sequence.
   * @param initialContext - Starting context (typically contains prNumber).
   * @returns Final context after all steps have executed.
   */
  async run(initialContext: PipelineContext): Promise<PipelineContext> {
    let ctx = { ...initialContext }

    for (const step of this.steps) {
      core.info(`[pipeline] Running step: ${step.name}`)
      const start = Date.now()
      ctx = await step.execute(ctx)
      const elapsed = Date.now() - start
      core.info(`[pipeline] Step "${step.name}" completed in ${elapsed}ms`)
    }

    return ctx
  }
}
