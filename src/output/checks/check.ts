import { AnalysisResult, FileInfo, PrData, AuthorProfileAnalysis, AiFingerprintResult } from '../../core/types'
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig } from '../../core/config'

export interface CheckContext {
  score: number
  analysis?: AnalysisResult
  files: FileInfo[]
  firstTimeContributor: boolean
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  aiFingerprint?: AiFingerprintResult
  riskyUser?: boolean
  trustedOrg?: boolean
  thresholds: ThresholdsConfig
  labelThresholds: LabelThresholdsConfig
  rules: RulesConfig
}

export abstract class Check {
  abstract readonly label: string
  abstract evaluate(ctx: CheckContext): boolean
}
