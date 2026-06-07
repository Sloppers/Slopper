import { Check, CheckContext } from './check';
export declare class UnsignedCommitsCheck extends Check {
    readonly label: "slopper/unsigned-commits";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
    scoreFactor(ctx: CheckContext): number;
}
//# sourceMappingURL=unsigned-commits.d.ts.map