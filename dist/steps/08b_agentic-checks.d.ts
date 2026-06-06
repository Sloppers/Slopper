import { PipelineStep, PipelineContext } from '../core/pipeline';
import { AiProvider } from '../ai/providers';
import { ProviderConfig } from '../ai/check-caller';
export interface AgenticChecksConfig {
    provider: AiProvider;
    providerConfig: ProviderConfig;
}
export declare class AgenticChecksStep extends PipelineStep {
    readonly name = "agentic-checks";
    private readonly provider;
    private readonly providerConfig;
    constructor(config: AgenticChecksConfig);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=08b_agentic-checks.d.ts.map