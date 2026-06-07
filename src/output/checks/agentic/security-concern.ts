import { AgenticCheck, AgenticCheckContext } from '../agentic-check'
import { Indicators } from '../../label-factory'
import { prHeader, filesList, diffBlock } from './prompt-factory'

export class SecurityConcernCheck extends AgenticCheck {
  readonly key = 'security-concern'
  readonly label = Indicators.AI_SECURITY_CONCERN
  readonly description = 'Detects security concerns: obfuscated code, credential patterns, suspicious URLs, backdoors'
  readonly triggerKey = 'has_concerns'
  readonly toolName = 'submit_security_check'
  readonly triggerDescription = 'Whether security concerns were found'
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

    const user = [prHeader(ctx), filesList(ctx, { showBinary: true }), diffBlock(ctx, 10000)].join('\n\n')
    return { system, user }
  }
}
