import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
export declare class VouchApplyStep extends PipelineStep {
    readonly name = "vouch-apply";
    private readonly github;
    private readonly commentManager;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private createVouchPr;
}
//# sourceMappingURL=04_vouch-apply.d.ts.map