import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHubClient } from './clients/github'
import { BotGitHubClient } from './clients/bot-github'
import { SlopperClient } from './clients/slopper'
import { AnalysisPipeline, PipelineStep } from './core/pipeline'
import { AiProvider } from './ai/providers'
import { errorMessage } from './core/utils'
import {
  LoadConfigStep,
  VouchCheckStep,
  BannedCheckStep,
  RiskyUserCheckStep,
  VouchApplyStep,
  CollectDataStep,
  ProfileAnalysisStep,
  AiAnalysisStep,
  AgenticChecksStep,
  ComputeLabelsStep,
  PostResultsStep,
  AutoActionsStep,
  CollectIssueDataStep,
  IssueProfileAnalysisStep,
  IssueAgenticChecksStep,
  ComputeIssueLabelsStep,
  PostIssueResultsStep,
  IssueAutoActionsStep
} from './steps'

const BOT_URL = 'https://slopper-bot.thegexi.workers.dev'

const VALID_PROVIDERS: readonly AiProvider[] = ['openai', 'anthropic', 'vertex', 'groq', 'gemini']

function isValidProvider(value: string): value is AiProvider {
  return (VALID_PROVIDERS as readonly string[]).includes(value)
}

function detectEventType(): 'pr' | 'issue' | null {
  const eventName = github.context.eventName
  if (eventName === 'pull_request' || eventName === 'pull_request_review_comment') return 'pr'
  if (eventName === 'issues' || eventName === 'issue_comment') {
    if (github.context.payload.issue?.pull_request) return 'pr'
    return 'issue'
  }
  return null
}

function getTargetNumber(): number | undefined {
  return github.context.payload.pull_request?.number ?? github.context.payload.issue?.number
}

function getAiConfig() {
  const providerInput = core.getInput('ai-provider') || ''
  const useAi = providerInput !== '' && providerInput !== 'none'

  if (useAi && !isValidProvider(providerInput)) {
    return { valid: false as const, error: `Invalid ai-provider: ${providerInput}. Must be one of: none, ${VALID_PROVIDERS.join(', ')}` }
  }

  if (!useAi) return { valid: true as const, useAi: false as const }

  return {
    valid: true as const,
    useAi: true as const,
    provider: providerInput as AiProvider,
    providerConfig: {
      openaiApiKey: core.getInput('openai-api-key'),
      anthropicApiKey: core.getInput('anthropic-api-key'),
      vertexProjectId: core.getInput('vertex-project-id'),
      vertexRegion: core.getInput('vertex-region') || 'global',
      groqApiKey: core.getInput('groq-api-key'),
      geminiApiKey: core.getInput('gemini-api-key'),
      model: core.getInput('model') || undefined
    }
  }
}

function buildPrSteps(gh: GitHubClient, slopper: SlopperClient, aiConfig: ReturnType<typeof getAiConfig>): PipelineStep[] {
  const steps: PipelineStep[] = [
    new CollectDataStep(gh),
    new ProfileAnalysisStep(gh, slopper),
  ]

  if (aiConfig.valid && aiConfig.useAi) {
    steps.push(new AiAnalysisStep({ provider: aiConfig.provider, ...aiConfig.providerConfig }))
    steps.push(new AgenticChecksStep({ provider: aiConfig.provider, providerConfig: aiConfig.providerConfig }))
  } else {
    core.info('[main] Running in deterministic mode — no AI provider configured')
  }

  steps.push(
    new ComputeLabelsStep(),
    new PostResultsStep(gh),
    new AutoActionsStep(gh)
  )

  return steps
}

function buildIssueSteps(gh: GitHubClient, slopper: SlopperClient, aiConfig: ReturnType<typeof getAiConfig>): PipelineStep[] {
  const steps: PipelineStep[] = [
    new CollectIssueDataStep(gh),
    new IssueProfileAnalysisStep(gh, slopper),
  ]

  if (aiConfig.valid && aiConfig.useAi) {
    steps.push(new IssueAgenticChecksStep({ provider: aiConfig.provider, providerConfig: aiConfig.providerConfig }))
  } else {
    core.info('[main] Running issue analysis in deterministic mode — no AI provider configured')
  }

  steps.push(
    new ComputeIssueLabelsStep(),
    new PostIssueResultsStep(gh),
    new IssueAutoActionsStep(gh)
  )

  return steps
}

async function run(): Promise<void> {
  const eventType = detectEventType()
  if (!eventType) {
    core.setFailed('This action must be run on pull_request, issues, or issue_comment events')
    return
  }

  const targetNumber = getTargetNumber()
  if (!targetNumber) {
    core.setFailed('Could not determine PR or issue number from event payload')
    return
  }

  const aiConfig = getAiConfig()
  if (!aiConfig.valid) {
    core.setFailed(aiConfig.error)
    return
  }

  const githubToken = core.getInput('github-token', { required: true })
  const { owner, repo } = github.context.repo

  let gh: GitHubClient
  try {
    const oidcToken = await core.getIDToken(BOT_URL)
    gh = new BotGitHubClient(githubToken, owner, repo, oidcToken)
    core.info('[main] Using Slopper Bot for writes (slopper-bot[bot])')
  } catch (err) {
    core.setFailed(
      'Slopper requires the Slopper App to be installed on this repository.\n' +
      'Install it at: https://github.com/apps/slopper-bot\n' +
      'Your workflow also needs `permissions: id-token: write`.\n\n' +
      `Details: ${errorMessage(err)}`
    )
    return
  }

  const slopper = new SlopperClient()

  core.info(`[main] Event type: ${eventType}, target: #${targetNumber}`)

  const vouchPipeline = new AnalysisPipeline([
    new LoadConfigStep(gh),
    new VouchCheckStep(gh),
    new BannedCheckStep(gh, slopper),
    new RiskyUserCheckStep(slopper),
    new VouchApplyStep(gh)
  ])
  const vouchResult = await vouchPipeline.run({ prNumber: targetNumber, eventType })

  if (vouchResult.vouched || vouchResult.banned) return

  const steps = eventType === 'issue'
    ? buildIssueSteps(gh, slopper, aiConfig)
    : buildPrSteps(gh, slopper, aiConfig)

  await new AnalysisPipeline(steps).run({
    prNumber: targetNumber,
    eventType,
    config: vouchResult.config,
    stepResults: vouchResult.stepResults
  })
}

run().catch((error: unknown) => {
  core.setFailed(errorMessage(error))
})
