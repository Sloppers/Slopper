# Contributing to Slopper

## Setup

```bash
git clone https://github.com/malvads/slopper.git
cd slopper
npm install --no-workspaces
```

The `--no-workspaces` flag is required if your global npm config has `workspaces=true`.

## Development

```bash
npm run build --no-workspaces    # Compile TypeScript
npm run test --no-workspaces     # Run tests
npm run all --no-workspaces      # Build + test + package
```

## Project Structure

```
src/
  main.ts                # Entry point
  clients/
    github.ts            # Shared GitHub API client
  core/
    pipeline.ts          # Pipeline orchestrator
    config.ts            # .slopper config parser
    types.ts             # Shared TypeScript interfaces
  analysis/
    ai-fingerprint.ts    # Heuristic AI code detection
    author-profile.ts    # Cross-repo activity analysis
    collector.ts         # PR data collection
  ai/
    providers.ts         # AI provider implementations
    prompt.ts            # AI system/user prompt builder
    tools.ts             # Structured output schema
  output/
    labels.ts            # Deterministic label computation
    commenter.ts         # PR comment builder + label manager
  steps/
    00_load-config.ts    # Pipeline steps (numbered by execution order)
    01_vouch-check.ts
    ...
    10_auto-actions.ts
```

## Pipeline Flow

**Vouch pipeline:** LoadConfig → VouchCheck → BannedCheck → RiskyUserCheck → VouchApply

**Analysis pipeline:** CollectData → ProfileAnalysis → Fingerprint → AiAnalysis → ComputeLabels → PostResults → AutoActions

## Adding a New Pipeline Step

1. Create `src/steps/your-step.ts` extending `PipelineStep`
2. Add any new context fields to `PipelineContext` in `pipeline.ts`
3. Export from `src/steps/index.ts`
4. Wire into the pipeline in `main.ts`
5. Add tests in `__tests__/`

## Building for Release

```bash
npx --no-workspaces ncc build src/main.ts -o dist
git add -f dist/
git commit -m "build: bundle dist for release"
```

The `dist/` directory is in `.gitignore` but must be force-added for GitHub Actions to find the entry point.

## Pull Requests

Open a PR against `main`. Include a clear description of what changed and why. Tests should pass (`npm run test --no-workspaces`).
