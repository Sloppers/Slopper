import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const verifiedOrg: CheckDef = {
  label: Indicators.VERIFIED_ORG,
  weight: -1,
  evaluate: ctx => !!ctx.verifiedOrg
}
