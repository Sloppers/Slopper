import { AnalysisResult, PrData, AuthorProfileAnalysis, AiFingerprintResult } from './types';
import { SlopperConfig } from './config';
export interface PipelineContext {
    prNumber: number;
    config?: SlopperConfig;
    prAuthor?: string;
    prData?: PrData;
    authorProfile?: AuthorProfileAnalysis;
    aiFingerprint?: AiFingerprintResult;
    analysisResult?: AnalysisResult;
    analysisFailed?: boolean;
    labels?: string[];
    vouched?: boolean;
    vouchedBy?: string;
    addToSlopperFile?: string;
    banned?: boolean;
}
export declare abstract class PipelineStep {
    abstract readonly name: string;
    abstract execute(ctx: PipelineContext): Promise<PipelineContext>;
}
export declare class AnalysisPipeline {
    private readonly steps;
    constructor(steps: PipelineStep[]);
    run(initialContext: PipelineContext): Promise<PipelineContext>;
}
