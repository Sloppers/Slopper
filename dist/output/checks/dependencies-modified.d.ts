import { Check, CheckContext } from './check';
export declare class DependenciesModifiedCheck extends Check {
    readonly label: "slopper/dependencies-modified";
    readonly defaultWeight = 1;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=dependencies-modified.d.ts.map