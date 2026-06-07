import { PrData } from '../../core/types';
import { CheckContext } from './check';
export interface AgenticCheckResult {
    triggered: boolean;
    label: string;
    reasoning: string;
    confidence: 'low' | 'medium' | 'high';
    evidence?: string[];
}
export interface AgenticCheckContext extends CheckContext {
    prData: PrData;
}
export interface AgenticToolSchema {
    name: string;
    description: string;
    schema: Record<string, unknown>;
}
export declare abstract class AgenticCheck {
    abstract readonly key: string;
    abstract readonly label: string;
    abstract readonly description: string;
    abstract readonly triggerKey: string;
    abstract readonly toolName: string;
    abstract readonly triggerDescription: string;
    readonly defaultWeight: number;
    abstract buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
    parseResult(raw: Record<string, unknown>): AgenticCheckResult;
}
//# sourceMappingURL=agentic-check.d.ts.map