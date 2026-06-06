import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare class SlopContentCheck extends AgenticCheck {
    readonly key = "slop-content";
    readonly label: string;
    readonly description = "Detects generic AI-generated slop: phantom fixes, boilerplate inflation, templated descriptions";
    readonly defaultWeight = 2;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
    buildToolSchema(): AgenticToolSchema;
    parseResult(raw: Record<string, unknown>): AgenticCheckResult;
}
//# sourceMappingURL=slop-content.d.ts.map