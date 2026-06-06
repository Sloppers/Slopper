import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class CodeQualityCheck extends AgenticCheck {
    readonly key = "code-quality";
    readonly label: string;
    readonly description = "Detects subtle code quality issues: missing edge cases, unnecessary complexity, duplicate functionality";
    readonly defaultWeight = 1;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
    parseResult(raw: Record<string, unknown>): AgenticCheckResult;
}
//# sourceMappingURL=code-quality.d.ts.map