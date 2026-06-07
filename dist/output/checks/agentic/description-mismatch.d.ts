import { AgenticCheck, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class DescriptionMismatchCheck extends AgenticCheck {
    readonly key = "description-mismatch";
    readonly label: "slopper/ai/description-mismatch";
    readonly description = "Detects when PR description does not match what the diff actually does";
    readonly triggerKey = "has_mismatch";
    readonly defaultWeight = 1;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
}
//# sourceMappingURL=description-mismatch.d.ts.map