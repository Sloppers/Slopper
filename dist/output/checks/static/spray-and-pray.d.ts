import { Check, CheckContext } from '../check';
export declare class SprayAndPrayCheck extends Check {
    readonly label: "slopper/spray-and-pray";
    readonly defaultWeight = 3;
    evaluate(ctx: CheckContext): boolean;
    scoreFactor(ctx: CheckContext): number;
}
//# sourceMappingURL=spray-and-pray.d.ts.map