<h1 align="center">SLOPPER</h1>

<h3 align="center">Keep AI slop out of your pull requests.</h3>

<p align="center">
  <a href="https://github.com/malvads/slopper/actions"><img src="https://github.com/malvads/slopper/workflows/CI/badge.svg" alt="CI" /></a>
  <a href="https://github.com/marketplace/actions/slopper-ai-slop-detector"><img src="https://img.shields.io/badge/Marketplace-Slopper-blue?logo=github" alt="GitHub Marketplace" /></a>
  <a href="https://github.com/malvads/slopper/blob/main/LICENSE"><img src="https://img.shields.io/github/license/malvads/slopper" alt="License" /></a>
</p>

---

Slopper analyzes every pull request for signs of AI-generated slop — phantom fixes, duplicate functionality, boilerplate inflation, spray-and-pray behavior, and more. It scores PRs from 0 to 10, labels them, and gives maintainers the context they need to make informed decisions. It never blocks merging.

## Quick Start

```yaml
name: Slopper
on:
  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: malvads/slopper@v1
        with:
          ai-provider: 'gemini'
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Providers

Slopper supports five AI providers: **OpenAI** (`gpt-4o`), **Anthropic** (`claude-sonnet-4-6`), **Vertex AI** (`claude-sonnet-4-6`), **Groq** (`llama-3.3-70b-versatile`), and **Gemini** (`gemini-2.5-flash`). Set `ai-provider` and the matching API key input. Override the model with the `model` input.

<details>
<summary>Provider examples</summary>

```yaml
# OpenAI
- uses: malvads/slopper@v1
  with:
    ai-provider: 'openai'
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    github-token: ${{ secrets.GITHUB_TOKEN }}

# Anthropic
- uses: malvads/slopper@v1
  with:
    ai-provider: 'anthropic'
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    github-token: ${{ secrets.GITHUB_TOKEN }}

# Vertex AI
- uses: malvads/slopper@v1
  with:
    ai-provider: 'vertex'
    vertex-project-id: ${{ secrets.VERTEX_PROJECT_ID }}
    github-token: ${{ secrets.GITHUB_TOKEN }}

# Groq
- uses: malvads/slopper@v1
  with:
    ai-provider: 'groq'
    groq-api-key: ${{ secrets.GROQ_API_KEY }}
    github-token: ${{ secrets.GITHUB_TOKEN }}

# Gemini
- uses: malvads/slopper@v1
  with:
    ai-provider: 'gemini'
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

</details>

## Pipeline

```
LoadConfig → VouchCheck → BannedCheck → RiskyUserCheck → VouchApply → CollectData → ProfileAnalysis → Fingerprint → AiAnalysis → ComputeLabels → PostResults → AutoActions
```

Slopper runs through these steps on every PR. Vouched contributors skip everything. Banned users get their PRs auto-closed. Users on the community risky list get flagged with extra scrutiny. For everyone else, Slopper collects cross-repo GitHub activity (account age, PR volume, merge ratio), runs heuristic AI fingerprinting on the diff, then sends everything to the AI provider for a holistic analysis.

## Configuration

Create a `.slopper` file in your repo root:

```yaml
vouched:
  - trusted-contributor
  - dependabot[bot]

banned:
  - known-slop-account

actions:
  auto_close:
    enabled: false
    threshold: 9
  auto_approve:
    enabled: false
    threshold: 2
  auto_request_review:
    enabled: false
    threshold: 6
    reviewers: []

thresholds:
  low: 2
  medium: 5
  high: 8

ignore_paths:
  - "*.md"
  - "docs/**"

rules:
  require_description: false
  require_linked_issue: false
  max_files_changed: 0
  block_first_time_contributors: false
```

Every field is optional. Missing fields use sensible defaults. Legacy plain-text format (newline-separated usernames) still works for the vouched list.

## Labels

Labels are computed deterministically — never by the AI. Risk labels (`slopper/risk/low` through `slopper/risk/critical`) follow configurable thresholds. Author profile labels include `slopper/spray-and-pray`, `slopper/activity-burst`, and `slopper/new-account`. AI fingerprint labels: `slopper/likely-ai-generated` (score >= 70) and `slopper/possibly-ai-generated` (>= 40). Plus `slopper/ci-modified`, `slopper/dependencies-modified`, `slopper/banned`, `slopper/risky-user`, and hygiene labels.

## Commands

Maintainers and code owners can comment these commands on any PR:

- **`/slopper vouch`** — permanently whitelist the PR author. Future PRs skip analysis entirely. The author is added to `.slopper`.
- **`/slopper report`** — ban the PR author. Adds them to the `.slopper` banned list, applies `slopper/banned` label, and closes the PR.

## Community Risky Users

Slopper ships a community-maintained risky users list (`.slopper_risky_users`) that is fetched at runtime from the Slopper repo. PRs from listed accounts get flagged with the `slopper/risky-user` label. To report an account, open a PR against [`.slopper_risky_users`](https://github.com/malvads/slopper/blob/main/.slopper_risky_users) with evidence.

## Outputs

`risk-score` (0-10), `risk-level`, `confidence`, and `labels` (comma-separated). Use in subsequent workflow steps.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and development instructions.

## License

MIT
