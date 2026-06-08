import { AgenticCheckDef, prHeader, filesList, diffBlock } from './check'
import { Indicators } from '../label-factory'

const SYSTEM_PROMPT = `You are a security reviewer for open source pull requests. Your job is to detect potentially malicious or dangerous code changes.

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

export const securityConcern: AgenticCheckDef = {
  key: 'security-concern',
  label: Indicators.AI_SECURITY_CONCERN,
  description: 'Detects security concerns',
  triggerKey: 'has_concerns',
  toolName: 'submit_security_check',
  triggerDescription: 'Whether security concerns were found',
  weight: 2,
  buildPrompt: ctx => ({
    system: SYSTEM_PROMPT,
    user: [prHeader(ctx), filesList(ctx, { showBinary: true }), diffBlock(ctx, 10000)].join('\n\n')
  })
}
