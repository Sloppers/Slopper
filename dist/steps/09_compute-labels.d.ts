import { PipelineStep, PipelineContext } from '../core/pipeline';
export declare class ComputeLabelsStep extends PipelineStep {
    readonly name = "compute-labels";
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=09_compute-labels.d.ts.map