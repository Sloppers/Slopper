export interface LabelDef {
  readonly name: string
  readonly color: string
  readonly description: string
}

function def(name: string, color: string, description: string): LabelDef {
  return { name, color, description }
}

export const Labels = {
  SLOP: def('slopper/slop', 'b60205', 'PR flagged as likely AI slop'),
  LEGIT: def('slopper/legit', '0e8a16', 'PR appears legitimate'),
  VOUCHED: def('slopper/vouched', '0e8a16', 'Author is vouched by a code owner'),
  BANNED: def('slopper/banned', 'b60205', 'Author is on the banned list'),
  ANALYSIS_FAILED: def('slopper/analysis-failed', 'cccccc', 'Analysis could not complete'),
} as const

export const Indicators = {
  RISK_LOW: 'slopper/risk/low',
  RISK_MEDIUM: 'slopper/risk/medium',
  RISK_HIGH: 'slopper/risk/high',
  RISK_CRITICAL: 'slopper/risk/critical',

  CONFIDENCE_HIGH: 'slopper/confidence/high',
  CONFIDENCE_MEDIUM: 'slopper/confidence/medium',
  CONFIDENCE_LOW: 'slopper/confidence/low',

  APPROVED: 'slopper/approved',
  DETERMINISTIC_MODE: 'slopper/mode/deterministic',
  FIRST_TIME_CONTRIBUTOR: 'slopper/first-time-contributor',
  CI_MODIFIED: 'slopper/ci-modified',
  DEPENDENCIES_MODIFIED: 'slopper/dependencies-modified',
  SECURITY_REVIEW: 'slopper/needs-security-review',
  SUSPICIOUS: 'slopper/suspicious',
  SPRAY_AND_PRAY: 'slopper/spray-and-pray',
  ACTIVITY_BURST: 'slopper/activity-burst',
  NEW_ACCOUNT: 'slopper/new-account',
  MISSING_DESCRIPTION: 'slopper/missing-description',
  NO_LINKED_ISSUE: 'slopper/no-linked-issue',
  TOO_MANY_FILES: 'slopper/too-many-files',
  RISKY_USER: 'slopper/risky-user',
  TRUSTED_ORG: 'slopper/trusted-org',
  HEAVY_CHANGES: 'slopper/heavy-changes',
  LARGE_FILE: 'slopper/large-file',
  LOW_MERGE_RATIO: 'slopper/low-merge-ratio',
  SUPPLY_CHAIN: 'slopper/supply-chain',
  UNSIGNED_COMMITS: 'slopper/unsigned-commits',
  NO_TESTS: 'slopper/no-tests',
  CODE_DUPLICATION: 'slopper/code-duplication',

  AI_SLOP_CONTENT: 'slopper/ai/slop-content',
  AI_DESCRIPTION_MISMATCH: 'slopper/ai/description-mismatch',
  AI_CODE_QUALITY: 'slopper/ai/code-quality',
  AI_SECURITY_CONCERN: 'slopper/ai/security-concern',
  AI_SUSPICIOUS_AUTHOR: 'slopper/ai/suspicious-author',
} as const

export type LabelKey = keyof typeof Labels

export function colorMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const label of Object.values(Labels)) {
    map[label.name] = label.color
  }
  return map
}

export function confidenceLabel(level: string): string {
  switch (level) {
    case 'high': return Indicators.CONFIDENCE_HIGH
    case 'medium': return Indicators.CONFIDENCE_MEDIUM
    default: return Indicators.CONFIDENCE_LOW
  }
}

export function riskLabel(score: number, thresholds: { low: number; medium: number; high: number }): string {
  if (score <= thresholds.low) return Indicators.RISK_LOW
  if (score <= thresholds.medium) return Indicators.RISK_MEDIUM
  if (score <= thresholds.high) return Indicators.RISK_HIGH
  return Indicators.RISK_CRITICAL
}
