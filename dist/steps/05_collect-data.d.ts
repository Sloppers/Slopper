import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
export declare class CollectDataStep extends PipelineStep {
    readonly name = "collect-data";
    private readonly collector;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=05_collect-data.d.ts.map