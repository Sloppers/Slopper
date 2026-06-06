import { PipelineStep, PipelineContext } from '../pipeline';
import { GitHubClient } from '../clients/github';
export declare class PostResultsStep extends PipelineStep {
    readonly name = "post-results";
    private readonly commentManager;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=post-results.d.ts.map