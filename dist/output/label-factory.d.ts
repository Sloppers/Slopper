export interface LabelDef {
    readonly name: string;
    readonly color: string;
    readonly description: string;
}
export declare const Labels: {
    readonly SLOP: LabelDef;
    readonly LEGIT: LabelDef;
    readonly VOUCHED: LabelDef;
    readonly BANNED: LabelDef;
    readonly ANALYSIS_FAILED: LabelDef;
};
export declare const Indicators: {
    readonly RISK_LOW: "slopper/risk/low";
    readonly RISK_MEDIUM: "slopper/risk/medium";
    readonly RISK_HIGH: "slopper/risk/high";
    readonly RISK_CRITICAL: "slopper/risk/critical";
    readonly CONFIDENCE_HIGH: "slopper/confidence/high";
    readonly CONFIDENCE_MEDIUM: "slopper/confidence/medium";
    readonly CONFIDENCE_LOW: "slopper/confidence/low";
    readonly APPROVED: "slopper/approved";
    readonly DETERMINISTIC_MODE: "slopper/mode/deterministic";
    readonly FIRST_TIME_CONTRIBUTOR: "slopper/first-time-contributor";
    readonly CI_MODIFIED: "slopper/ci-modified";
    readonly DEPENDENCIES_MODIFIED: "slopper/dependencies-modified";
    readonly SECURITY_REVIEW: "slopper/needs-security-review";
    readonly SUSPICIOUS: "slopper/suspicious";
    readonly SPRAY_AND_PRAY: "slopper/spray-and-pray";
    readonly ACTIVITY_BURST: "slopper/activity-burst";
    readonly NEW_ACCOUNT: "slopper/new-account";
    readonly MISSING_DESCRIPTION: "slopper/missing-description";
    readonly NO_LINKED_ISSUE: "slopper/no-linked-issue";
    readonly TOO_MANY_FILES: "slopper/too-many-files";
    readonly RISKY_USER: "slopper/risky-user";
    readonly TRUSTED_ORG: "slopper/trusted-org";
    readonly VERIFIED_ORG: "slopper/verified-org";
    readonly HEAVY_CHANGES: "slopper/heavy-changes";
    readonly LARGE_FILE: "slopper/large-file";
    readonly LOW_MERGE_RATIO: "slopper/low-merge-ratio";
    readonly SUPPLY_CHAIN: "slopper/supply-chain";
    readonly UNSIGNED_COMMITS: "slopper/unsigned-commits";
    readonly NO_TESTS: "slopper/no-tests";
    readonly CODE_DUPLICATION: "slopper/code-duplication";
    readonly AI_SLOP_CONTENT: "slopper/ai/slop-content";
    readonly AI_DESCRIPTION_MISMATCH: "slopper/ai/description-mismatch";
    readonly AI_CODE_QUALITY: "slopper/ai/code-quality";
    readonly AI_SECURITY_CONCERN: "slopper/ai/security-concern";
    readonly AI_SUSPICIOUS_AUTHOR: "slopper/ai/suspicious-author";
};
export type LabelKey = keyof typeof Labels;
export declare function colorMap(): Record<string, string>;
export declare function confidenceLabel(level: string): string;
export declare function riskLabel(score: number, thresholds: {
    low: number;
    medium: number;
    high: number;
}): string;
//# sourceMappingURL=label-factory.d.ts.map