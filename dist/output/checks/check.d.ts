import { AnalysisResult, FileInfo, PrData, AuthorProfileAnalysis, AiFingerprintResult } from '../../core/types';
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig } from '../../core/config';
export interface CheckContext {
    score: number;
    analysis?: AnalysisResult;
    files: FileInfo[];
    firstTimeContributor: boolean;
    prData?: PrData;
    authorProfile?: AuthorProfileAnalysis;
    aiFingerprint?: AiFingerprintResult;
    riskyUser?: boolean;
    trustedOrg?: boolean;
    thresholds: ThresholdsConfig;
    labelThresholds: LabelThresholdsConfig;
    rules: RulesConfig;
}
export interface ScoreResult {
    key: string;
    factor: number;
    weight: number;
    points: number;
}
export declare abstract class StaticCheck {
    abstract readonly label: string;
    readonly defaultWeight: number;
    abstract evaluate(ctx: CheckContext): boolean;
    scoreFactor(ctx: CheckContext): number;
}
export { StaticCheck as Check };
//# sourceMappingURL=check.d.ts.map