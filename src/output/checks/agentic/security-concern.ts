import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../agentic-check'
import { Labels } from '../../label-factory'

export class SecurityConcernCheck extends AgenticCheck {
  readonly key = 'security-concern'
  readonly label = Labels.AI_SECURITY_CONCERN.name
  readonly description = 'Detects security concerns: obfuscated code, credential patterns, suspicious URLs, backdoors'
  readonly defaultWeight = 2

  buildPrompt(ctx: AgenticCheckContext): { system: string; user: string } {
    const system = `You are a security reviewer for open source pull requests. Your job is to detect potentially malicious or dangerous code changes.

Flag security concerns when you find:
- Obfuscated code: base64 blobs, hex-encoded strings, minified code in non-minified contexts
- Dynamic code execution: eval(), exec(), Function constructor, import() with variable arguments
- Credential/secret patterns: hardcoded API keys, tokens, passwords, connection strings
- Suspicious URLs: raw IPs, unusual domains, data exfiltration endpoints
- CI/CD tampering: changes to workflows that add code execution, modify permissions, or disable checks
- Dependency manipulation: adding unexpected packages, changing registries, typosquatting names
- Backdoor patterns: hidden functionality, conditional execution based on environment, network calls to external services

Do NOT flag:
- Standard use of environment variables for configuration
- Normal CI/CD pipeline changes (adding tests, updating versions)
- Dependencies that are well-known and appropriate for the project

Err on the side of caution — false positives are better than missed security issues. Call the tool with your assessment.`

    const diff = ctx.prData.diff.length > 10000 ? ctx.prData.diff.slice(0, 10000) + '\n... (truncated)' : ctx.prData.diff

    const user = `## PR: ${ctx.prData.title}

**Files changed:**
${ctx.prData.files.map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})${f.is_binary ? ' [BINARY]' : ''}`).join('\n')}

**Diff:**
\`\`\`
${diff}
\`\`\``

    return { system, user }
  }

  buildToolSchema(): AgenticToolSchema {
    return {
      name: 'submit_security_check',
      description: 'Submit security concern analysis',
      schema: {
        type: 'object' as const,
        additionalProperties: false,
        required: ['has_concerns', 'confidence', 'reasoning', 'evidence'],
        properties: {
          has_concerns: { type: 'boolean' as const, description: 'Whether security concerns were found' },
          confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' as const, description: '2-3 sentence summary of findings' },
          evidence: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Specific security concerns with file and description (e.g. "scripts/deploy.sh: base64-encoded payload executed via eval")'
          }
        }
      }
    }
  }

  parseResult(raw: Record<string, unknown>): AgenticCheckResult {
    return {
      triggered: raw.has_concerns as boolean,
      label: this.label,
      reasoning: raw.reasoning as string,
      confidence: raw.confidence as 'low' | 'medium' | 'high',
      evidence: raw.evidence as string[]
    }
  }
}
