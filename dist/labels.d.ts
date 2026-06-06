import { AnalysisResult, AuthorProfile, FileInfo, PrData, AuthorProfileAnalysis, AiFingerprintResult } from './types';
import { ThresholdsConfig, RulesConfig } from './config';
export interface ComputeLabelsOptions {
    analysis: AnalysisResult;
    files: FileInfo[];
    firstTimeContributor: boolean;
    prData?: PrData;
    authorProfile?: AuthorProfileAnalysis;
    aiFingerprint?: AiFingerprintResult;
}
export declare class LabelComputer {
    private readonly thresholds;
    private readonly rules;
    constructor(thresholds?: ThresholdsConfig, rules?: RulesConfig);
    compute(opts: ComputeLabelsOptions): string[];
    computeFailedLabels(): string[];
    shouldSuggestVouch(analysis: AnalysisResult, author: AuthorProfile): boolean;
    private ruleLabels;
    private hasLinkedIssue;
    private riskLabel;
    private hasCiChanges;
    private hasDependencyChanges;
}
