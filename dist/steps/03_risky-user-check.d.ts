import { PipelineStep, PipelineContext } from '../core/pipeline';
export declare class RiskyUserCheckStep extends PipelineStep {
    readonly name = "risky-user-check";
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=03_risky-user-check.d.ts.map