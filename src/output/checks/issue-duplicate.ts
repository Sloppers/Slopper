import { IssueCheckDef, IssueCheckContext } from './issue-check'
import { IssueData } from '../../core/types'
import { Indicators } from '../label-factory'

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  )
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  let intersection = 0
  for (const word of a) {
    if (b.has(word)) intersection++
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function findDuplicates(issue: IssueData, candidates: IssueData[], threshold: number): Array<{ issue: IssueData; similarity: number }> {
  const issueTokens = tokenize(`${issue.title} ${issue.body}`)
  const matches: Array<{ issue: IssueData; similarity: number }> = []

  for (const candidate of candidates) {
    if (candidate.issue_number === issue.issue_number) continue
    const candidateTokens = tokenize(`${candidate.title} ${candidate.body}`)
    const similarity = jaccardSimilarity(issueTokens, candidateTokens)
    if (similarity >= threshold) {
      matches.push({ issue: candidate, similarity })
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity)
}

function evaluate(ctx: IssueCheckContext): boolean {
  if (!ctx.recentIssues || ctx.recentIssues.length === 0) return false
  const duplicates = findDuplicates(ctx.issueData, ctx.recentIssues, ctx.rules.duplicate_threshold)
  return duplicates.length > 0
}

export const issueDuplicate: IssueCheckDef = {
  label: Indicators.ISSUE_DUPLICATE,
  weight: 2,
  evaluate
}
