import { GitHubClient } from './clients/github';
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
export interface RulesConfig {
    require_description: boolean;
    require_linked_issue: boolean;
    max_files_changed: number;
    block_first_time_contributors: boolean;
}
export interface SlopperConfig {
    vouched: string[];
    banned: string[];
    actions: ActionsConfig;
    thresholds: ThresholdsConfig;
    ignore_paths: string[];
    rules: RulesConfig;
}
export declare class ConfigLoader {
    private readonly github;
    constructor(github: GitHubClient);
    load(): Promise<SlopperConfig>;
    private isYaml;
    private parseYamlConfig;
    private parsePlainText;
    private mergeWithDefaults;
}
