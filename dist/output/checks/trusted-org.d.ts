import { Check, CheckContext } from './check';
export declare class TrustedOrgCheck extends Check {
    readonly label: "slopper/trusted-org";
    readonly defaultWeight = -2;
    evaluate(ctx: CheckContext): boolean;
}
//# sourceMappingURL=trusted-org.d.ts.map