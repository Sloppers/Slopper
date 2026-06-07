import { AgenticCheck, AgenticCheckContext } from '../agentic-check';
export declare class SecurityConcernCheck extends AgenticCheck {
    readonly key = "security-concern";
    readonly label: "slopper/ai/security-concern";
    readonly description = "Detects security concerns: obfuscated code, credential patterns, suspicious URLs, backdoors";
    readonly triggerKey = "has_concerns";
    readonly toolName = "submit_security_check";
    readonly triggerDescription = "Whether security concerns were found";
    readonly defaultWeight = 2;
    buildPrompt(ctx: AgenticCheckContext): {
        system: string;
        user: string;
    };
}
//# sourceMappingURL=security-concern.d.ts.map