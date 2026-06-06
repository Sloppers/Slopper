import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check'
import { Labels } from '../../label-factory'

export class SlopContentCheck extends AgenticCheck {
  readonly key = 'slop-content'
  readonly label = Labels.AI_SLOP_CONTENT.name
  readonly description = 'Detects generic AI-generated slop: phantom fixes, boilerplate inflation, templated descriptions'
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

    const diff = ctx.prData.diff.length > 8000 ? ctx.prData.diff.slice(0, 8000) + '\n... (truncated)' : ctx.prData.diff

    const user = `## PR: ${ctx.prData.title}

**Description:**
${ctx.prData.body || '(no description)'}

**Commits (${ctx.prData.commits.count}):**
${ctx.prData.commits.messages.slice(0, 10).map(m => `- ${m}`).join('\n')}

**Files changed:** ${ctx.prData.changed_files_count}
**Additions:** ${ctx.prData.additions} | **Deletions:** ${ctx.prData.deletions}

**Diff:**
\`\`\`
${diff}
\`\`\``

    return { system, user }
  }

  buildToolSchema(): AgenticToolSchema {
    return {
      name: 'submit_slop_check',
      description: 'Submit slop content analysis for a pull request',
      schema: {
        type: 'object' as const,
        additionalProperties: false,
        required: ['is_slop', 'confidence', 'reasoning', 'evidence'],
        properties: {
          is_slop: { type: 'boolean' as const, description: 'Whether this PR appears to be AI-generated slop' },
          confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' as const, description: '2-3 sentence explanation' },
          evidence: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Specific indicators found (e.g. "Generic commit message: Fix typo")'
          }
        }
      }
    }
  }

  parseResult(raw: Record<string, unknown>): AgenticCheckResult {
    return {
      triggered: raw.is_slop as boolean,
      label: this.label,
      reasoning: raw.reasoning as string,
      confidence: raw.confidence as 'low' | 'medium' | 'high',
      evidence: raw.evidence as string[]
    }
  }
}
