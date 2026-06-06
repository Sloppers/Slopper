import { GitHubClient } from '../clients/github';
import { PrData } from '../core/types';
export declare class PrDataCollector {
    private readonly github;
    constructor(github: GitHubClient);
    collect(prNumber: number): Promise<PrData>;
    private collectAuthorProfile;
    private collectCommits;
    private collectFiles;
}
//# sourceMappingURL=collector.d.ts.map