import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class DescriptionMismatchCheck extends AgenticCheck {
    readonly key = "description-mismatch";
    readonly label: "slopper/ai/description-mismatch";
    readonly description = "Detects when PR description does not match what the diff actually does";
    readonly defaultWeight = 1;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
    parseResult(raw: Record<string, unknown>): AgenticCheckResult;
}
//# sourceMappingURL=description-mismatch.d.ts.map