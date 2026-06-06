import { GitHubClient } from './clients/github';
import { AuthorProfileAnalysis } from './types';
export declare class AuthorProfileAnalyzer {
    private readonly github;
    constructor(github: GitHubClient);
    analyze(username: string): Promise<AuthorProfileAnalysis>;
    private countSearchResults;
    private countDistinctRepos;
    private computeSprayScore;
}
