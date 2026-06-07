import { AiProvider, ProviderConfig, createProvider } from './providers'
import { AgenticCheck, AgenticCheckResult, AgenticCheckContext } from '../output/checks/agentic-check'

export type { ProviderConfig }

export async function callAgenticCheck(
  check: AgenticCheck,
  ctx: AgenticCheckContext,
  provider: AiProvider,
  config: ProviderConfig
): Promise<AgenticCheckResult> {
  const { system, user } = check.buildPrompt(ctx)
  const tool = check.buildToolSchema()
  const strategy = createProvider(provider, config)
  const raw = await strategy.call(system, user, tool, 2048)
  return check.parseResult(raw)
}
