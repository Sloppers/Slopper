import { Check, CheckContext } from './check';
export declare class SupplyChainCheck extends Check {
    readonly label: string;
    readonly defaultWeight = 2;
    evaluate(ctx: CheckContext): boolean;
    private hasLockfileWithoutManifest;
    private hasSuspiciousDiffPatterns;
}
//# sourceMappingURL=supply-chain.d.ts.map