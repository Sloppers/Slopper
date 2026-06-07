import { GitHubClient } from './github';
export declare class BotGitHubClient extends GitHubClient {
    private readonly botUrl;
    private readonly oidcToken;
    constructor(token: string, owner: string, repo: string, oidcToken: string);
    upsertComment(issueNumber: number, marker: string, body: string): Promise<void>;
    createComment(issueNumber: number, body: string): Promise<void>;
    ensureLabel(name: string, color: string): Promise<void>;
    applyLabels(issueNumber: number, labels: string[]): Promise<void>;
    removeSlopperLabels(issueNumber: number): Promise<void>;
    closePr(prNumber: number): Promise<void>;
    approvePr(prNumber: number, body: string): Promise<void>;
    requestReviewers(prNumber: number, reviewers: string[]): Promise<void>;
    createOrUpdateFile(path: string, message: string, content: string): Promise<void>;
    createVouchPr(username: string, content: string): Promise<number>;
    createBanPr(username: string, content: string): Promise<number>;
    reportUser(username: string, reporter: string, pr: number): Promise<void>;
    private callBot;
}
//# sourceMappingURL=bot-github.d.ts.map