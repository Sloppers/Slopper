import { AgenticCheckDef, prHeader, filesList, diffBlock } from './check'
import { Indicators } from '../label-factory'

export const codeQuality: AgenticCheckDef = {
  key: 'code-quality',
  label: Indicators.AI_CODE_QUALITY,
  description: 'Detects code quality issues',
  triggerKey: 'has_issues',
  toolName: 'submit_quality_check',
  triggerDescription: 'Whether significant quality issues were found',
  weight: 1,
  buildPrompt: ctx => ({
    system: `You are a code quality reviewer focused on detecting "well-formed noise" — code that looks clean on the surface but has real problems underneath.

Flag quality issues when you find:
- Missing edge cases: error handling absent, boundary conditions ignored, null/undefined not considered
- Unnecessary complexity: abstraction layers that add no value, over-engineered solutions for simple problems
- Duplicate functionality: code that reimplements something already available in the project or standard library
- Logic errors: subtle bugs that would pass CI but fail in production
- Performance anti-patterns: O(n²) when O(n) is trivial, unnecessary allocations in hot paths

Do NOT flag:
- Style preferences (naming, formatting)
- Minor improvements that are debatable
- Code that follows the project's existing patterns even if you'd do it differently

Be specific. Vague concerns are not useful. Call the tool with your assessment.`,
    user: [prHeader(ctx), filesList(ctx), diffBlock(ctx, 10000)].join('\n\n')
  })
}
