import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
import { SlopperClient } from '../clients/slopper';
export declare class BannedCheckStep extends PipelineStep {
    readonly name = "banned-check";
    private readonly github;
    private readonly slopper;
    private readonly commentManager;
    constructor(github: GitHubClient, slopper: SlopperClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private reportUserGlobally;
    private banAndClose;
    private findReportCommand;
    private addUserToBannedList;
}
//# sourceMappingURL=02_banned-check.d.ts.map