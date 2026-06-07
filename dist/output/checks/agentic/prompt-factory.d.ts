import { AgenticCheckContext, AgenticToolSchema } from '../agentic-check';
export declare function buildCheckSchema(opts: {
    toolName: string;
    triggerKey: string;
    triggerDescription: string;
}): AgenticToolSchema;
export declare function prHeader(ctx: AgenticCheckContext): string;
export declare function prDescription(ctx: AgenticCheckContext): string;
export declare function filesList(ctx: AgenticCheckContext, opts?: {
    showBinary?: boolean;
}): string;
export declare function diffBlock(ctx: AgenticCheckContext, maxLength: number): string;
export declare function commitMessages(ctx: AgenticCheckContext, max?: number): string;
export declare function prStats(ctx: AgenticCheckContext): string;
export declare function authorSection(ctx: AgenticCheckContext): string;
//# sourceMappingURL=prompt-factory.d.ts.map