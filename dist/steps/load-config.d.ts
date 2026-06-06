import { PipelineStep, PipelineContext } from '../pipeline';
import { GitHubClient } from '../clients/github';
export declare class LoadConfigStep extends PipelineStep {
    readonly name = "load-config";
    private readonly loader;
    constructor(github: GitHubClient);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=load-config.d.ts.map