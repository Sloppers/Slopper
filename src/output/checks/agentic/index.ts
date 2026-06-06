export { SlopContentCheck } from './slop-content'
export { DescriptionMismatchCheck } from './description-mismatch'
export { CodeQualityCheck } from './code-quality'
export { SecurityConcernCheck } from './security-concern'
export { SuspiciousAuthorCheck } from './suspicious-author'

import { AgenticCheck } from '../agentic-check'
import { SlopContentCheck } from './slop-content'
import { DescriptionMismatchCheck } from './description-mismatch'
import { CodeQualityCheck } from './code-quality'
import { SecurityConcernCheck } from './security-concern'
import { SuspiciousAuthorCheck } from './suspicious-author'

const ALL_AGENTIC_CHECKS: AgenticCheck[] = [
  new SlopContentCheck(),
  new DescriptionMismatchCheck(),
  new CodeQualityCheck(),
  new SecurityConcernCheck(),
  new SuspiciousAuthorCheck()
]

export function allAgenticChecks(): AgenticCheck[] {
  return [...ALL_AGENTIC_CHECKS]
}
