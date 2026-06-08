import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const trustedOrg: CheckDef = {
  label: Indicators.TRUSTED_ORG,
  weight: -2,
  evaluate: ctx => !!ctx.trustedOrg
}
