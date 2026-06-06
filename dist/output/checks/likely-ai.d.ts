import { Check, CheckContext } from './check';
export declare class LikelyAiCheck extends Check {
    readonly label: string;
    readonly defaultWeight = 4;
    evaluate(ctx: CheckContext): boolean;
    scoreFactor(ctx: CheckContext): number;
}
//# sourceMappingURL=likely-ai.d.ts.map