export { Check, CheckContext } from './check'
export { ApprovedCheck } from './approved'
export { DeterministicModeCheck } from './deterministic-mode'
export { FirstTimeContributorCheck } from './first-time-contributor'
export { CiModifiedCheck } from './ci-modified'
export { DependenciesModifiedCheck } from './dependencies-modified'
export { SecurityReviewCheck } from './security-review'
export { SuspiciousCheck } from './suspicious'
export { SprayAndPrayCheck } from './spray-and-pray'
export { ActivityBurstCheck } from './activity-burst'
export { NewAccountCheck } from './new-account'
export { LikelyAiCheck } from './likely-ai'
export { PossiblyAiCheck } from './possibly-ai'
export { MissingDescriptionCheck } from './missing-description'
export { NoLinkedIssueCheck } from './no-linked-issue'
export { TooManyFilesCheck } from './too-many-files'
export { RiskyUserCheck } from './risky-user'
export { TrustedOrgCheck } from './trusted-org'
export { HeavyChangesCheck } from './heavy-changes'
export { LargeFileCheck } from './large-file'

import { Check } from './check'
import { ApprovedCheck } from './approved'
import { DeterministicModeCheck } from './deterministic-mode'
import { FirstTimeContributorCheck } from './first-time-contributor'
import { CiModifiedCheck } from './ci-modified'
import { DependenciesModifiedCheck } from './dependencies-modified'
import { SecurityReviewCheck } from './security-review'
import { SuspiciousCheck } from './suspicious'
import { SprayAndPrayCheck } from './spray-and-pray'
import { ActivityBurstCheck } from './activity-burst'
import { NewAccountCheck } from './new-account'
import { LikelyAiCheck } from './likely-ai'
import { PossiblyAiCheck } from './possibly-ai'
import { MissingDescriptionCheck } from './missing-description'
import { NoLinkedIssueCheck } from './no-linked-issue'
import { TooManyFilesCheck } from './too-many-files'
import { RiskyUserCheck } from './risky-user'
import { TrustedOrgCheck } from './trusted-org'
import { HeavyChangesCheck } from './heavy-changes'
import { LargeFileCheck } from './large-file'

const ALL_CHECKS: Check[] = [
  new ApprovedCheck(),
  new DeterministicModeCheck(),
  new FirstTimeContributorCheck(),
  new CiModifiedCheck(),
  new DependenciesModifiedCheck(),
  new SecurityReviewCheck(),
  new SuspiciousCheck(),
  new SprayAndPrayCheck(),
  new ActivityBurstCheck(),
  new NewAccountCheck(),
  new LikelyAiCheck(),
  new PossiblyAiCheck(),
  new MissingDescriptionCheck(),
  new NoLinkedIssueCheck(),
  new TooManyFilesCheck(),
  new RiskyUserCheck(),
  new TrustedOrgCheck(),
  new HeavyChangesCheck(),
  new LargeFileCheck()
]

export function allChecks(): Check[] {
  return [...ALL_CHECKS]
}
