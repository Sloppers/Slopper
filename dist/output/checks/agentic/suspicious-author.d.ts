import { AgenticCheck, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class SuspiciousAuthorCheck extends AgenticCheck {
    readonly key = "suspicious-author";
    readonly label: "slopper/ai/suspicious-author";
    readonly description = "Evaluates the PR author profile for patterns common in slop accounts";
    readonly triggerKey = "is_suspicious";
    readonly defaultWeight = 2;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
}
//# sourceMappingURL=suspicious-author.d.ts.map