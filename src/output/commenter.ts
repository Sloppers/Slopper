import { GitHubClient } from '../clients/github'
import { AnalysisResult } from '../core/types'
import { ScoreResult } from './checks/check'
import { AgenticCheckResult } from './checks/check'
import { StepResult } from '../core/pipeline'
import { colorMap } from './label-factory'

const COMMENT_MARKER = '<!-- pr-trust-analysis -->'

const LABEL_COLORS = colorMap()

function formatDuration(ms: number): string {
  return `${ms}ms`
}

export interface CommentOptions {
  result?: AnalysisResult
  deterministicScore?: number
  riskLevel?: string
  signalBreakdown?: ScoreResult[]
  agenticResults?: AgenticCheckResult[]
  stepResults?: StepResult[]
  labels: string[]
  indicators?: string[]
  suggestVouch?: { author: string }
  authorProfile?: {
    account_age_days: number
    prs_last_7d: number
    prs_last_30d: number
    distinct_repos_30d: number
    merge_ratio: number
    spray_score: number
  }
}

export class PrCommentManager {
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    this.github = github
  }

  buildCommentBody(opts: CommentOptions): string {
    const { result, deterministicScore, riskLevel, signalBreakdown, agenticResults, stepResults, labels, indicators, suggestVouch, authorProfile } = opts

    const score = result?.risk_score ?? deterministicScore ?? 0
    const level = result?.risk_level ?? riskLevel ?? 'unknown'

    let md = `${COMMENT_MARKER}\n`
    md += `## Slopper — PR Trust Analysis\n\n`

    if (result) {
      md += `${result.summary}\n\n`
      md += `> **Risk:** **${score}**/10 (${level})`
      md += ` | **Confidence:** ${result.confidence}`
      md += ` | **Provider:** ${result.provider ?? 'unknown'}\n\n`
    } else {
      md += `> **Risk:** **${score}**/10 (${level})`
      md += ` | **Mode:** deterministic (no AI provider)\n\n`
    }

    if (stepResults && stepResults.length > 0) {
      md += `### Pipeline\n\n`
      md += `| Status | Task | Duration |\n`
      md += `|--------|------|----------|\n`
      for (const s of stepResults) {
        const icon = s.status === 'success' ? 'PASS' : 'FAIL'
        const dur = formatDuration(s.durationMs)
        md += `| ${icon} | ${s.name} | ${dur} |\n`
      }
      md += '\n'
    }

    if (signalBreakdown && signalBreakdown.length > 0) {
      const passed = signalBreakdown.filter(s => s.factor === 0).length
      const failed = signalBreakdown.filter(s => s.factor > 0).length
      md += `### Checks (${signalBreakdown.length} checks — ${passed} passed, ${failed} flagged)\n\n`
      md += `| Status | Check | Factor | Weight | Points |\n`
      md += `|--------|-------|--------|--------|--------|\n`
      for (const s of signalBreakdown) {
        let icon: string
        if (s.factor === 0) icon = 'PASS'
        else if (s.weight < 0) icon = 'TRUST'
        else icon = 'FAIL'
        const pts = s.points === 0 ? '—' : `${s.points > 0 ? '+' : ''}${Math.round(s.points * 10) / 10}`
        md += `| ${icon} | ${s.key} | ${Math.round(s.factor * 100)}% | ${s.weight} | ${pts} |\n`
      }
      md += '\n'
    }

    if (result?.author_assessment) {
      md += `### Author\n`
      md += `**Trust level:** ${result.author_assessment.trust_level}\n\n`
      md += `${result.author_assessment.reasoning}\n\n`
    }

    if (authorProfile) {
      md += `### Author Activity\n`
      md += `Account age: **${authorProfile.account_age_days}** days | `
      md += `PRs (7d): **${authorProfile.prs_last_7d}** | `
      md += `PRs (30d): **${authorProfile.prs_last_30d}** | `
      md += `Repos (30d): **${authorProfile.distinct_repos_30d}** | `
      md += `Merge ratio: **${Math.round(authorProfile.merge_ratio * 100)}%** | `
      md += `Spray score: **${authorProfile.spray_score}**/100\n\n`
    }

    if (result?.commit_assessment) {
      md += `### Commits\n`
      md += `**Quality:** ${result.commit_assessment.quality}\n\n`
      md += `${result.commit_assessment.reasoning}\n\n`
    }

    if (result?.code_assessment) {
      const cats = result.code_assessment.categories_flagged?.join(', ') || 'none'
      md += `### Code\n`
      md += `**Categories flagged:** ${cats}\n\n`
      md += `${result.code_assessment.reasoning}\n\n`

      if (result.code_assessment.suspicious_patterns?.length > 0) {
        md += `**Suspicious patterns:**\n\n`
        for (const p of result.code_assessment.suspicious_patterns) {
          md += `- [${p.severity}] \`${p.file}\` — ${p.description}\n`
        }
        md += '\n'
      }
    }

    if (result?.behavioral_signals) {
      const flags = result.behavioral_signals.flags?.join(', ') || 'none'
      md += `### Behavioral Signals\n`
      md += `**Flags:** ${flags}\n\n`
      md += `${result.behavioral_signals.reasoning}\n\n`
    }

    if (agenticResults && agenticResults.length > 0) {
      const triggered = agenticResults.filter(r => r.triggered)
      if (triggered.length > 0) {
        md += `### AI Checks\n`
        for (const r of triggered) {
          md += `- [${r.confidence}] **${r.label}**: ${r.reasoning}\n`
          if (r.evidence && r.evidence.length > 0) {
            for (const e of r.evidence) {
              md += `  - ${e}\n`
            }
          }
        }
        md += '\n'
      }
    }

    if (result?.review_suggestions?.length && result.review_suggestions.length > 0) {
      md += `### Review Suggestions\n\n`
      for (const s of result.review_suggestions) {
        md += `- [ ] ${s}\n`
      }
      md += '\n'
    }

    if (labels.length > 0) {
      md += `**Verdict:** ${labels.map(l => `\`${l}\``).join(' ')}\n\n`
    }

    if (indicators && indicators.length > 0) {
      md += `**Indicators:** ${indicators.map(l => `\`${l}\``).join(' ')}\n\n`
    }

    if (suggestVouch) {
      md += `> **Vouch suggestion** — @${suggestVouch.author} has a strong trust record. `
      md += `A code owner can comment \`/slopper vouch\` to permanently approve this contributor `
      md += `and skip future AI analysis.\n\n`
    }

    md += `---\n`
    md += `<sub>Powered by [slopper](https://github.com/Sloppers/Slopper) | `
    md += `${result?.provider ?? 'deterministic'} | `
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
