import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class NoLinkedIssueCheck extends Check {
  readonly label = Indicators.NO_LINKED_ISSUE

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.rules.require_linked_issue || !ctx.prData) return false
    const body = ctx.prData.body
    return !(/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i.test(body) || /#\d+/.test(body))
  }
}
