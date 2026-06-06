import { PipelineStep, PipelineContext } from '../pipeline';
import { GitHubClient } from '../clients/github';
export declare class VouchApplyStep extends PipelineStep {
    readonly name = "vouch-apply";
    private readonly github;
    private readonly commentManager;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private addUserToSlopperFile;
}
//# sourceMappingURL=vouch-apply.d.ts.map