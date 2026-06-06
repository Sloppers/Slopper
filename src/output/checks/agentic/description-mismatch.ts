import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check'
import { Labels } from '../../label-factory'

export class DescriptionMismatchCheck extends AgenticCheck {
  readonly key = 'description-mismatch'
  readonly label = Labels.AI_DESCRIPTION_MISMATCH.name
  readonly description = 'Detects when PR description does not match what the diff actually does'
  readonly defaultWeight = 1

  buildPrompt(ctx: AgenticCheckContext): { system: string; user: string } {
    const system = `You are a PR description auditor. Your job is to determine if a pull request's title and description accurately reflect what the code diff actually does.

Flag a mismatch when:
- The description claims to fix something but the diff doesn't address it
- The description is vague/generic while the changes are specific (or vice versa)
- The description mentions features or changes not present in the diff
- The diff contains significant changes not mentioned in the description

Do NOT flag when:
- The description is simply brief but accurate
- Minor omissions of trivial details
- The PR has no description (that's a different check)

Call the tool with your assessment.`

    const diff = ctx.prData.diff.length > 8000 ? ctx.prData.diff.slice(0, 8000) + '\n... (truncated)' : ctx.prData.diff

    const user = `## PR: ${ctx.prData.title}

**Description:**
${ctx.prData.body || '(no description)'}

**Files changed:** ${ctx.prData.files.map(f => `${f.filename} (+${f.additions}/-${f.deletions})`).join(', ')}

**Diff:**
\`\`\`
${diff}
\`\`\``

    return { system, user }
  }

  buildToolSchema(): AgenticToolSchema {
    return {
      name: 'submit_mismatch_check',
      description: 'Submit description-vs-diff mismatch analysis',
      schema: {
        type: 'object' as const,
        additionalProperties: false,
        required: ['has_mismatch', 'confidence', 'reasoning', 'evidence'],
        properties: {
          has_mismatch: { type: 'boolean' as const, description: 'Whether the description misrepresents the actual changes' },
          confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' as const, description: '2-3 sentence explanation' },
          evidence: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Specific mismatches found'
          }
        }
      }
    }
  }

  parseResult(raw: Record<string, unknown>): AgenticCheckResult {
    return {
      triggered: raw.has_mismatch as boolean,
      label: this.label,
      reasoning: raw.reasoning as string,
      confidence: raw.confidence as 'low' | 'medium' | 'high',
      evidence: raw.evidence as string[]
    }
  }
}
