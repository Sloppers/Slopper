import { GitHubClient } from '../clients/github';
import { AuthorProfileAnalysis } from '../core/types';
import { SprayWeightsConfig } from '../core/config';
export declare class AuthorProfileAnalyzer {
    private readonly github;
    constructor(github: GitHubClient);
    analyze(username: string, burstWindowDays?: number, sprayWeights?: SprayWeightsConfig): Promise<AuthorProfileAnalysis>;
    private countSearchResults;
    private countDistinctRepos;
    private computeSprayScore;
}
//# sourceMappingURL=author-profile.d.ts.map