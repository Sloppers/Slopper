import { GitHubClient } from '../clients/github'
import { IssueData } from '../core/types'
import { ScoreResult } from './checks/check'
import { AgenticCheckResult } from './checks/check'
import { StepResult } from '../core/pipeline'
import { colorMap } from './label-factory'
import { findDuplicates } from './checks/issue-duplicate'

const COMMENT_MARKER = '<!-- slopper-issue-analysis -->'

const LABEL_COLORS = colorMap()

function formatDuration(ms: number): string {
  return `${ms}ms`
}

export interface IssueCommentOptions {
  issueData: IssueData
  deterministicScore?: number
  riskLevel?: string
  signalBreakdown?: ScoreResult[]
  agenticResults?: AgenticCheckResult[]
  stepResults?: StepResult[]
  labels: string[]
  indicators?: string[]
  recentIssues?: IssueData[]
  duplicateThreshold?: number
  authorProfile?: {
    account_age_days: number
    prs_last_7d: number
    prs_last_30d: number
    distinct_repos_30d: number
    merge_ratio: number
    spray_score: number
  }
}

export class IssueCommentManager {
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    this.github = github
  }

  buildCommentBody(opts: IssueCommentOptions): string {
    const { issueData, deterministicScore, riskLevel, signalBreakdown, agenticResults, stepResults, labels, indicators, recentIssues, duplicateThreshold, authorProfile } = opts

    const score = deterministicScore ?? 0
    const level = riskLevel ?? 'unknown'

    let md = `${COMMENT_MARKER}\n`
    md += `## Slopper — Issue Trust Analysis\n\n`
    md += `> **Risk:** **${score}**/10 (${level})`
    md += ` | **Mode:** deterministic\n\n`

    if (stepResults && stepResults.length > 0) {
      md += `### Pipeline\n\n`
      md += `| Status | Task | Duration |\n`
      md += `|--------|------|----------|\n`
      for (const s of stepResults) {
        const icon = s.status === 'success' ? 'PASS' : 'FAIL'
        md += `| ${icon} | ${s.name} | ${formatDuration(s.durationMs)} |\n`
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

    if (recentIssues && recentIssues.length > 0) {
      const threshold = duplicateThreshold ?? 0.7
      const duplicates = findDuplicates(issueData, recentIssues, threshold)
      if (duplicates.length > 0) {
        md += `### Potential Duplicates\n\n`
        for (const d of duplicates.slice(0, 5)) {
          const pct = Math.round(d.similarity * 100)
          md += `- #${d.issue.issue_number}: ${d.issue.title} (${pct}% similar)\n`
        }
        md += '\n'
      }
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

    if (labels.length > 0) {
      md += `**Verdict:** ${labels.map(l => `\`${l}\``).join(' ')}\n\n`
    }

    if (indicators && indicators.length > 0) {
      md += `**Indicators:** ${indicators.map(l => `\`${l}\``).join(' ')}\n\n`
    }

    md += `---\n`
    md += `<sub>Powered by [slopper](https://github.com/Sloppers/Slopper) | `
    md += `deterministic | `
    md += `Issue analysis</sub>\n`

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
