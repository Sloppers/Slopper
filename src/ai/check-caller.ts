import { AiProvider, ProviderConfig, createProvider } from './providers'
import { AgenticCheckDef, AgenticCheckResult, AgenticCheckContext, agenticToolSchema, parseAgenticResult } from '../output/checks/check'

export type { ProviderConfig }

export async function callAgenticCheck(
  check: AgenticCheckDef,
  ctx: AgenticCheckContext,
  provider: AiProvider,
  config: ProviderConfig
): Promise<AgenticCheckResult> {
  const { system, user } = check.buildPrompt(ctx)
  const tool = agenticToolSchema(check)
  const strategy = createProvider(provider, config)
  const raw = await strategy.call(system, user, tool, 2048)
  return parseAgenticResult(check, raw)
}
