import { PrData, AuthorProfileAnalysis } from '../../core/types'
import { CheckContext } from './check'
import { buildCheckSchema } from './agentic/prompt-factory'

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
  abstract readonly triggerKey: string
  abstract readonly toolName: string
  abstract readonly triggerDescription: string
  readonly defaultWeight: number = 0

  abstract buildPrompt(ctx: AgenticCheckContext): { system: string; user: string }

  buildToolSchema(): AgenticToolSchema {
    return buildCheckSchema({
      toolName: this.toolName,
      triggerKey: this.triggerKey,
      triggerDescription: this.triggerDescription,
    })
  }

  parseResult(raw: Record<string, unknown>): AgenticCheckResult {
    return {
      triggered: raw[this.triggerKey] as boolean,
      label: this.label,
      reasoning: raw.reasoning as string,
      confidence: raw.confidence as 'low' | 'medium' | 'high',
      evidence: raw.evidence as string[]
    }
  }
}
