import { Check, CheckContext } from './check';
export declare class NoTestsCheck extends Check {
    readonly label: "slopper/no-tests";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=no-tests.d.ts.map