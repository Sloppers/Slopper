import { PipelineStep, PipelineContext } from '../core/pipeline';
import { SlopperClient } from '../clients/slopper';
export declare class RiskyUserCheckStep extends PipelineStep {
    readonly name = "risky-user-check";
    private readonly slopper;
    constructor(slopper: SlopperClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=03_risky-user-check.d.ts.map