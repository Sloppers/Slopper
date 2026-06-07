import { PipelineStep, PipelineContext } from '../core/pipeline';
import { AiProvider } from '../ai/providers';
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
//# sourceMappingURL=07_ai-analysis.d.ts.map