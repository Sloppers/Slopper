import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const riskyUser: CheckDef = {
  label: Indicators.RISKY_USER,
  weight: 1,
  evaluate: ctx => !!ctx.riskyUser
}
