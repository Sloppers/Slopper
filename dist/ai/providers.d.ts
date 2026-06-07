export type AiProvider = 'openai' | 'anthropic' | 'vertex' | 'groq' | 'gemini';
export interface ToolDef {
    name: string;
    description: string;
    schema: Record<string, unknown>;
}
export interface ProviderConfig {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    vertexProjectId?: string;
    vertexRegion?: string;
    groqApiKey?: string;
    geminiApiKey?: string;
    model?: string;
}
export interface AiProviderStrategy {
    readonly defaultModel: string;
    call(system: string, user: string, tool: ToolDef, maxTokens: number): Promise<Record<string, unknown>>;
}
export declare function createProvider(provider: AiProvider, config: ProviderConfig): AiProviderStrategy;
export declare function callProvider(provider: AiProvider, prompt: string, system: string, config: ProviderConfig): Promise<Record<string, unknown>>;
//# sourceMappingURL=providers.d.ts.map