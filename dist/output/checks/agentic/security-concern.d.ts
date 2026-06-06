import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class SecurityConcernCheck extends AgenticCheck {
    readonly key = "security-concern";
    readonly label: string;
    readonly description = "Detects security concerns: obfuscated code, credential patterns, suspicious URLs, backdoors";
    readonly defaultWeight = 2;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
    parseResult(raw: Record<string, unknown>): AgenticCheckResult;
}
//# sourceMappingURL=security-concern.d.ts.map