import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check'
import { Labels } from '../../label-factory'

export class CodeQualityCheck extends AgenticCheck {
  readonly key = 'code-quality'
  readonly label = Labels.AI_CODE_QUALITY.name
  readonly description = 'Detects subtle code quality issues: missing edge cases, unnecessary complexity, duplicate functionality'
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

    const diff = ctx.prData.diff.length > 10000 ? ctx.prData.diff.slice(0, 10000) + '\n... (truncated)' : ctx.prData.diff

    const user = `## PR: ${ctx.prData.title}

**Files changed:**
${ctx.prData.files.map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n')}

**Diff:**
\`\`\`
${diff}
\`\`\``

    return { system, user }
  }

  buildToolSchema(): AgenticToolSchema {
    return {
      name: 'submit_quality_check',
      description: 'Submit code quality analysis',
      schema: {
        type: 'object' as const,
        additionalProperties: false,
        required: ['has_issues', 'confidence', 'reasoning', 'evidence'],
        properties: {
          has_issues: { type: 'boolean' as const, description: 'Whether significant quality issues were found' },
          confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' as const, description: '2-3 sentence summary of findings' },
          evidence: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Specific issues found with file and description (e.g. "src/auth.ts: missing null check on user lookup")'
          }
        }
      }
    }
  }

  parseResult(raw: Record<string, unknown>): AgenticCheckResult {
    return {
      triggered: raw.has_issues as boolean,
      label: this.label,
      reasoning: raw.reasoning as string,
      confidence: raw.confidence as 'low' | 'medium' | 'high',
      evidence: raw.evidence as string[]
    }
  }
}
