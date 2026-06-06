export interface LabelDef {
  readonly name: string
  readonly color: string
  readonly description: string
}

function def(name: string, color: string, description: string): LabelDef {
  return { name, color, description }
}

export const Labels = {
  RISK_LOW: def('slopper/risk/low', '0e8a16', 'Low risk score'),
  RISK_MEDIUM: def('slopper/risk/medium', 'fbca04', 'Medium risk score'),
  RISK_HIGH: def('slopper/risk/high', 'e99695', 'High risk score'),
  RISK_CRITICAL: def('slopper/risk/critical', 'b60205', 'Critical risk score'),

  CONFIDENCE_HIGH: def('slopper/confidence/high', '0e8a16', 'High confidence analysis'),
  CONFIDENCE_MEDIUM: def('slopper/confidence/medium', 'fbca04', 'Medium confidence analysis'),
  CONFIDENCE_LOW: def('slopper/confidence/low', 'e4e669', 'Low confidence analysis'),

  APPROVED: def('slopper/approved', '0e8a16', 'PR is approved by a reviewer'),
  VOUCHED: def('slopper/vouched', '0e8a16', 'Author is vouched by a code owner'),
  BANNED: def('slopper/banned', 'b60205', 'Author is on the banned list'),
  ANALYSIS_FAILED: def('slopper/analysis-failed', 'cccccc', 'Analysis could not complete'),
  DETERMINISTIC_MODE: def('slopper/mode/deterministic', '1d76db', 'Running in deterministic mode (no AI)'),

  FIRST_TIME_CONTRIBUTOR: def('slopper/first-time-contributor', 'c5def5', 'First contribution to this repo'),
  CI_MODIFIED: def('slopper/ci-modified', 'd4c5f9', 'CI/CD configuration files were modified'),
  DEPENDENCIES_MODIFIED: def('slopper/dependencies-modified', 'f9d0c4', 'Dependency files were modified'),
  SECURITY_REVIEW: def('slopper/needs-security-review', 'b60205', 'Changes need security review'),
  SUSPICIOUS: def('slopper/suspicious', 'b60205', 'Highly suspicious PR'),
  SPRAY_AND_PRAY: def('slopper/spray-and-pray', 'b60205', 'Spray-and-pray pattern detected'),
  ACTIVITY_BURST: def('slopper/activity-burst', 'e99695', 'Unusual burst of PR activity'),
  NEW_ACCOUNT: def('slopper/new-account', 'fbca04', 'Author account is very new'),
  LIKELY_AI: def('slopper/likely-ai-generated', 'b60205', 'AI fingerprint score is high'),
  POSSIBLY_AI: def('slopper/possibly-ai-generated', 'fbca04', 'AI fingerprint score is moderate'),
  MISSING_DESCRIPTION: def('slopper/missing-description', 'e4e669', 'PR has no description'),
  NO_LINKED_ISSUE: def('slopper/no-linked-issue', 'e4e669', 'PR does not reference an issue'),
  TOO_MANY_FILES: def('slopper/too-many-files', 'e4e669', 'PR changes too many files'),
  RISKY_USER: def('slopper/risky-user', 'b60205', 'Author is on the risky users list'),
  TRUSTED_ORG: def('slopper/trusted-org', '0e8a16', 'Author belongs to a trusted organization'),
  HEAVY_CHANGES: def('slopper/heavy-changes', 'e99695', 'PR has too many lines changed to review effectively'),
  LARGE_FILE: def('slopper/large-file', 'fbca04', 'PR contains a file with an unusually large diff'),

  LOW_MERGE_RATIO: def('slopper/low-merge-ratio', 'fbca04', 'Author has a low PR merge ratio'),
  SUPPLY_CHAIN: def('slopper/supply-chain', 'b60205', 'Suspicious dependency or lockfile changes'),
  UNSIGNED_COMMITS: def('slopper/unsigned-commits', 'e99695', 'PR contains unsigned commits or author/committer mismatches'),
  NO_TESTS: def('slopper/no-tests', 'fbca04', 'PR adds code but no tests'),
  CODE_DUPLICATION: def('slopper/code-duplication', 'fbca04', 'PR contains duplicated code blocks'),

  AI_SLOP_CONTENT: def('slopper/ai/slop-content', 'b60205', 'AI detected generic slop content'),
  AI_DESCRIPTION_MISMATCH: def('slopper/ai/description-mismatch', 'e99695', 'AI detected PR description does not match diff'),
  AI_CODE_QUALITY: def('slopper/ai/code-quality', 'fbca04', 'AI detected subtle code quality issues'),
  AI_SECURITY_CONCERN: def('slopper/ai/security-concern', 'b60205', 'AI detected potential security concerns'),
  AI_SUSPICIOUS_AUTHOR: def('slopper/ai/suspicious-author', 'e99695', 'AI detected suspicious author profile patterns'),
} as const

export type LabelKey = keyof typeof Labels

export function colorMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const label of Object.values(Labels)) {
    map[label.name] = label.color
  }
  return map
}

export function confidenceLabel(level: string): LabelDef {
  switch (level) {
    case 'high': return Labels.CONFIDENCE_HIGH
    case 'medium': return Labels.CONFIDENCE_MEDIUM
    default: return Labels.CONFIDENCE_LOW
  }
}

export function riskLabel(score: number, thresholds: { low: number; medium: number; high: number }): LabelDef {
  if (score <= thresholds.low) return Labels.RISK_LOW
  if (score <= thresholds.medium) return Labels.RISK_MEDIUM
  if (score <= thresholds.high) return Labels.RISK_HIGH
  return Labels.RISK_CRITICAL
}
