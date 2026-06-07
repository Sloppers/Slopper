import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
export declare class VouchCheckStep extends PipelineStep {
    readonly name = "vouch-check";
    private readonly github;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private findVouchCommand;
}
//# sourceMappingURL=01_vouch-check.d.ts.map