import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
export declare class AutoActionsStep extends PipelineStep {
    readonly name = "auto-actions";
    private readonly github;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private shouldBlockFirstTimer;
    private tryAutoClose;
    private tryAutoApprove;
    private tryRequestReview;
    private closeWithComment;
    private safeCall;
}
//# sourceMappingURL=11_auto-actions.d.ts.map