import { AgenticCheck, AgenticCheckContext } from '../agentic-check'
import { Indicators } from '../../label-factory'
import { prHeader, filesList, diffBlock } from './prompt-factory'

export class CodeQualityCheck extends AgenticCheck {
  readonly key = 'code-quality'
  readonly label = Indicators.AI_CODE_QUALITY
  readonly description = 'Detects subtle code quality issues: missing edge cases, unnecessary complexity, duplicate functionality'
  readonly triggerKey = 'has_issues'
  readonly toolName = 'submit_quality_check'
  readonly triggerDescription = 'Whether significant quality issues were found'
  readonly defaultWeight = 1

  buildPrompt(ctx: AgenticCheckContext): { system: string; user: string } {
    const system = `You are a code quality reviewer focused on detecting "well-formed noise" — code that looks clean on the surface but has real problems underneath.

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

Be specific. Vague concerns are not useful. Call the tool with your assessment.`

    const user = [prHeader(ctx), filesList(ctx), diffBlock(ctx, 10000)].join('\n\n')
    return { system, user }
  }
}
