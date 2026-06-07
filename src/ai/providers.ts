import { ANALYSIS_TOOL_NAME, ANALYSIS_TOOL_DESCRIPTION, ANALYSIS_JSON_SCHEMA } from './tools'

export type AiProvider = 'openai' | 'anthropic' | 'vertex' | 'groq' | 'gemini'

export interface ToolDef {
  name: string
  description: string
  schema: Record<string, unknown>
}

export interface ProviderConfig {
  openaiApiKey?: string
  anthropicApiKey?: string
  vertexProjectId?: string
  vertexRegion?: string
  groqApiKey?: string
  geminiApiKey?: string
  model?: string
}

export interface AiProviderStrategy {
  readonly defaultModel: string
  call(system: string, user: string, tool: ToolDef, maxTokens: number): Promise<Record<string, unknown>>
}

class OpenAICompatibleProvider implements AiProviderStrategy {
  constructor(
    readonly defaultModel: string,
    private readonly apiKey: string,
    private readonly modelOverride?: string,
    private readonly ClientClass?: string
  ) {}

  async call(system: string, user: string, tool: ToolDef, maxTokens: number): Promise<Record<string, unknown>> {
    const mod = this.ClientClass === 'groq'
      ? (await import('groq-sdk')).default
      : (await import('openai')).default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = new mod({ apiKey: this.apiKey }) as any
    const response = await client.chat.completions.create({
      model: this.modelOverride ?? this.defaultModel,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.1,
      max_tokens: maxTokens,
      tools: [{
        type: 'function' as const,
        function: { name: tool.name, description: tool.description, strict: true, parameters: tool.schema }
      }],
      tool_choice: { type: 'function', function: { name: tool.name } }
    })
    const toolCall = response.choices[0]?.message?.tool_calls?.[0]
    if (!toolCall || toolCall.function.name !== tool.name) {
      throw new Error(`Model did not call the ${tool.name} tool`)
    }
    return JSON.parse(toolCall.function.arguments) as Record<string, unknown>
  }
}

class AnthropicCompatibleProvider implements AiProviderStrategy {
  constructor(
    readonly defaultModel: string,
    private readonly createClient: () => Promise<{ messages: { create(opts: unknown): Promise<unknown> } }>,
    private readonly modelOverride?: string
  ) {}

  async call(system: string, user: string, tool: ToolDef, maxTokens: number): Promise<Record<string, unknown>> {
    const client = await this.createClient()
    const message = await client.messages.create({
      model: this.modelOverride ?? this.defaultModel,
      max_tokens: maxTokens,
      system,
      tools: [{ name: tool.name, description: tool.description, input_schema: tool.schema as { type: 'object'; [key: string]: unknown } }],
      tool_choice: { type: 'tool' as const, name: tool.name },
      messages: [{ role: 'user', content: user }]
    }) as { content: Array<{ type: string; name?: string; input?: unknown }> }
    const toolBlock = message.content.find(
      (block) => block.type === 'tool_use' && block.name === tool.name
    )
    if (!toolBlock) {
      throw new Error(`Model did not call the ${tool.name} tool`)
    }
    return toolBlock.input as unknown as Record<string, unknown>
  }
}

class GeminiProvider implements AiProviderStrategy {
  readonly defaultModel = 'gemini-2.5-flash'

  constructor(
    private readonly apiKey: string,
    private readonly modelOverride?: string
  ) {}

  async call(system: string, user: string, tool: ToolDef, maxTokens: number): Promise<Record<string, unknown>> {
    const { GoogleGenAI, FunctionCallingConfigMode } = await import('@google/genai')
    const client = new GoogleGenAI({ apiKey: this.apiKey })
    const response = await client.models.generateContent({
      model: this.modelOverride ?? this.defaultModel,
      contents: [{ role: 'user', parts: [{ text: user }] }],
      config: {
        systemInstruction: system,
        temperature: 0.1,
        maxOutputTokens: maxTokens,
        tools: [{ functionDeclarations: [{ name: tool.name, description: tool.description, parametersJsonSchema: tool.schema }] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: [tool.name]
          }
        }
      }
    })
    const parts = response.candidates?.[0]?.content?.parts
    const functionCall = parts?.find(part => 'functionCall' in part && part.functionCall)
    if (!functionCall || !('functionCall' in functionCall) || functionCall.functionCall?.name !== tool.name) {
      throw new Error(`Model did not call the ${tool.name} tool`)
    }
    return functionCall.functionCall.args as unknown as Record<string, unknown>
  }
}

export function createProvider(provider: AiProvider, config: ProviderConfig): AiProviderStrategy {
  switch (provider) {
    case 'openai':
      if (!config.openaiApiKey) throw new Error('openai-api-key is required for OpenAI provider')
      return new OpenAICompatibleProvider('gpt-4o', config.openaiApiKey, config.model)
    case 'groq':
      if (!config.groqApiKey) throw new Error('groq-api-key is required for Groq provider')
      return new OpenAICompatibleProvider('llama-3.3-70b-versatile', config.groqApiKey, config.model, 'groq')
    case 'anthropic':
      if (!config.anthropicApiKey) throw new Error('anthropic-api-key is required for Anthropic provider')
      return new AnthropicCompatibleProvider('claude-sonnet-4-6', async () => {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        return new Anthropic({ apiKey: config.anthropicApiKey })
      }, config.model)
    case 'vertex':
      if (!config.vertexProjectId) throw new Error('vertex-project-id is required for Vertex AI provider')
      return new AnthropicCompatibleProvider('claude-sonnet-4-6', async () => {
        const { AnthropicVertex } = await import('@anthropic-ai/vertex-sdk')
        return new AnthropicVertex({ projectId: config.vertexProjectId!, region: config.vertexRegion ?? 'global' })
      }, config.model)
    case 'gemini':
      if (!config.geminiApiKey) throw new Error('gemini-api-key is required for Gemini provider')
      return new GeminiProvider(config.geminiApiKey, config.model)
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

const ANALYSIS_TOOL: ToolDef = {
  name: ANALYSIS_TOOL_NAME,
  description: ANALYSIS_TOOL_DESCRIPTION,
  schema: ANALYSIS_JSON_SCHEMA
}

export async function callProvider(
  provider: AiProvider,
  prompt: string,
  system: string,
  config: ProviderConfig
): Promise<Record<string, unknown>> {
  const strategy = createProvider(provider, config)
  return strategy.call(system, prompt, ANALYSIS_TOOL, 4096)
}
