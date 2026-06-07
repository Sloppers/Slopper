export { FirstTimeContributorCheck } from './first-time-contributor'
export { CiModifiedCheck } from './ci-modified'
export { DependenciesModifiedCheck } from './dependencies-modified'
export { SprayAndPrayCheck } from './spray-and-pray'
export { ActivityBurstCheck } from './activity-burst'
export { NewAccountCheck } from './new-account'
export { MissingDescriptionCheck } from './missing-description'
export { NoLinkedIssueCheck } from './no-linked-issue'
export { TooManyFilesCheck } from './too-many-files'
export { RiskyUserCheck } from './risky-user'
export { TrustedOrgCheck } from './trusted-org'
export { HeavyChangesCheck } from './heavy-changes'
export { LargeFileCheck } from './large-file'
export { LowMergeRatioCheck } from './low-merge-ratio'
export { SupplyChainCheck } from './supply-chain'
export { UnsignedCommitsCheck } from './unsigned-commits'
export { NoTestsCheck } from './no-tests'
export { CodeDuplicationCheck } from './code-duplication'

import { StaticCheck } from '../check'
import { FirstTimeContributorCheck } from './first-time-contributor'
import { CiModifiedCheck } from './ci-modified'
import { DependenciesModifiedCheck } from './dependencies-modified'
import { SprayAndPrayCheck } from './spray-and-pray'
import { ActivityBurstCheck } from './activity-burst'
import { NewAccountCheck } from './new-account'
import { MissingDescriptionCheck } from './missing-description'
import { NoLinkedIssueCheck } from './no-linked-issue'
import { TooManyFilesCheck } from './too-many-files'
import { RiskyUserCheck } from './risky-user'
import { TrustedOrgCheck } from './trusted-org'
import { HeavyChangesCheck } from './heavy-changes'
import { LargeFileCheck } from './large-file'
import { LowMergeRatioCheck } from './low-merge-ratio'
import { SupplyChainCheck } from './supply-chain'
import { UnsignedCommitsCheck } from './unsigned-commits'
import { NoTestsCheck } from './no-tests'
import { CodeDuplicationCheck } from './code-duplication'

const ALL_STATIC_CHECKS: StaticCheck[] = [
  new FirstTimeContributorCheck(),
  new CiModifiedCheck(),
  new DependenciesModifiedCheck(),
  new SprayAndPrayCheck(),
  new ActivityBurstCheck(),
  new NewAccountCheck(),
  new MissingDescriptionCheck(),
  new NoLinkedIssueCheck(),
  new TooManyFilesCheck(),
  new RiskyUserCheck(),
  new TrustedOrgCheck(),
  new HeavyChangesCheck(),
  new LargeFileCheck(),
  new LowMergeRatioCheck(),
  new SupplyChainCheck(),
  new UnsignedCommitsCheck(),
  new NoTestsCheck(),
  new CodeDuplicationCheck()
]

export function allStaticChecks(): StaticCheck[] {
  return [...ALL_STATIC_CHECKS]
}
