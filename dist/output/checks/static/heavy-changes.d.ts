import { Check, CheckContext } from '../check';
export declare class HeavyChangesCheck extends Check {
    readonly label: "slopper/heavy-changes";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=heavy-changes.d.ts.map