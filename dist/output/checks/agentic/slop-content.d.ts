import { AgenticCheck, AgenticCheckContext } from '../agentic-check';
export declare class SlopContentCheck extends AgenticCheck {
    readonly key = "slop-content";
    readonly label: "slopper/ai/slop-content";
    readonly description = "Detects generic AI-generated slop: phantom fixes, boilerplate inflation, templated descriptions";
    readonly triggerKey = "is_slop";
    readonly toolName = "submit_slop_check";
    readonly triggerDescription = "Whether this PR appears to be AI-generated slop";
    readonly defaultWeight = 2;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
}
//# sourceMappingURL=slop-content.d.ts.map