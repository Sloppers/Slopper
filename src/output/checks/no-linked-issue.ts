import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class NoLinkedIssueCheck extends Check {
  readonly label = Labels.NO_LINKED_ISSUE.name

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.rules.require_linked_issue || !ctx.prData) return false
    const body = ctx.prData.body
    return !(/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i.test(body) || /#\d+/.test(body))
  }
}
