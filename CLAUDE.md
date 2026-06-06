# Slopper

GitHub Action (node20) that detects AI slop in pull requests. TypeScript, bundled with `@vercel/ncc`.

## Build & Test

```bash
npm run build --no-workspaces       # tsc
npm run test --no-workspaces        # jest
npm run all --no-workspaces         # build + test + package
```

**`--no-workspaces` is required on every npm/npx command.** The dev machine's `~/.npmrc` has `workspaces=true` which breaks single-package repos.

## Bundling for Release

```bash
npx --no-workspaces ncc build src/main.ts -o dist
git add -f dist/
```

`dist/` is in `.gitignore` — you must `git add -f dist/` to include the bundle. GitHub Actions reads `dist/index.js` at runtime.

## Architecture

Single entry point: `src/main.ts`. All GitHub API access goes through `src/clients/github.ts` (`GitHubClient` class). Never import Octokit directly elsewhere.

Pipeline steps live in `src/steps/`, each extending the abstract `PipelineStep` class from `src/pipeline.ts`. The pipeline context (`PipelineContext`) is a shared data bag passed through all steps.

**Vouch pipeline:** LoadConfig -> VouchCheck -> BannedCheck -> VouchApply (short-circuits if vouched or banned)

**Analysis pipeline:** CollectData -> ProfileAnalysis -> Fingerprint -> AiAnalysis -> ComputeLabels -> PostResults -> AutoActions

## Key Constraints

- JSON schemas for structured AI tool calls must have `additionalProperties: false` on ALL nested objects (Groq compatibility).
- Labels are computed deterministically in `src/labels.ts` — never by the AI provider.
- `src/labels.ts` `compute()` takes an options object, not positional args.
- `src/commenter.ts` `buildCommentBody()` takes an options object, not positional args.
- Tests mock `GitHubClient` (e.g., `{ getFileContent: jest.fn() }`), not raw Octokit.
