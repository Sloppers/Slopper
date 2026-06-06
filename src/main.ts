import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHubClient } from './clients/github'
import { AnalysisPipeline } from './core/pipeline'
import { AiProvider } from './ai/providers'
import {
  LoadConfigStep,
  VouchCheckStep,
  BannedCheckStep,
  RiskyUserCheckStep,
  VouchApplyStep,
  CollectDataStep,
  ProfileAnalysisStep,
  FingerprintStep,
  AiAnalysisStep,
  ComputeLabelsStep,
  PostResultsStep,
  AutoActionsStep
} from './steps'

const VALID_PROVIDERS: readonly AiProvider[] = ['openai', 'anthropic', 'vertex', 'groq', 'gemini']

function isValidProvider(value: string): value is AiProvider {
  return (VALID_PROVIDERS as readonly string[]).includes(value)
}

async function run(): Promise<void> {
  const providerInput = core.getInput('ai-provider')
  if (!isValidProvider(providerInput)) {
    core.setFailed(
      `Invalid ai-provider: ${providerInput}. Must be one of: ${VALID_PROVIDERS.join(', ')}`
    )
    return
  }

  const provider = providerInput
  const githubToken = core.getInput('github-token', { required: true })
  const openaiApiKey = core.getInput('openai-api-key')
  const anthropicApiKey = core.getInput('anthropic-api-key')
  const vertexProjectId = core.getInput('vertex-project-id')
  const vertexRegion = core.getInput('vertex-region') || 'global'
  const groqApiKey = core.getInput('groq-api-key')
  const geminiApiKey = core.getInput('gemini-api-key')
  const model = core.getInput('model') || undefined

  const prNumber =
    github.context.payload.pull_request?.number ??
    github.context.payload.issue?.number
  if (!prNumber) {
    core.setFailed('This action must be run on a pull_request or issue_comment event')
    return
  }

  const { owner, repo } = github.context.repo
  const gh = new GitHubClient(githubToken, owner, repo)

  const vouchPipeline = new AnalysisPipeline([
    new LoadConfigStep(gh),
    new VouchCheckStep(gh),
    new BannedCheckStep(gh),
    new RiskyUserCheckStep(),
    new VouchApplyStep(gh)
  ])
  const vouchResult = await vouchPipeline.run({ prNumber })

  if (vouchResult.vouched || vouchResult.banned) return

  const analysisPipeline = new AnalysisPipeline([
    new CollectDataStep(gh),
    new ProfileAnalysisStep(gh),
    new FingerprintStep(),
    new AiAnalysisStep({
      provider,
      openaiApiKey,
      anthropicApiKey,
      vertexProjectId,
      vertexRegion,
      groqApiKey,
      geminiApiKey,
      model
    }),
    new ComputeLabelsStep(),
    new PostResultsStep(gh),
    new AutoActionsStep(gh)
  ])
  await analysisPipeline.run({ prNumber, config: vouchResult.config })
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error))
})
