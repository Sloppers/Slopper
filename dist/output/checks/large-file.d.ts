import { Check, CheckContext } from './check';
export declare class LargeFileCheck extends Check {
    readonly label: "slopper/large-file";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=large-file.d.ts.map