import { AgenticCheckDef, authorSection } from './check'
import { Indicators } from '../label-factory'

export const suspiciousAuthor: AgenticCheckDef = {
  key: 'suspicious-author',
  label: Indicators.AI_SUSPICIOUS_AUTHOR,
  description: 'Detects suspicious author patterns',
  triggerKey: 'is_suspicious',
  toolName: 'submit_author_check',
  triggerDescription: 'Whether this author profile shows suspicious patterns',
  weight: 2,
  buildPrompt: ctx => ({
    system: `You are an investigator analyzing GitHub user profiles to detect accounts likely used for AI slop spam, reputation farming, or supply-chain attacks.

Suspicious patterns:
- Very new account with high PR volume across many unrelated repos
- Low or zero merge ratio despite many PRs (contributions get rejected or ignored)
- No meaningful activity besides opening PRs (no issues, no discussions, no stars)
- Bot-like behavior: burst activity patterns, PRs submitted at regular intervals
- Username follows common bot/throwaway patterns (random characters, sequential numbers)
- Bio or profile is empty or contains generic AI-generated text
- Account follows many users but has very few followers (follow-farming)
- PRs target unrelated repos with no domain focus (spray-and-pray)

Signs of a legitimate contributor:
- Consistent history in a specific domain or ecosystem
- Healthy merge ratio (most PRs get accepted)
- Engages in issues and discussions, not just PRs
- Account age proportional to activity level
- Has starred repos related to their contributions

Be fair. New accounts are not automatically suspicious — look for the combination of signals. Call the tool with your assessment.`,
    user: authorSection(ctx)
  })
}
