import { PipelineStep, PipelineContext } from '../pipeline';
import { GitHubClient } from '../clients/github';
export declare class BannedCheckStep extends PipelineStep {
    readonly name = "banned-check";
    private readonly github;
    private readonly commentManager;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=banned-check.d.ts.map