import { PipelineStep, PipelineContext } from '../pipeline';
import { AiProvider } from '../providers';
export interface AiAnalysisConfig {
    provider: AiProvider;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    vertexProjectId?: string;
    vertexRegion?: string;
    groqApiKey?: string;
    geminiApiKey?: string;
    model?: string;
}
export declare class AiAnalysisStep extends PipelineStep {
    readonly name = "ai-analysis";
    private readonly config;
    constructor(config: AiAnalysisConfig);
    execute(ctx: PipelineContext): Promise<PipelineContext>;
    private buildFailureResult;
}
//# sourceMappingURL=ai-analysis.d.ts.map