import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class TrustedOrgCheck extends Check {
  readonly label = Labels.TRUSTED_ORG.name
  readonly defaultWeight = -2

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.trustedOrg
  }
}
