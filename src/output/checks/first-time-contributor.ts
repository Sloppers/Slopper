import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const firstTimeContributor: CheckDef = {
  label: Indicators.FIRST_TIME_CONTRIBUTOR,
  weight: 1,
  evaluate: ctx => ctx.firstTimeContributor
}
