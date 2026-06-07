import { CheckContext } from './check'
import { Indicators } from '../label-factory'

export abstract class DerivedIndicator {
  abstract readonly label: string
  abstract evaluate(ctx: CheckContext): boolean
}

class ApprovedIndicator extends DerivedIndicator {
  readonly label = Indicators.APPROVED
  evaluate(ctx: CheckContext): boolean {
    return !!ctx.analysis && ctx.score <= ctx.thresholds.low && ctx.analysis.confidence === 'high'
  }
}

class DeterministicModeIndicator extends DerivedIndicator {
  readonly label = Indicators.DETERMINISTIC_MODE
  evaluate(ctx: CheckContext): boolean {
    return !ctx.analysis
  }
}

class SecurityReviewIndicator extends DerivedIndicator {
  readonly label = Indicators.SECURITY_REVIEW
  evaluate(ctx: CheckContext): boolean {
    return ctx.score >= ctx.labelThresholds.security_review_score
  }
}

class SuspiciousIndicator extends DerivedIndicator {
  readonly label = Indicators.SUSPICIOUS
  evaluate(ctx: CheckContext): boolean {
    return ctx.score >= ctx.labelThresholds.suspicious_score
  }
}

const ALL_DERIVED: DerivedIndicator[] = [
  new ApprovedIndicator(),
  new DeterministicModeIndicator(),
  new SecurityReviewIndicator(),
  new SuspiciousIndicator(),
]

export function allDerivedIndicators(): DerivedIndicator[] {
  return [...ALL_DERIVED]
}
