import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const missingDescription: CheckDef = {
  label: Indicators.MISSING_DESCRIPTION,
  weight: 1,
  evaluate: ctx => ctx.rules.require_description && !!ctx.prData && !ctx.prData.body.trim()
}
