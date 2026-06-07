import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
export declare class BannedCheckStep extends PipelineStep {
    readonly name = "banned-check";
    private readonly github;
    private readonly commentManager;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private banAndClose;
    private findReportCommand;
    private addUserToBannedList;
}
//# sourceMappingURL=02_banned-check.d.ts.map