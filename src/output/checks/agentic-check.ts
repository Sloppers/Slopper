import { PrData, AuthorProfileAnalysis, AiFingerprintResult } from '../../core/types'
import { CheckContext } from './check'

export interface AgenticCheckResult {
  triggered: boolean
  label: string
  reasoning: string
  confidence: 'low' | 'medium' | 'high'
  evidence?: string[]
}

export interface AgenticCheckContext extends CheckContext {
  prData: PrData
}

export interface AgenticToolSchema {
  name: string
  description: string
  schema: Record<string, unknown>
}

export abstract class AgenticCheck {
  abstract readonly key: string
  abstract readonly label: string
  abstract readonly description: string
  readonly defaultWeight: number = 0

  abstract buildPrompt(ctx: AgenticCheckContext): { system: string; user: string }
  abstract buildToolSchema(): AgenticToolSchema
  abstract parseResult(raw: Record<string, unknown>): AgenticCheckResult
}
