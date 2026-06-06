import * as core from '@actions/core'
import * as github from '@actions/github'
import { AnalysisPipeline } from './pipeline'
import { AiProvider } from './providers'
import {
  VouchCheckStep,
  VouchApplyStep,
  CollectDataStep,
  AiAnalysisStep,
  ComputeLabelsStep,
  PostResultsStep
} from './steps'

/**
 * Main entry point for the slopper GitHub Action.
 *
 * Builds and runs the analysis pipeline:
 * 1. VouchCheck — check if author is vouched (.slopper file or /slopper vouch)
 * 2. VouchApply — if vouched, apply labels and skip analysis
 * 3. CollectData — gather PR metadata, author profile, commits, diff
 * 4. AiAnalysis — send data to AI provider via MCP tool calling
 * 5. ComputeLabels — deterministically compute labels from results
 * 6. PostResults — post comment and apply labels
 */
async function run(): Promise<void> {
  const provider = core.getInput('ai-provider') as AiProvider
  const githubToken = core.getInput('github-token', { required: true })
  const openaiApiKey = core.getInput('openai-api-key')
  const anthropicApiKey = core.getInput('anthropic-api-key')
  const vertexProjectId = core.getInput('vertex-project-id')
  const vertexRegion = core.getInput('vertex-region') || 'global'
  const groqApiKey = core.getInput('groq-api-key')
  const geminiApiKey = core.getInput('gemini-api-key')
  const model = core.getInput('model') || undefined

  const validProviders: AiProvider[] = ['openai', 'anthropic', 'vertex', 'groq', 'gemini']
  if (!validProviders.includes(provider)) {
    core.setFailed(
      `Invalid ai-provider: ${provider}. Must be one of: ${validProviders.join(', ')}`
    )
    return
  }

  const context = github.context
  const prNumber = context.payload.pull_request?.number
  if (!prNumber) {
    core.setFailed('This action must be run on a pull_request event')
    return
  }

  const octokit = github.getOctokit(githubToken)
  const { owner, repo } = context.repo

  const vouchCheck = new VouchCheckStep(octokit, owner, repo)
  const vouchApply = new VouchApplyStep(octokit, owner, repo)
  const collectData = new CollectDataStep(octokit, owner, repo)
  const aiAnalysis = new AiAnalysisStep({
    provider,
    openaiApiKey,
    anthropicApiKey,
    vertexProjectId,
    vertexRegion,
    groqApiKey,
    geminiApiKey,
    model
  })
  const computeLabels = new ComputeLabelsStep()
  const postResults = new PostResultsStep(octokit, owner, repo)

  const vouchPipeline = new AnalysisPipeline([vouchCheck, vouchApply])
  const vouchResult = await vouchPipeline.run({ prNumber })

  if (vouchResult.vouched) return

  const analysisPipeline = new AnalysisPipeline([
    collectData,
    aiAnalysis,
    computeLabels,
    postResults
  ])
  await analysisPipeline.run({ prNumber })
}

run().catch(error => {
  core.setFailed(error instanceof Error ? error.message : String(error))
})
