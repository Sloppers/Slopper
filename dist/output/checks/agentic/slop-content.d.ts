import { AgenticCheck, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class SlopContentCheck extends AgenticCheck {
    readonly key = "slop-content";
    readonly label: "slopper/ai/slop-content";
    readonly description = "Detects generic AI-generated slop: phantom fixes, boilerplate inflation, templated descriptions";
    readonly triggerKey = "is_slop";
    readonly defaultWeight = 2;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
}
//# sourceMappingURL=slop-content.d.ts.map