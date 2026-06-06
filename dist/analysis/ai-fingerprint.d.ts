import { AiFingerprintResult } from '../core/types';
export declare class AiFingerprintAnalyzer {
    analyze(diff: string, commitMessages?: string[]): AiFingerprintResult;
    private extractAddedLines;
    private analyzeCommentDensity;
    private analyzeVerboseIdentifiers;
    private analyzeSlopVocabulary;
    private analyzeDocstringDensity;
    private analyzeBoilerplate;
    private analyzeStructuralPatterns;
}
//# sourceMappingURL=ai-fingerprint.d.ts.map