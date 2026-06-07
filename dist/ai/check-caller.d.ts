import { AiProvider, ProviderConfig } from './providers';
import { AgenticCheck, AgenticCheckResult, AgenticCheckContext } from '../output/checks/agentic-check';
export type { ProviderConfig };
export declare function callAgenticCheck(check: AgenticCheck, ctx: AgenticCheckContext, provider: AiProvider, config: ProviderConfig): Promise<AgenticCheckResult>;
//# sourceMappingURL=check-caller.d.ts.map