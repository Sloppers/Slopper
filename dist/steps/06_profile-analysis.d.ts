import { PipelineStep, PipelineContext } from '../core/pipeline';
import { GitHubClient } from '../clients/github';
import { SlopperClient } from '../clients/slopper';
export declare class ProfileAnalysisStep extends PipelineStep {
    readonly name = "profile-analysis";
    private readonly analyzer;
    private readonly github;
    private readonly slopper;
    constructor(github: GitHubClient, slopper: SlopperClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private fetchGlobalTrustedOrgs;
    private deduplicateOrgs;
}
//# sourceMappingURL=06_profile-analysis.d.ts.map