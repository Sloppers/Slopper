import { Check, CheckContext } from '../check'
import { Indicators } from '../../label-factory'

export class TrustedOrgCheck extends Check {
  readonly label = Indicators.TRUSTED_ORG
  readonly defaultWeight = -2

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.trustedOrg
  }
}
