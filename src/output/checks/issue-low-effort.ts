import { IssueCheckDef, IssueCheckContext } from './issue-check'
import { Indicators } from '../label-factory'

const LOW_EFFORT_PATTERNS = [
  /^(please\s+)?(fix|update|change|add|remove)\s+/i,
  /^(this\s+)?(is\s+)?(broken|not working|doesn't work|bug)/i,
  /^(can\s+)?(you\s+)?(please\s+)?help/i,
  /^(i\s+)?(need|want)\s+/i,
]

function evaluate(ctx: IssueCheckContext): boolean {
  const body = ctx.issueData.body.trim()
  if (body.length === 0) return false

  const lines = body.split('\n').filter(l => l.trim().length > 0)
  if (lines.length <= 1 && body.length < 100) return true

  return LOW_EFFORT_PATTERNS.some(p => p.test(body)) && lines.length <= 2
}

export const issueLowEffort: IssueCheckDef = {
  label: Indicators.ISSUE_LOW_EFFORT,
  weight: 2,
  evaluate
}
