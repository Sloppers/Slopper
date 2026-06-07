import { Check, CheckContext } from '../check';
export declare class CodeDuplicationCheck extends Check {
    readonly label: "slopper/code-duplication";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=code-duplication.d.ts.map