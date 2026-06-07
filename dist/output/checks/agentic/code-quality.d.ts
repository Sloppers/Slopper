import { AgenticCheck, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class CodeQualityCheck extends AgenticCheck {
    readonly key = "code-quality";
    readonly label: "slopper/ai/code-quality";
    readonly description = "Detects subtle code quality issues: missing edge cases, unnecessary complexity, duplicate functionality";
    readonly triggerKey = "has_issues";
    readonly defaultWeight = 1;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
}
//# sourceMappingURL=code-quality.d.ts.map