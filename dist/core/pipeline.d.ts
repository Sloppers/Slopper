import { AnalysisResult, PrData, AuthorProfileAnalysis, AiFingerprintResult } from './types';
import { SlopperConfig } from './config';
import { ScoreResult } from '../output/checks/check';
import { AgenticCheckResult } from '../output/checks/agentic-check';
export interface StepResult {
    name: string;
    status: 'success' | 'failure';
    startTime: Date;
    durationMs: number;
    error?: string;
}
export interface PipelineContext {
    prNumber: number;
    config?: SlopperConfig;
    prAuthor?: string;
    prData?: PrData;
    authorProfile?: AuthorProfileAnalysis;
    aiFingerprint?: AiFingerprintResult;
    analysisResult?: AnalysisResult;
    analysisFailed?: boolean;
    deterministicScore?: number;
    signalBreakdown?: ScoreResult[];
    agenticResults?: AgenticCheckResult[];
    stepResults?: StepResult[];
    labels?: string[];
    vouched?: boolean;
    vouchedBy?: string;
    addToSlopperFile?: string;
    banned?: boolean;
    riskyUser?: boolean;
    trustedOrg?: boolean;
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
//# sourceMappingURL=pipeline.d.ts.map