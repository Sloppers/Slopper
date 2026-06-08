import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const noLinkedIssue: CheckDef = {
  label: Indicators.NO_LINKED_ISSUE,
  weight: 1,
  evaluate: ctx => {
    if (!ctx.rules.require_linked_issue || !ctx.prData) return false
    const body = ctx.prData.body
    const regexes = ctx.patterns.linked_issue_patterns.map(p => new RegExp(p, 'i'))
    return !regexes.some(r => r.test(body))
  }
}
