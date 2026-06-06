import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
export declare class PostResultsStep extends PipelineStep {
    readonly name = "post-results";
    private readonly commentManager;
    private readonly github;
    constructor(github: GitHubClient);
    private buildPipelineLog;
    private riskLevel;
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=10_post-results.d.ts.map