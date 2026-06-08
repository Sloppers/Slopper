import { AgenticCheckDef, prHeader, prDescription, commitMessages, prStats, diffBlock } from './check'
import { Indicators } from '../label-factory'

export const slopContent: AgenticCheckDef = {
  key: 'slop-content',
  label: Indicators.AI_SLOP_CONTENT,
  description: 'Detects generic AI-generated slop',
  triggerKey: 'is_slop',
  toolName: 'submit_slop_check',
  triggerDescription: 'Whether this PR appears to be AI-generated slop',
  weight: 2,
  buildPrompt: ctx => ({
    system: `You are a slop detector for open source pull requests. Your job is to determine if a PR is generic AI-generated noise that wastes maintainer time.

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

Be skeptical but fair. Call the tool with your assessment.`,
    user: [prHeader(ctx), prDescription(ctx), commitMessages(ctx), prStats(ctx), diffBlock(ctx, 8000)].join('\n\n')
  })
}
