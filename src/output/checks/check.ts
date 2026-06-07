import { AnalysisResult, FileInfo, PrData, AuthorProfileAnalysis } from '../../core/types'
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig } from '../../core/config'

export interface CheckContext {
  score: number
  analysis?: AnalysisResult
  files: FileInfo[]
  firstTimeContributor: boolean
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  riskyUser?: boolean
  trustedOrg?: boolean
  thresholds: ThresholdsConfig
  labelThresholds: LabelThresholdsConfig
  rules: RulesConfig
}

export interface ScoreResult {
  key: string
  factor: number
  weight: number
  points: number
}

export abstract class StaticCheck {
  abstract readonly label: string
  readonly defaultWeight: number = 0

  abstract evaluate(ctx: CheckContext): boolean

  scoreFactor(ctx: CheckContext): number {
    return this.evaluate(ctx) ? 1 : 0
  }
}

export { StaticCheck as Check }
