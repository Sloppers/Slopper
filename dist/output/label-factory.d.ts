export interface LabelDef {
    readonly name: string;
    readonly color: string;
    readonly description: string;
}
export declare const Labels: {
    readonly RISK_LOW: LabelDef;
    readonly RISK_MEDIUM: LabelDef;
    readonly RISK_HIGH: LabelDef;
    readonly RISK_CRITICAL: LabelDef;
    readonly CONFIDENCE_HIGH: LabelDef;
    readonly CONFIDENCE_MEDIUM: LabelDef;
    readonly CONFIDENCE_LOW: LabelDef;
    readonly APPROVED: LabelDef;
    readonly VOUCHED: LabelDef;
    readonly BANNED: LabelDef;
    readonly ANALYSIS_FAILED: LabelDef;
    readonly DETERMINISTIC_MODE: LabelDef;
    readonly FIRST_TIME_CONTRIBUTOR: LabelDef;
    readonly CI_MODIFIED: LabelDef;
    readonly DEPENDENCIES_MODIFIED: LabelDef;
    readonly SECURITY_REVIEW: LabelDef;
    readonly SUSPICIOUS: LabelDef;
    readonly SPRAY_AND_PRAY: LabelDef;
    readonly ACTIVITY_BURST: LabelDef;
    readonly NEW_ACCOUNT: LabelDef;
    readonly LIKELY_AI: LabelDef;
    readonly POSSIBLY_AI: LabelDef;
    readonly MISSING_DESCRIPTION: LabelDef;
    readonly NO_LINKED_ISSUE: LabelDef;
    readonly TOO_MANY_FILES: LabelDef;
    readonly RISKY_USER: LabelDef;
    readonly TRUSTED_ORG: LabelDef;
    readonly HEAVY_CHANGES: LabelDef;
    readonly LARGE_FILE: LabelDef;
    readonly LOW_MERGE_RATIO: LabelDef;
    readonly SUPPLY_CHAIN: LabelDef;
    readonly UNSIGNED_COMMITS: LabelDef;
    readonly NO_TESTS: LabelDef;
    readonly CODE_DUPLICATION: LabelDef;
    readonly AI_SLOP_CONTENT: LabelDef;
    readonly AI_DESCRIPTION_MISMATCH: LabelDef;
    readonly AI_CODE_QUALITY: LabelDef;
    readonly AI_SECURITY_CONCERN: LabelDef;
    readonly AI_SUSPICIOUS_AUTHOR: LabelDef;
};
export type LabelKey = keyof typeof Labels;
export declare function colorMap(): Record<string, string>;
export declare function confidenceLabel(level: string): LabelDef;
export declare function riskLabel(score: number, thresholds: {
    low: number;
    medium: number;
    high: number;
}): LabelDef;
//# sourceMappingURL=label-factory.d.ts.map