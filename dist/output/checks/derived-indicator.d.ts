import { CheckContext } from './check';
export declare abstract class DerivedIndicator {
    abstract readonly label: string;
    abstract evaluate(ctx: CheckContext): boolean;
}
export declare function allDerivedIndicators(): DerivedIndicator[];
//# sourceMappingURL=derived-indicator.d.ts.map