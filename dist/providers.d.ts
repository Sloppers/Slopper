import { AnalysisResult } from './types';
export type AiProvider = 'openai' | 'anthropic' | 'vertex' | 'groq' | 'gemini';
export declare function callOpenAI(prompt: string, system: string, apiKey: string, model?: string): Promise<AnalysisResult>;
export declare function callAnthropic(prompt: string, system: string, apiKey: string, model?: string): Promise<AnalysisResult>;
export declare function callVertex(prompt: string, system: string, projectId: string, region: string, model?: string): Promise<AnalysisResult>;
export declare function callGroq(prompt: string, system: string, apiKey: string, model?: string): Promise<AnalysisResult>;
export declare function callGemini(prompt: string, system: string, apiKey: string, model?: string): Promise<AnalysisResult>;
export declare function callProvider(provider: AiProvider, prompt: string, system: string, config: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    vertexProjectId?: string;
    vertexRegion?: string;
    groqApiKey?: string;
    geminiApiKey?: string;
    model?: string;
}): Promise<AnalysisResult>;
