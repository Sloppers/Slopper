import { PipelineStep, PipelineContext } from '../pipeline';
import { GitHubClient } from '../clients/github';
export declare class AutoActionsStep extends PipelineStep {
    readonly name = "auto-actions";
    private readonly github;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private closePrWithComment;
}
//# sourceMappingURL=auto-actions.d.ts.map