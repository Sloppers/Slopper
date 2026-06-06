import { AiProvider } from './providers';
import { AgenticCheck, AgenticCheckResult, AgenticCheckContext } from '../output/checks/agentic-check';
export interface ProviderConfig {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    vertexProjectId?: string;
    vertexRegion?: string;
    groqApiKey?: string;
    geminiApiKey?: string;
    model?: string;
}
export declare function callAgenticCheck(check: AgenticCheck, ctx: AgenticCheckContext, provider: AiProvider, config: ProviderConfig): Promise<AgenticCheckResult>;
//# sourceMappingURL=check-caller.d.ts.map