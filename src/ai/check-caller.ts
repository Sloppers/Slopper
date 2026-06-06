import { AiProvider } from './providers'
import { AgenticCheck, AgenticCheckResult, AgenticCheckContext, AgenticToolSchema } from '../output/checks/agentic-check'

export interface ProviderConfig {
  openaiApiKey?: string
  anthropicApiKey?: string
  vertexProjectId?: string
  vertexRegion?: string
  groqApiKey?: string
  geminiApiKey?: string
  model?: string
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
  vertex: 'claude-sonnet-4-6',
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.5-flash'
}

function buildOpenAITool(tool: AgenticToolSchema) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      strict: true,
      parameters: tool.schema
    }
  }
}

function buildAnthropicTool(tool: AgenticToolSchema) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.schema as { type: 'object'; [key: string]: unknown }
  }
}

function buildGeminiTool(tool: AgenticToolSchema) {
  return {
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: tool.schema
  }
}

async function callOpenAI(system: string, user: string, tool: AgenticToolSchema, apiKey: string, model?: string): Promise<Record<string, unknown>> {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey })
  const response = await client.chat.completions.create({
    model: model ?? DEFAULT_MODELS.openai,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature: 0.1,
    max_tokens: 2048,
    tools: [buildOpenAITool(tool)],
    tool_choice: { type: 'function', function: { name: tool.name } }
  })
  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.function.name !== tool.name) {
    throw new Error(`OpenAI did not call the ${tool.name} tool`)
  }
  return JSON.parse(toolCall.function.arguments) as Record<string, unknown>
}

async function callAnthropic(system: string, user: string, tool: AgenticToolSchema, apiKey: string, model?: string): Promise<Record<string, unknown>> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: model ?? DEFAULT_MODELS.anthropic,
    max_tokens: 2048,
    system,
    tools: [buildAnthropicTool(tool)],
    tool_choice: { type: 'tool' as const, name: tool.name },
    messages: [{ role: 'user', content: user }]
  })
  const toolBlock = message.content.find(
    (block): block is Extract<typeof block, { type: 'tool_use' }> =>
      block.type === 'tool_use' && block.name === tool.name
  )
  if (!toolBlock) {
    throw new Error(`Anthropic did not call the ${tool.name} tool`)
  }
  return toolBlock.input as unknown as Record<string, unknown>
}

async function callVertex(system: string, user: string, tool: AgenticToolSchema, projectId: string, region: string, model?: string): Promise<Record<string, unknown>> {
  const { AnthropicVertex } = await import('@anthropic-ai/vertex-sdk')
  const client = new AnthropicVertex({ projectId, region })
  const message = await client.messages.create({
    model: model ?? DEFAULT_MODELS.vertex,
    max_tokens: 2048,
    system,
    tools: [buildAnthropicTool(tool)],
    tool_choice: { type: 'tool' as const, name: tool.name },
    messages: [{ role: 'user', content: user }]
  })
  const toolBlock = message.content.find(
    (block): block is Extract<typeof block, { type: 'tool_use' }> =>
      block.type === 'tool_use' && block.name === tool.name
  )
  if (!toolBlock) {
    throw new Error(`Vertex did not call the ${tool.name} tool`)
  }
  return toolBlock.input as unknown as Record<string, unknown>
}

async function callGroq(system: string, user: string, tool: AgenticToolSchema, apiKey: string, model?: string): Promise<Record<string, unknown>> {
  const Groq = (await import('groq-sdk')).default
  const client = new Groq({ apiKey })
  const response = await client.chat.completions.create({
    model: model ?? DEFAULT_MODELS.groq,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature: 0.1,
    max_tokens: 2048,
    tools: [buildOpenAITool(tool)],
    tool_choice: { type: 'function', function: { name: tool.name } }
  })
  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.function.name !== tool.name) {
    throw new Error(`Groq did not call the ${tool.name} tool`)
  }
  return JSON.parse(toolCall.function.arguments) as Record<string, unknown>
}

async function callGemini(system: string, user: string, tool: AgenticToolSchema, apiKey: string, model?: string): Promise<Record<string, unknown>> {
  const { GoogleGenAI, FunctionCallingConfigMode } = await import('@google/genai')
  const client = new GoogleGenAI({ apiKey })
  const response = await client.models.generateContent({
    model: model ?? DEFAULT_MODELS.gemini,
    contents: [{ role: 'user', parts: [{ text: user }] }],
    config: {
      systemInstruction: system,
      temperature: 0.1,
      maxOutputTokens: 2048,
      tools: [{ functionDeclarations: [buildGeminiTool(tool)] }],
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
    throw new Error(`Gemini did not call the ${tool.name} tool`)
  }
  return functionCall.functionCall.args as unknown as Record<string, unknown>
}

export async function callAgenticCheck(
  check: AgenticCheck,
  ctx: AgenticCheckContext,
  provider: AiProvider,
  config: ProviderConfig
): Promise<AgenticCheckResult> {
  const { system, user } = check.buildPrompt(ctx)
  const tool = check.buildToolSchema()

  let raw: Record<string, unknown>

  switch (provider) {
    case 'openai':
      if (!config.openaiApiKey) throw new Error('openai-api-key is required')
      raw = await callOpenAI(system, user, tool, config.openaiApiKey, config.model)
      break
    case 'anthropic':
      if (!config.anthropicApiKey) throw new Error('anthropic-api-key is required')
      raw = await callAnthropic(system, user, tool, config.anthropicApiKey, config.model)
      break
    case 'vertex':
      if (!config.vertexProjectId) throw new Error('vertex-project-id is required')
      raw = await callVertex(system, user, tool, config.vertexProjectId, config.vertexRegion ?? 'global', config.model)
      break
    case 'groq':
      if (!config.groqApiKey) throw new Error('groq-api-key is required')
      raw = await callGroq(system, user, tool, config.groqApiKey, config.model)
      break
    case 'gemini':
      if (!config.geminiApiKey) throw new Error('gemini-api-key is required')
      raw = await callGemini(system, user, tool, config.geminiApiKey, config.model)
      break
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }

  return check.parseResult(raw)
}
