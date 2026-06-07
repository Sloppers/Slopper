import { Check, CheckContext } from '../check'
import { Indicators } from '../../label-factory'

export class VerifiedOrgCheck extends Check {
  readonly label = Indicators.VERIFIED_ORG
  readonly defaultWeight = -1

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.verifiedOrg
  }
}
