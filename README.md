<h1 align="center">SLOPPER</h1>

<p align="center">
  <a href="https://github.com/malvads/slopper/actions"><img src="https://github.com/malvads/slopper/workflows/CI/badge.svg" alt="CI" /></a>
  <a href="https://github.com/marketplace/actions/slopper-ai-slop-detector"><img src="https://img.shields.io/badge/Marketplace-Slopper-blue?logo=github" alt="GitHub Marketplace" /></a>
  <a href="https://github.com/malvads/slopper/blob/main/LICENSE"><img src="https://img.shields.io/github/license/malvads/slopper" alt="License" /></a>
</p>

---

GitHub Action that scores every pull request for AI slop. Catches spray-and-pray contributors, machine-generated boilerplate, and phantom fixes before they waste your review time. Scores 0–10, labels automatically, never blocks merging.

## What It Does

- **Scores PRs 0–10** with risk level and confidence, so you know where to spend review time
- **Detects AI-generated code** using 6 heuristic signals (comment density, slop vocabulary, verbose identifiers, docstring bloat, boilerplate ratio, structural patterns) — no API calls needed
- **Profiles contributors** across GitHub — account age, PR volume, merge ratio, spray score — to spot accounts that shotgun low-quality PRs across dozens of repos
- **Flags risky accounts** from a community-maintained blocklist, updated in real time
- **Auto-closes, auto-approves, or requests review** based on configurable thresholds
- **Bans repeat offenders** — maintainers comment `/slopper report` to permanently block an account
- **Vouches trusted contributors** — `/slopper vouch` skips all analysis for that author going forward
- **Works with 5 AI providers** — OpenAI, Anthropic, Vertex AI, Groq, Gemini

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

Swap `ai-provider` and the matching key for any supported provider: `openai`, `anthropic`, `vertex`, `groq`, or `gemini`. Override the default model with the `model` input.

## Configuration

Create a `.slopper` file in your repo root. Every field is optional:

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
```

## Commands

Comment on any PR:

| Command | Who | What it does |
|---------|-----|-------------|
| `/slopper vouch` | Maintainers / code owners | Permanently whitelists the PR author — future PRs skip analysis |
| `/slopper report` | Maintainers / code owners | Bans the PR author, closes the PR, adds them to `.slopper` banned list |

## Community Risky Users

Slopper fetches a [community-maintained list](https://github.com/malvads/slopper/blob/main/.slopper_risky_users) of known slop accounts at runtime. PRs from listed users get the `slopper/risky-user` label. To add an account, open a PR against that file with evidence.

## Labels

All labels are deterministic — the AI never picks them.

| Label | Trigger |
|-------|---------|
| `slopper/risk/low` ... `critical` | Score thresholds (configurable) |
| `slopper/likely-ai-generated` | AI fingerprint score >= 70 |
| `slopper/possibly-ai-generated` | AI fingerprint score >= 40 |
| `slopper/spray-and-pray` | Spray score > 60 |
| `slopper/new-account` | Account < 30 days old |
| `slopper/activity-burst` | > 10 PRs in 7 days |
| `slopper/risky-user` | On community risky users list |
| `slopper/banned` | On repo banned list or reported |
| `slopper/ci-modified` | CI/CD files changed |
| `slopper/dependencies-modified` | Lockfiles or manifests changed |

## Outputs

Use in subsequent workflow steps:

| Output | Description |
|--------|-------------|
| `risk-score` | 0–10 |
| `risk-level` | `low`, `medium`, `high`, `critical` |
| `confidence` | `low`, `medium`, `high` |
| `labels` | Comma-separated list |

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
