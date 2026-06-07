import { AnalysisResult, AuthorProfile, FileInfo, PrData, AuthorProfileAnalysis } from '../core/types';
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig, ScoreWeightsConfig } from '../core/config';
import { Check, CheckContext, ScoreResult } from './checks';
export type { CheckContext, ScoreResult };
export { Check };
export interface ComputeLabelsOptions {
    analysis?: AnalysisResult;
    files: FileInfo[];
    firstTimeContributor: boolean;
    prData?: PrData;
    authorProfile?: AuthorProfileAnalysis;
    riskyUser?: boolean;
    trustedOrg?: boolean;
    verifiedOrg?: boolean;
}
export declare class LabelComputer {
    private readonly thresholds;
    private readonly labelThresholds;
    private readonly rules;
    private readonly checks;
    private readonly derivedIndicators;
    constructor(thresholds?: ThresholdsConfig, rules?: RulesConfig, labelThresholds?: LabelThresholdsConfig, checks?: Check[]);
    compute(opts: ComputeLabelsOptions): string[];
    computeIndicators(opts: ComputeLabelsOptions): string[];
    computeFailedLabels(): string[];
    shouldSuggestVouch(analysis: AnalysisResult, author: AuthorProfile): boolean;
    computeScoreFromChecks(opts: ComputeLabelsOptions): {
        score: number;
        breakdown: ScoreResult[];
    };
    static computeDeterministicScore(opts: {
        authorProfile?: AuthorProfileAnalysis;
        riskyUser?: boolean;
        trustedOrg?: boolean;
        verifiedOrg?: boolean;
        weights?: ScoreWeightsConfig;
    }): number;
    static computeDeterministicResult(opts: {
        authorProfile?: AuthorProfileAnalysis;
        riskyUser?: boolean;
        trustedOrg?: boolean;
        verifiedOrg?: boolean;
        weights?: ScoreWeightsConfig;
    }): {
        score: number;
        breakdown: ScoreResult[];
    };
}
//# sourceMappingURL=labels.d.ts.map