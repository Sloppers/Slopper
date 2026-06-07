import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check'
import { Indicators } from '../../label-factory'

export class SuspiciousAuthorCheck extends AgenticCheck {
  readonly key = 'suspicious-author'
  readonly label = Indicators.AI_SUSPICIOUS_AUTHOR
  readonly description = 'Evaluates the PR author profile for patterns common in slop accounts'
  readonly defaultWeight = 2

  buildPrompt(ctx: AgenticCheckContext): { system: string; user: string } {
    const system = `You are an investigator analyzing GitHub user profiles to detect accounts likely used for AI slop spam, reputation farming, or supply-chain attacks.

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

Be fair. New accounts are not automatically suspicious — look for the combination of signals. Call the tool with your assessment.`

    const author = ctx.prData.author
    const profile = ctx.authorProfile

    let user = `## Author: @${author.login}\n\n`
    user += `**Account:**\n`
    user += `- Created: ${author.created_at}\n`
    user += `- Public repos: ${author.public_repos}\n`
    user += `- Followers: ${author.followers} | Following: ${author.following}\n`
    user += `- Bio: ${author.bio || '(empty)'}\n`
    user += `- Company: ${author.company || '(none)'}\n`
    user += `- Is bot: ${author.is_bot}\n`
    user += `- Is collaborator: ${author.is_collaborator}\n`
    user += `- Past merged PRs in this repo: ${author.past_merged_prs_in_repo}\n`
    user += `- Past issues in this repo: ${author.past_issues_in_repo}\n`
    user += `- First time contributor: ${author.first_time_contributor}\n\n`

    if (profile) {
      user += `**Activity profile:**\n`
      user += `- Account age: ${profile.account_age_days} days\n`
      user += `- PRs in last 7 days: ${profile.prs_last_7d}\n`
      user += `- PRs in last 30 days: ${profile.prs_last_30d}\n`
      user += `- Distinct repos in last 30 days: ${profile.distinct_repos_30d}\n`
      user += `- Merge ratio: ${Math.round(profile.merge_ratio * 100)}%\n`
      user += `- Total stars: ${profile.total_stars}\n`
      user += `- Total issues: ${profile.total_issues}\n`
      user += `- Spray score: ${profile.spray_score}/100\n`
      user += `- Activity burst: ${profile.activity_burst}\n\n`
    }

    user += `**PR context:**\n`
    user += `- PR title: ${ctx.prData.title}\n`
    user += `- Target repo: ${ctx.prData.repo}\n`
    user += `- Files changed: ${ctx.prData.changed_files_count}\n`

    return { system, user }
  }

  buildToolSchema(): AgenticToolSchema {
    return {
      name: 'submit_author_check',
      description: 'Submit author profile analysis for a pull request',
      schema: {
        type: 'object' as const,
        additionalProperties: false,
        required: ['is_suspicious', 'confidence', 'reasoning', 'evidence'],
        properties: {
          is_suspicious: { type: 'boolean' as const, description: 'Whether this author profile shows suspicious patterns' },
          confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' as const, description: '2-3 sentence explanation of the assessment' },
          evidence: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Specific indicators found (e.g. "Account is 3 days old with 47 PRs across 12 repos")'
          }
        }
      }
    }
  }

  parseResult(raw: Record<string, unknown>): AgenticCheckResult {
    return {
      triggered: raw.is_suspicious as boolean,
      label: this.label,
      reasoning: raw.reasoning as string,
      confidence: raw.confidence as 'low' | 'medium' | 'high',
      evidence: raw.evidence as string[]
    }
  }
}
