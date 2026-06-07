import { Check, CheckContext } from './check';
export declare class NoLinkedIssueCheck extends Check {
    readonly label: "slopper/no-linked-issue";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=no-linked-issue.d.ts.map