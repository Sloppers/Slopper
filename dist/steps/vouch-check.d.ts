import { PipelineStep, PipelineContext } from '../pipeline';
import { GitHubClient } from '../clients/github';
export declare class VouchCheckStep extends PipelineStep {
    readonly name = "vouch-check";
    private readonly github;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private findVouchCommand;
    private isCodeOwner;
}
//# sourceMappingURL=vouch-check.d.ts.map