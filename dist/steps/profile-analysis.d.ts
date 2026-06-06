import { PipelineStep, PipelineContext } from '../pipeline';
import { GitHubClient } from '../clients/github';
export declare class ProfileAnalysisStep extends PipelineStep {
    readonly name = "profile-analysis";
    private readonly analyzer;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=profile-analysis.d.ts.map