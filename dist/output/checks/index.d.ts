export { Check, StaticCheck, CheckContext, ScoreResult } from './check';
export { AgenticCheck, AgenticCheckResult, AgenticCheckContext } from './agentic-check';
export { DerivedIndicator, allDerivedIndicators } from './derived-indicator';
export { allAgenticChecks } from './agentic';
export { allStaticChecks } from './static';
export { FirstTimeContributorCheck, CiModifiedCheck, DependenciesModifiedCheck, SprayAndPrayCheck, ActivityBurstCheck, NewAccountCheck, MissingDescriptionCheck, NoLinkedIssueCheck, TooManyFilesCheck, RiskyUserCheck, TrustedOrgCheck, HeavyChangesCheck, LargeFileCheck, LowMergeRatioCheck, SupplyChainCheck, UnsignedCommitsCheck, NoTestsCheck, CodeDuplicationCheck } from './static';
import { Check, ScoreResult } from './check';
export declare function allChecks(): Check[];
export declare function computeScore(checks: Check[], ctx: import('./check').CheckContext, weights?: Record<string, number>): {
    score: number;
    breakdown: ScoreResult[];
};
//# sourceMappingURL=index.d.ts.map