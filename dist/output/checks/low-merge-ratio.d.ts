import { Check, CheckContext } from './check';
export declare class LowMergeRatioCheck extends Check {
    readonly label: string;
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=low-merge-ratio.d.ts.map