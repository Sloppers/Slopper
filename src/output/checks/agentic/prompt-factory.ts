import { AgenticCheckContext, AgenticToolSchema } from '../agentic-check'
import { truncateDiff } from '../../../core/utils'

export function buildCheckSchema(opts: {
  toolName: string
  triggerKey: string
  triggerDescription: string
}): AgenticToolSchema {
  return {
    name: opts.toolName,
    description: `Submit ${opts.toolName.replace(/^submit_/, '').replace(/_/g, ' ')}`,
    schema: {
      type: 'object' as const,
      additionalProperties: false,
      required: [opts.triggerKey, 'confidence', 'reasoning', 'evidence'],
      properties: {
        [opts.triggerKey]: { type: 'boolean' as const, description: opts.triggerDescription },
        confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
        reasoning: { type: 'string' as const, description: '2-3 sentence summary of findings' },
        evidence: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Specific findings with context'
        }
      }
    }
  }
}

export function prHeader(ctx: AgenticCheckContext): string {
  return `## PR: ${ctx.prData.title}`
}

export function prDescription(ctx: AgenticCheckContext): string {
  return `**Description:**\n${ctx.prData.body || '(no description)'}`
}

export function filesList(ctx: AgenticCheckContext, opts?: { showBinary?: boolean }): string {
  const lines = ctx.prData.files.map(f => {
    let line = `- ${f.filename} (+${f.additions}/-${f.deletions})`
    if (opts?.showBinary && f.is_binary) line += ' [BINARY]'
    return line
  })
  return `**Files changed:**\n${lines.join('\n')}`
}

export function diffBlock(ctx: AgenticCheckContext, maxLength: number): string {
  const diff = truncateDiff(ctx.prData.diff, maxLength)
  return `**Diff:**\n\`\`\`\n${diff}\n\`\`\``
}

export function commitMessages(ctx: AgenticCheckContext, max = 10): string {
  const msgs = ctx.prData.commits.messages.slice(0, max).map(m => `- ${m}`).join('\n')
  return `**Commits (${ctx.prData.commits.count}):**\n${msgs}`
}

export function prStats(ctx: AgenticCheckContext): string {
  return `**Files changed:** ${ctx.prData.changed_files_count}\n**Additions:** ${ctx.prData.additions} | **Deletions:** ${ctx.prData.deletions}`
}

export function authorSection(ctx: AgenticCheckContext): string {
  const a = ctx.prData.author
  let out = `## Author: @${a.login}\n\n`
  out += `**Account:**\n`
  out += `- Created: ${a.created_at}\n`
  out += `- Public repos: ${a.public_repos}\n`
  out += `- Followers: ${a.followers} | Following: ${a.following}\n`
  out += `- Bio: ${a.bio || '(empty)'}\n`
  out += `- Company: ${a.company || '(none)'}\n`
  out += `- Is bot: ${a.is_bot}\n`
  out += `- Is collaborator: ${a.is_collaborator}\n`
  out += `- Past merged PRs in this repo: ${a.past_merged_prs_in_repo}\n`
  out += `- Past issues in this repo: ${a.past_issues_in_repo}\n`
  out += `- First time contributor: ${a.first_time_contributor}\n`

  const p = ctx.authorProfile
  if (p) {
    out += `\n**Activity profile:**\n`
    out += `- Account age: ${p.account_age_days} days\n`
    out += `- PRs in last 7 days: ${p.prs_last_7d}\n`
    out += `- PRs in last 30 days: ${p.prs_last_30d}\n`
    out += `- Distinct repos in last 30 days: ${p.distinct_repos_30d}\n`
    out += `- Merge ratio: ${Math.round(p.merge_ratio * 100)}%\n`
    out += `- Total stars: ${p.total_stars}\n`
    out += `- Total issues: ${p.total_issues}\n`
    out += `- Spray score: ${p.spray_score}/100\n`
    out += `- Activity burst: ${p.activity_burst}\n`
  }

  out += `\n**PR context:**\n`
  out += `- PR title: ${ctx.prData.title}\n`
  out += `- Target repo: ${ctx.prData.repo}\n`
  out += `- Files changed: ${ctx.prData.changed_files_count}\n`

  return out
}
