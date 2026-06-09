export {
  CheckDef, Check, CheckContext, ScoreResult, CheckContextOptions, buildCheckContext,
  AgenticCheck, AgenticCheckBase, AgenticCheckDef, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema,
  agenticToolSchema, parseAgenticResult
} from './check'
export { DerivedIndicator, allDerivedIndicators } from './derived-indicator'
export { ALL_CHECKS, ALL_AGENTIC_CHECKS, allAgenticChecks } from './registry'

import { CheckDef, CheckContext, ScoreResult } from './check'
import { ALL_CHECKS } from './registry'

export function allChecks(): CheckDef[] {
  return [...ALL_CHECKS]
}

export function computeScore(checks: CheckDef[], ctx: CheckContext, weights?: Record<string, number>): { score: number; breakdown: ScoreResult[] } {
  const breakdown: ScoreResult[] = []
  let total = 0

  for (const check of checks) {
    const key = check.label.replace('slopper/', '').replace(/[-/]/g, '_')
    const weight = weights?.[key] ?? check.weight
    const factor = check.scoreFactor ? check.scoreFactor(ctx) : (check.evaluate(ctx) ? 1 : 0)
    const points = factor * weight
    total += points
    breakdown.push({ key, factor, weight, points })
  }

  const score = Math.max(0, Math.min(10, Math.round(total * 10) / 10))
  return { score, breakdown }
}
