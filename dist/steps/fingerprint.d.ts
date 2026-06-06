import { PipelineStep, PipelineContext } from '../pipeline';
export declare class FingerprintStep extends PipelineStep {
    readonly name = "fingerprint";
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=fingerprint.d.ts.map