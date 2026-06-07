import { Check, CheckContext } from './check';
export declare class ActivityBurstCheck extends Check {
    readonly label: "slopper/activity-burst";
    readonly defaultWeight = 2;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=activity-burst.d.ts.map