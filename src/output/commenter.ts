import { GitHubClient } from '../clients/github'
import { AnalysisResult } from '../core/types'
import { ScoreResult } from './checks/check'
import { AgenticCheckResult } from './checks/agentic-check'
import { StepResult } from '../core/pipeline'
import { colorMap } from './label-factory'

const COMMENT_MARKER = '<!-- pr-trust-analysis -->'

const LABEL_COLORS = colorMap()

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000)
  if (secs < 60) return `${secs} seconds`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  if (rem === 0) return mins === 1 ? 'a minute' : `${mins} minutes`
  return mins === 1 ? `a minute` : `${mins} minutes`
}

export interface CommentOptions {
  result?: AnalysisResult
  deterministicScore?: number
  riskLevel?: string
  signalBreakdown?: ScoreResult[]
  agenticResults?: AgenticCheckResult[]
  stepResults?: StepResult[]
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
    const { result, deterministicScore, riskLevel, signalBreakdown, agenticResults, stepResults, labels, suggestVouch, authorProfile, aiFingerprint } = opts
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

    if (stepResults && stepResults.length > 0) {
      md += `<details>\n<summary>Pipeline</summary>\n\n`
      md += `#### Steps\n`
      md += `| Status | Task | Duration |\n`
      md += `|--------|------|----------|\n`
      for (const s of stepResults) {
        const icon = s.status === 'success' ? '✔️' : '❌'
        const dur = formatDuration(s.durationMs)
        md += `| ${icon} | ${s.name} | ${dur} |\n`
      }
      md += '\n'

      if (signalBreakdown && signalBreakdown.length > 0) {
        const passed = signalBreakdown.filter(s => s.factor === 0).length
        const failed = signalBreakdown.filter(s => s.factor > 0).length
        md += `#### Checks (${signalBreakdown.length} checks — ${passed} passed, ${failed} flagged)\n`
        md += `| Status | Check | Factor | Weight | Points |\n`
        md += `|--------|-------|--------|--------|--------|\n`
        for (const s of signalBreakdown) {
          let icon: string
          if (s.factor === 0) icon = '✔️ PASS'
          else if (s.weight < 0) icon = '🟢 TRUST'
          else icon = '❌ FAIL'
          const pts = s.points === 0 ? '—' : `${s.points > 0 ? '+' : ''}${Math.round(s.points * 10) / 10}`
          md += `| ${icon} | ${s.key} | ${Math.round(s.factor * 100)}% | ${s.weight} | ${pts} |\n`
        }
        md += '\n'
      }

      md += `<details>\n<summary>Full pipeline log</summary>\n\n`
      md += '```\n'
      for (const s of stepResults) {
        const tag = s.status === 'success' ? 'PASS' : 'FAIL'
        const dur = `${s.durationMs}ms`
        md += `[${tag}] ${s.name} (${dur})\n`
        if (s.error) md += `       Error: ${s.error}\n`
      }
      md += '```\n</details>\n'

      md += `\n</details>\n\n`
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

    if (signalBreakdown && signalBreakdown.length > 0) {
      const active = signalBreakdown.filter(s => s.points !== 0)
      if (active.length > 0) {
        md += `#### ⚖️ Score Breakdown\n`
        md += `| Signal | Factor | Weight | Points |\n`
        md += `|--------|--------|--------|--------|\n`
        for (const s of active) {
          const sign = s.points > 0 ? '+' : ''
          md += `| ${s.key} | ${Math.round(s.factor * 100)}% | ${s.weight} | ${sign}${Math.round(s.points * 10) / 10} |\n`
        }
        md += '\n'
      }
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

    if (agenticResults && agenticResults.length > 0) {
      const triggered = agenticResults.filter(r => r.triggered)
      if (triggered.length > 0) {
        md += `#### 🤖 AI Checks\n`
        for (const r of triggered) {
          const confBadge: Record<string, string> = { high: '🔴', medium: '🟠', low: '🟡' }
          md += `- ${confBadge[r.confidence] ?? '⚪'} **${r.label}** (${r.confidence}): ${r.reasoning}\n`
          if (r.evidence && r.evidence.length > 0) {
            for (const e of r.evidence) {
              md += `  - ${e}\n`
            }
          }
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
