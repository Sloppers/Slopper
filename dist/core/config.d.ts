import { GitHubClient } from '../clients/github';
export interface AutoCloseConfig {
    enabled: boolean;
    threshold: number;
    comment: string;
}
export interface AutoApproveConfig {
    enabled: boolean;
    threshold: number;
}
export interface AutoRequestReviewConfig {
    enabled: boolean;
    threshold: number;
    reviewers: string[];
}
export interface ActionsConfig {
    auto_close: AutoCloseConfig;
    auto_approve: AutoApproveConfig;
    auto_request_review: AutoRequestReviewConfig;
}
export interface ThresholdsConfig {
    low: number;
    medium: number;
    high: number;
}
export interface SprayWeightsConfig {
    repos: number;
    volume: number;
    merge_ratio: number;
    account_age: number;
}
export interface ScoreWeightsConfig {
    spray: number;
    new_account: number;
    low_merge_ratio: number;
    risky_user: number;
    trusted_org: number;
}
export interface LabelThresholdsConfig {
    spray_score: number;
    spray_weights: SprayWeightsConfig;
    new_account_days: number;
    activity_burst_prs: number;
    activity_burst_days: number;
    merge_ratio_suspect: number;
    security_review_score: number;
    suspicious_score: number;
    score_weights: ScoreWeightsConfig;
}
export interface RulesConfig {
    require_description: boolean;
    require_linked_issue: boolean;
    max_files_changed: number;
    max_total_changes: number;
    max_file_changes: number;
    block_first_time_contributors: boolean;
}
export interface SlopperConfig {
    vouched: string[];
    banned: string[];
    trusted_orgs: string[];
    actions: ActionsConfig;
    thresholds: ThresholdsConfig;
    label_thresholds: LabelThresholdsConfig;
    ignore_paths: string[];
    rules: RulesConfig;
}
export declare class ConfigLoader {
    private readonly github;
    constructor(github: GitHubClient);
    load(): Promise<SlopperConfig>;
    private mergeUserLists;
    private isYaml;
    private parseYamlConfig;
    private parsePlainText;
    private mergeWithDefaults;
}
//# sourceMappingURL=config.d.ts.map