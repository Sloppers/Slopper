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
  AutoActionsStep
} from './steps'

const BOT_URL = 'https://slopper-bot.thegexi.workers.dev'

const VALID_PROVIDERS: readonly AiProvider[] = ['openai', 'anthropic', 'vertex', 'groq', 'gemini']

function isValidProvider(value: string): value is AiProvider {
  return (VALID_PROVIDERS as readonly string[]).includes(value)
}

async function run(): Promise<void> {
  const providerInput = core.getInput('ai-provider') || ''
  const useAi = providerInput !== '' && providerInput !== 'none'

  if (useAi && !isValidProvider(providerInput)) {
    core.setFailed(
      `Invalid ai-provider: ${providerInput}. Must be one of: none, ${VALID_PROVIDERS.join(', ')}`
    )
    return
  }

  const githubToken = core.getInput('github-token', { required: true })

  const prNumber =
    github.context.payload.pull_request?.number ??
    github.context.payload.issue?.number
  if (!prNumber) {
    core.setFailed('This action must be run on a pull_request or issue_comment event')
    return
  }

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

  const vouchPipeline = new AnalysisPipeline([
    new LoadConfigStep(gh),
    new VouchCheckStep(gh),
    new BannedCheckStep(gh, slopper),
    new RiskyUserCheckStep(slopper),
    new VouchApplyStep(gh)
  ])
  const vouchResult = await vouchPipeline.run({ prNumber })

  if (vouchResult.vouched || vouchResult.banned) return

  const steps: PipelineStep[] = [
    new CollectDataStep(gh),
    new ProfileAnalysisStep(gh, slopper),
  ]

  if (useAi) {
    const provider = providerInput as AiProvider
    const providerConfig = {
      openaiApiKey: core.getInput('openai-api-key'),
      anthropicApiKey: core.getInput('anthropic-api-key'),
      vertexProjectId: core.getInput('vertex-project-id'),
      vertexRegion: core.getInput('vertex-region') || 'global',
      groqApiKey: core.getInput('groq-api-key'),
      geminiApiKey: core.getInput('gemini-api-key'),
      model: core.getInput('model') || undefined
    }
    steps.push(new AiAnalysisStep({ provider, ...providerConfig }))
    steps.push(new AgenticChecksStep({ provider, providerConfig }))
  } else {
    core.info('[main] Running in deterministic mode — no AI provider configured')
  }

  steps.push(
    new ComputeLabelsStep(),
    new PostResultsStep(gh),
    new AutoActionsStep(gh)
  )

  await new AnalysisPipeline(steps).run({ prNumber, config: vouchResult.config, stepResults: vouchResult.stepResults })
}

run().catch((error: unknown) => {
  core.setFailed(errorMessage(error))
})
