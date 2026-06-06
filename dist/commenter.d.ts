import { GitHubClient } from './clients/github';
import { AnalysisResult } from './types';
export interface CommentOptions {
    result: AnalysisResult;
    labels: string[];
    suggestVouch?: {
        author: string;
    };
    authorProfile?: {
        account_age_days: number;
        prs_last_7d: number;
        prs_last_30d: number;
        distinct_repos_30d: number;
        merge_ratio: number;
        spray_score: number;
    };
    aiFingerprint?: {
        score: number;
        signals: {
            name: string;
            score: number;
            detail: string;
        }[];
    };
}
export declare class PrCommentManager {
    private readonly github;
    constructor(github: GitHubClient);
    buildCommentBody(opts: CommentOptions): string;
    upsertComment(issueNumber: number, body: string): Promise<void>;
    applyLabels(issueNumber: number, labels: string[]): Promise<void>;
}
