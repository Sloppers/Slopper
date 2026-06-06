<h1 align="center">SLOPPER</h1>

<p align="center">
  <a href="https://github.com/malvads/slopper/actions"><img src="https://github.com/malvads/slopper/workflows/CI/badge.svg" alt="CI" /></a>
  <a href="https://github.com/marketplace/actions/slopper-ai-slop-detector"><img src="https://img.shields.io/badge/Marketplace-Slopper-blue?logo=github" alt="GitHub Marketplace" /></a>
  <a href="https://github.com/malvads/slopper/blob/main/LICENSE"><img src="https://img.shields.io/github/license/malvads/slopper" alt="License" /></a>
</p>

<p align="center"><strong>Very experimental</strong> — expect rough edges, false positives, and breaking changes.</p>

---

Open source maintainers are drowning in AI-generated pull requests that look clean but add nothing. curl, the Linux kernel, Godot, Node.js — they've all been hit. Polished descriptions, passing CI, and zero real value.

Slopper is a GitHub Action that scores every PR using deterministic heuristics to answer one question: **does this PR actually add value?** No API keys, no cost, one workflow file.

## The Problem

- Phantom fixes for bugs that don't exist
- Unnecessary refactoring that touches critical paths
- Documentation that restates the obvious
- Spray-and-pray accounts submitting to dozens of unrelated repos
- Reputation farming in critical infrastructure

## What Slopper Does

- **Scores PRs 0–10** — deterministic risk score from heuristic signals, so you know where to spend review time
- **Detects AI-generated code** using 6 heuristic signals (comment density, slop vocabulary, verbose identifiers, docstring bloat, boilerplate ratio, structural patterns)
- **Profiles contributors** across GitHub — account age, PR volume, merge ratio, spray score — to spot accounts that shotgun low-quality PRs across dozens of repos
- **Flags risky accounts** from a [community-maintained blocklist](https://github.com/malvads/slopper/blob/main/.slopper_risky_users), updated in real time
- **Auto-closes, auto-approves, or requests review** based on configurable thresholds
- **Bans repeat offenders** — maintainers comment `/slopper report` to permanently block an account
- **Vouches trusted contributors** — `/slopper vouch` skips all analysis for that author going forward
- **AI optional** — runs fully on deterministic heuristics by default. Add an AI provider (`openai`, `anthropic`, `vertex`, `groq`, `gemini`) for deeper analysis when you want it

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
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

That's it. No API keys needed — Slopper scores PRs using deterministic heuristics out of the box.

For deeper AI-powered analysis, add a provider:

```yaml
      - uses: malvads/slopper@v1
        with:
          ai-provider: 'gemini'
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

See [`examples/`](examples/) for more setups (strict mode, merge gating, multi-provider).

## How Scoring Works

In deterministic mode (default), the risk score is derived from:

| Signal | Default Weight | What it measures |
|--------|---------------|-----------------|
| AI Fingerprint | +4 | 6 heuristic signals detecting machine-generated code patterns |
| Spray Score | +3 | Cross-repo PR volume, distinct repos, merge ratio, account age |
| New Account | +1 | Account younger than configurable threshold (default 30 days) |
| Low Merge Ratio | +1 | Below configurable threshold (default 40%) |
| Risky User | +1 | Listed in community blocklist |
| Trusted Org | **-2** | Public member of a trusted GitHub organization |

All weights are configurable via `label_thresholds.score_weights` in `.slopper`. Negative weights reduce the score. Final score is clamped to 0–10.

When an AI provider is configured, the score comes from the AI analysis instead, with richer context from commit messages, code diffs, and behavioral signals.

## Configuration

Create a `.slopper` file in your repo root. Every field is optional:

```yaml
vouched:
  - trusted-contributor
  - dependabot[bot]

banned:
  - known-slop-account

trusted_orgs:
  - nodejs
  - kubernetes

actions:
  auto_close:
    enabled: true
    threshold: 9
  auto_approve:
    enabled: false
    threshold: 2
  auto_request_review:
    enabled: true
    threshold: 6
    reviewers:
      - senior-maintainer

thresholds:
  low: 2
  medium: 5
  high: 8

label_thresholds:
  ai_likely: 70
  ai_possibly: 40
  spray_score: 60
  new_account_days: 30
  activity_burst_prs: 10
  activity_burst_days: 7
  merge_ratio_suspect: 0.4
  security_review_score: 6
  suspicious_score: 8
  spray_weights:
    repos: 40
    volume: 30
    merge_ratio: 20
    account_age: 10
  score_weights:
    fingerprint: 4
    spray: 3
    new_account: 1
    low_merge_ratio: 1
    risky_user: 1
    trusted_org: -2

ignore_paths:
  - "*.md"
  - "docs/**"
  - "*.lock"

rules:
  require_description: true
  require_linked_issue: false
  max_files_changed: 0
```

## Commands

Comment on any PR:

| Command | Who | What it does |
|---------|-----|-------------|
| `/slopper vouch` | Maintainers / code owners | Permanently whitelists the PR author — future PRs skip analysis |
| `/slopper report` | Maintainers / code owners | Bans the PR author, closes the PR, adds them to `.slopper` banned list |

## Labels

All labels are deterministic — the AI never picks them.

| Label | Trigger | Config key |
|-------|---------|------------|
| `slopper/risk/low` ... `critical` | Score thresholds | `thresholds.low/medium/high` |
| `slopper/likely-ai-generated` | Fingerprint >= 70 | `label_thresholds.ai_likely` |
| `slopper/possibly-ai-generated` | Fingerprint >= 40 | `label_thresholds.ai_possibly` |
| `slopper/spray-and-pray` | Spray score > 60 | `label_thresholds.spray_score` |
| `slopper/new-account` | Account < 30 days | `label_thresholds.new_account_days` |
| `slopper/activity-burst` | > 10 PRs in 7 days | `label_thresholds.activity_burst_prs` |
| `slopper/risky-user` | On community list | — |
| `slopper/trusted-org` | Member of trusted org | `trusted_orgs` |
| `slopper/mode/deterministic` | No AI provider set | — |
| `slopper/banned` | Banned or reported | — |
| `slopper/ci-modified` | CI/CD files changed | — |
| `slopper/dependencies-modified` | Lockfiles changed | — |

## Outputs

Use in subsequent workflow steps:

| Output | Description |
|--------|-------------|
| `risk-score` | 0–10 (deterministic or AI-derived) |
| `risk-level` | `low`, `medium`, `high`, `critical` |
| `confidence` | `low` (deterministic), `low`/`medium`/`high` (with AI) |
| `labels` | Comma-separated list |

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
