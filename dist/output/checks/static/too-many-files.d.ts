import { Check, CheckContext } from '../check';
export declare class TooManyFilesCheck extends Check {
    readonly label: "slopper/too-many-files";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=too-many-files.d.ts.map