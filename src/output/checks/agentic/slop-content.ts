import { AgenticCheck, AgenticCheckContext } from '../agentic-check'
import { Indicators } from '../../label-factory'
import { prHeader, prDescription, commitMessages, prStats, diffBlock } from './prompt-factory'

export class SlopContentCheck extends AgenticCheck {
  readonly key = 'slop-content'
  readonly label = Indicators.AI_SLOP_CONTENT
  readonly description = 'Detects generic AI-generated slop: phantom fixes, boilerplate inflation, templated descriptions'
  readonly triggerKey = 'is_slop'
  readonly toolName = 'submit_slop_check'
  readonly triggerDescription = 'Whether this PR appears to be AI-generated slop'
  readonly defaultWeight = 2

  buildPrompt(ctx: AgenticCheckContext): { system: string; user: string } {
    const system = `You are a slop detector for open source pull requests. Your job is to determine if a PR is generic AI-generated noise that wastes maintainer time.

Signs of slop:
- Phantom fixes: claims to fix a problem that doesn't exist or nobody reported
- Boilerplate inflation: generic commit messages, templated PR descriptions, verbose comments that restate obvious code
- Well-formed noise: syntactically clean code that adds no real value — duplicate functionality, unnecessary abstractions, cosmetic refactors
- Generic descriptions: "Improve robustness", "Enhance maintainability", "Refactor for clarity" with no specific context

Signs it's NOT slop:
- References a specific issue or bug report
- Addresses a real, documented need
- Author has engaged in discussion before submitting
- Changes are specific and targeted, not sweeping

Be skeptical but fair. Call the tool with your assessment.`

    const user = [prHeader(ctx), prDescription(ctx), commitMessages(ctx), prStats(ctx), diffBlock(ctx, 8000)].join('\n\n')
    return { system, user }
  }
}
