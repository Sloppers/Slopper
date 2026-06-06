import { Check, CheckContext } from './check';
export declare class UnsignedCommitsCheck extends Check {
    readonly label: string;
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
    scoreFactor(ctx: CheckContext): number;
}
//# sourceMappingURL=unsigned-commits.d.ts.map