import { GitHubClient } from '../clients/github'
import { AnalysisResult } from '../core/types'

const COMMENT_MARKER = '<!-- pr-trust-analysis -->'

const LABEL_COLORS: Record<string, string> = {
  'slopper/approved': '0e8a16',
  'slopper/vouched': '0e8a16',
  'slopper/banned': 'b60205',
  'slopper/confidence/high': '0e8a16',
  'slopper/confidence/medium': 'fbca04',
  'slopper/confidence/low': 'e4e669',
  'slopper/risk/low': '0e8a16',
  'slopper/risk/medium': 'fbca04',
  'slopper/risk/high': 'e99695',
  'slopper/risk/critical': 'b60205',
  'slopper/first-time-contributor': 'c5def5',
  'slopper/ci-modified': 'd4c5f9',
  'slopper/dependencies-modified': 'f9d0c4',
  'slopper/needs-security-review': 'b60205',
  'slopper/suspicious': 'b60205',
  'slopper/analysis-failed': 'cccccc',
  'slopper/spray-and-pray': 'b60205',
  'slopper/activity-burst': 'e99695',
  'slopper/new-account': 'fbca04',
  'slopper/likely-ai-generated': 'b60205',
  'slopper/possibly-ai-generated': 'fbca04',
  'slopper/missing-description': 'e4e669',
  'slopper/no-linked-issue': 'e4e669',
  'slopper/too-many-files': 'e4e669',
  'slopper/risky-user': 'b60205',
  'slopper/mode/deterministic': '1d76db'
}

export interface CommentOptions {
  result?: AnalysisResult
  deterministicScore?: number
  riskLevel?: string
  labels: string[]
  suggestVouch?: { author: string }
  authorProfile?: {
    account_age_days: number
    prs_last_7d: number
    prs_last_30d: number
    distinct_repos_30d: number
    merge_ratio: number
    spray_score: number
  }
  aiFingerprint?: {
    score: number
    signals: { name: string; score: number; detail: string }[]
  }
}

export class PrCommentManager {
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    this.github = github
  }

  buildCommentBody(opts: CommentOptions): string {
    const { result, deterministicScore, riskLevel, labels, suggestVouch, authorProfile, aiFingerprint } = opts
    const riskEmoji: Record<string, string> = {
      low: '🟢', medium: '🟡', high: '🟠', critical: '🔴', unknown: '⚪'
    }

    const score = result?.risk_score ?? deterministicScore ?? 0
    const level = result?.risk_level ?? riskLevel ?? 'unknown'
    const badge = riskEmoji[level] ?? '⚪'

    let md = `${COMMENT_MARKER}\n`
    md += `## ${badge} Slopper — PR Trust Analysis\n\n`

    if (result) {
      md += `${result.summary}\n\n`
      const confBadge: Record<string, string> = { high: '🟢', medium: '🟡', low: '🔴' }
      md += `> **Risk:** ${badge} **${score}**/10 (${level})`
      md += ` · **Confidence:** ${confBadge[result.confidence] ?? '⚪'} ${result.confidence}`
      md += ` · **Provider:** ${result.provider ?? 'unknown'}\n\n`
    } else {
      md += `> **Risk:** ${badge} **${score}**/10 (${level})`
      md += ` · **Mode:** deterministic (no AI provider)\n\n`
    }

    md += `<details>\n<summary>Walkthrough</summary>\n\n`

    if (result?.author_assessment) {
      md += `#### 👤 Author\n`
      md += `**Trust level:** ${result.author_assessment.trust_level}\n\n`
      md += `${result.author_assessment.reasoning}\n\n`
    }

    if (authorProfile) {
      md += `#### 📊 Author Activity\n`
      md += `Account age: **${authorProfile.account_age_days}** days · `
      md += `PRs (7d): **${authorProfile.prs_last_7d}** · `
      md += `PRs (30d): **${authorProfile.prs_last_30d}** · `
      md += `Repos (30d): **${authorProfile.distinct_repos_30d}** · `
      md += `Merge ratio: **${Math.round(authorProfile.merge_ratio * 100)}%** · `
      md += `Spray score: **${authorProfile.spray_score}**/100\n\n`
    }

    if (result?.commit_assessment) {
      md += `#### 📝 Commits\n`
      md += `**Quality:** ${result.commit_assessment.quality}\n\n`
      md += `${result.commit_assessment.reasoning}\n\n`
    }

    if (result?.code_assessment) {
      const cats = result.code_assessment.categories_flagged?.join(', ') || 'none'
      md += `#### 🔍 Code\n`
      md += `**Categories flagged:** ${cats}\n\n`
      md += `${result.code_assessment.reasoning}\n\n`

      if (result.code_assessment.suspicious_patterns?.length > 0) {
        md += `**Suspicious patterns:**\n\n`
        for (const p of result.code_assessment.suspicious_patterns) {
          const sevEmoji: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '⚪' }
          md += `- ${sevEmoji[p.severity] ?? '⚪'} \`${p.file}\` — ${p.description}\n`
        }
        md += '\n'
      }
    }

    if (result?.behavioral_signals) {
      const flags = result.behavioral_signals.flags?.join(', ') || 'none'
      md += `#### 🚩 Behavioral Signals\n`
      md += `**Flags:** ${flags}\n\n`
      md += `${result.behavioral_signals.reasoning}\n\n`
    }

    if (aiFingerprint) {
      md += `#### 🤖 AI Fingerprint\n`
      md += `**Score:** ${aiFingerprint.score}/100`
      if (aiFingerprint.score >= 70) md += ` (likely AI-generated)`
      else if (aiFingerprint.score >= 40) md += ` (possibly AI-generated)`
      else md += ` (likely human)`
      md += '\n\n'
      if (aiFingerprint.signals.length > 0) {
        for (const s of aiFingerprint.signals.filter(s => s.score > 20)) {
          md += `- **${s.name}** (${s.score}/100): ${s.detail}\n`
        }
        md += '\n'
      }
    }

    md += `</details>\n\n`

    if (result?.review_suggestions?.length && result.review_suggestions.length > 0) {
      md += `<details>\n<summary>📋 Review Suggestions</summary>\n\n`
      for (const s of result.review_suggestions) {
        md += `- [ ] ${s}\n`
      }
      md += `\n</details>\n\n`
    }

    if (labels.length > 0) {
      md += `**Labels:** ${labels.map(l => `\`${l}\``).join(' ')}\n\n`
    }

    if (suggestVouch) {
      md += `> 💡 **Vouch suggestion** — @${suggestVouch.author} has a strong trust record. `
      md += `A code owner can comment \`/slopper vouch\` to permanently approve this contributor `
      md += `and skip future AI analysis.\n\n`
    }

    md += `---\n`
    md += `<sub>Powered by [slopper](https://github.com/malvads/slopper) · `
    md += `${result?.provider ?? 'deterministic'} · `
    md += `Never blocks merging</sub>\n`

    return md
  }

  async upsertComment(issueNumber: number, body: string): Promise<void> {
    await this.github.upsertComment(issueNumber, COMMENT_MARKER, body)
  }

  async applyLabels(issueNumber: number, labels: string[]): Promise<void> {
    await this.github.removeSlopperLabels(issueNumber)
    for (const name of labels) {
      await this.github.ensureLabel(name, LABEL_COLORS[name] ?? 'ededed')
    }
    await this.github.applyLabels(issueNumber, labels)
  }
}
