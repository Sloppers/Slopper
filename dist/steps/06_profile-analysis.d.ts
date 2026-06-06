import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
export declare class ProfileAnalysisStep extends PipelineStep {
    readonly name = "profile-analysis";
    private readonly analyzer;
    private readonly github;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=06_profile-analysis.d.ts.map