import { IssueAgenticCheckDef, issueSection, issueAuthorSection } from './issue-check'
import { Indicators } from '../label-factory'

const SYSTEM_PROMPT = `You are an investigator analyzing GitHub user profiles in the context of issue submissions. Your job is to detect accounts likely used for AI slop spam or reputation farming via issues.

Suspicious patterns:
- Very new account opening many issues across unrelated repos
- No meaningful activity besides opening issues (no PRs, no discussions, no stars)
- Bot-like behavior: issues submitted at regular intervals with similar structure
- Generic username patterns (random characters, sequential numbers)
- Bio or profile is empty or contains generic AI-generated text
- Issues target unrelated repos with no domain focus

Signs of a legitimate contributor:
- Consistent history in a specific domain or ecosystem
- Engages in discussions, not just opens issues
- Account age proportional to activity level
- Prior contributions to the same repo

Be fair. New accounts are not automatically suspicious — look for the combination of signals. Call the tool with your assessment.`

export const issueSuspiciousAuthor: IssueAgenticCheckDef = {
  key: 'issue-suspicious-author',
  label: Indicators.AI_SUSPICIOUS_AUTHOR,
  description: 'Detects suspicious issue author patterns',
  triggerKey: 'is_suspicious',
  toolName: 'submit_issue_author_check',
  triggerDescription: 'Whether this issue author shows suspicious patterns',
  weight: 2,
  buildPrompt: ctx => ({
    system: SYSTEM_PROMPT,
    user: [issueAuthorSection(ctx), issueSection(ctx)].join('\n\n')
  })
}
