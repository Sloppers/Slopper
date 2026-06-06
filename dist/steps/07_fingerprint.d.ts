import { PipelineStep, PipelineContext } from '../core/pipeline';
export declare class FingerprintStep extends PipelineStep {
    readonly name = "fingerprint";
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=07_fingerprint.d.ts.map