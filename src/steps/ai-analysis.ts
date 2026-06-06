import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../pipeline'
import { callProvider, AiProvider } from '../providers'
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt'
import { PrData, AnalysisResult } from '../types'

/** Configuration for the AI analysis step. */
export interface AiAnalysisConfig {
  /** AI provider to use. */
  provider: AiProvider
  /** OpenAI API key (required for openai provider). */
  openaiApiKey?: string
  /** Anthropic API key (required for anthropic provider). */
  anthropicApiKey?: string
  /** GCP project ID (required for vertex provider). */
  vertexProjectId?: string
  /** GCP region for Vertex AI. */
  vertexRegion?: string
  /** Groq API key (required for groq provider). */
  groqApiKey?: string
  /** Google Gemini API key (required for gemini provider). */
  geminiApiKey?: string
  /** Model override for the selected provider. */
  model?: string
}

/**
 * Pipeline step that sends PR data to an AI provider for trust analysis.
 *
 * Uses MCP tool calling to get structured output from the AI.
 * Falls back to a failure result if the AI call errors.
 *
 * Reads `prData` from context.
 * Writes `analysisResult` to context.
 */
export class AiAnalysisStep extends PipelineStep {
  readonly name = 'ai-analysis'
  private config: AiAnalysisConfig

  /** @param config - AI provider configuration. */
  constructor(config: AiAnalysisConfig) {
    super()
    this.config = config
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const prData = ctx.prData as PrData
    const userPrompt = buildUserPrompt(prData)

    try {
      const result = await callProvider(
        this.config.provider,
        userPrompt,
        SYSTEM_PROMPT,
        {
          openaiApiKey: this.config.openaiApiKey,
          anthropicApiKey: this.config.anthropicApiKey,
          vertexProjectId: this.config.vertexProjectId,
          vertexRegion: this.config.vertexRegion,
          groqApiKey: this.config.groqApiKey,
          geminiApiKey: this.config.geminiApiKey,
          model: this.config.model
        }
      )
      result.provider = this.config.provider
      ctx.analysisResult = result
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`AI analysis failed: ${msg}`)
      ctx.analysisResult = this.buildFailureResult(msg)
      ctx.analysisFailed = true
    }

    return ctx
  }

  /** Builds a fallback result when the AI call fails. */
  private buildFailureResult(errorMessage: string): AnalysisResult {
    return {
      risk_score: -1,
      risk_level: 'unknown',
      confidence: 'low',
      summary: `AI analysis failed (${this.config.provider}): ${errorMessage}`,
      author_assessment: { trust_level: 'unknown', reasoning: 'Analysis failed' },
      commit_assessment: { quality: 'unknown', reasoning: 'Analysis failed' },
      code_assessment: {
        categories_flagged: [],
        reasoning: 'Analysis failed',
        suspicious_patterns: []
      },
      behavioral_signals: { flags: [], reasoning: 'Analysis failed' },
      review_suggestions: ['Manual review required — AI analysis failed'],
      provider: this.config.provider,
      error: errorMessage
    }
  }
}
