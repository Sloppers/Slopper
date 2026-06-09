<h1 align="center">SLOPPER</h1>

<p align="center">
  <a href="https://github.com/Sloppers/Slopper/actions"><img src="https://github.com/Sloppers/Slopper/workflows/CI/badge.svg" alt="CI" /></a>
  <a href="https://github.com/marketplace/actions/slopper-ai-slop-detector"><img src="https://img.shields.io/badge/Marketplace-Slopper-blue?logo=github" alt="GitHub Marketplace" /></a>
  <a href="https://github.com/Sloppers/Slopper/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Sloppers/Slopper" alt="License" /></a>
</p>

<p align="center"><strong>Control low-quality contributions on your open source projects — automatically.</strong></p>

---

Slopper is an open source initiative to fight back against low-quality contributions flooding GitHub. Maintainers are drowning in AI-generated pull requests and issues that look polished but add nothing — Slopper analyzes the **full contribution pipeline**, not just the code itself, to answer one question: **is this contribution genuine?**

Instead of reviewing diffs in isolation, Slopper evaluates the entire context around a contribution:

- **Reputation** — account age, merge history, past contributions to the repo
- **Behavioral signals** — spray-and-pray patterns across repos, activity bursts, unsigned commits
- **Effort** — missing descriptions, no linked issues, no tests, low-effort issue bodies
- **Content quality** — code duplication, supply chain risks, AI-generated slop detection
- **Duplication** — Jaccard similarity matching to catch copied or recycled issues

This applies across the SDLC — pull requests, issues, and issue comments are all analyzed through dedicated pipelines sharing the same signal framework.


## Community Lists

Slopper maintains a set of [community-driven lists](https://github.com/Sloppers/community-list) that every installation fetches at runtime. These lists are managed automatically by the Slopper bot — when a maintainer runs `/slopper report` on a PR, the bot validates the report and adds the account to the global risky users list. No manual file editing required.

| List | Purpose |
|------|---------|
| [`risky_users/`](https://github.com/Sloppers/community-list/tree/main/risky_users) | Accounts reported via `/slopper report` and validated by the bot |
| [`trusted_orgs/`](https://github.com/Sloppers/community-list/tree/main/trusted_orgs) | GitHub orgs whose members get a score reduction |

Each entry is its own file — no merge conflicts when the bot adds or removes entries concurrently across thousands of repos.

## Prerequisites

1. **Install the Slopper App** on your repository or organization: [github.com/apps/slopper-bot](https://github.com/apps/slopper-bot)

   Slopper uses a GitHub App to comment, label, and manage PRs under its own identity (`slopper-bot[bot]`).

2. Your workflow must include `id-token: write` permission for OIDC authentication with the Slopper Bot.

## Quick Start

```yaml
name: Slopper
on:
  pull_request:
    types: [opened, synchronize, reopened]
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: write
      id-token: write
    steps:
      - uses: Sloppers/Slopper@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

For deeper AI-powered analysis, add a provider:

```yaml
      - uses: Sloppers/Slopper@main
        with:
          ai-provider: 'gemini'
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

See [`examples/`](examples/) for more setups (strict mode, merge gating, multi-provider).

## What it does

### Pull requests
- **Scores PRs 0-10** from 19 deterministic checks and 5 optional AI-powered agentic checks
- **Profiles contributors** across GitHub — account age, PR volume, merge ratio, spray score
- **Labels PRs** as `slopper/slop` or `slopper/legit`
- **Auto-closes, auto-approves, or requests review** based on configurable thresholds
- `/slopper vouch` — maintainers permanently whitelist a contributor
- `/slopper report` — maintainers ban an account and close the PR

### Issues
- **Scores issues 0-10** from 10 deterministic checks and 2 optional AI-powered agentic checks
- **Detects low-effort issues** — missing descriptions, one-liners, "please fix" patterns
- **Finds duplicates** — Jaccard similarity matching against recent issues
- **Labels issues** with `slopper/issue/low-effort`, `slopper/issue/duplicate`, `slopper/issue/ai-slop`
- **Auto-closes and auto-locks** issues exceeding configurable score thresholds

For the full list of checks, scoring details, and indicators, see **[docs/checks.md](docs/checks.md)**.

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
    spray: 3
    supply_chain: 2
    new_account: 1
    low_merge_ratio: 1
    risky_user: 1
    unsigned_commits: 1
    no_tests: 1
    trusted_org: -2

ignore_paths:
  - "*.md"
  - "docs/**"
  - "*.lock"

ignore_folders:
  - vendor
  - test/fixtures
  - generated

patterns:
  lockfiles:
    - package-lock.json
    - yarn.lock
    - pnpm-lock.yaml
  manifest_files:
    - package.json
    - requirements.txt
  ci_paths:
    - ".github/workflows/"
    - ".buildkite/"
  dependency_files:
    - package.json
    - package-lock.json
    - yarn.lock
  test_patterns:
    - "/__tests__/"
    - "\\.test\\.[jt]sx?$"
    - "\\.spec\\.[jt]sx?$"
  source_extensions:
    - ts
    - tsx
    - js
    - jsx
    - py
    - go
  supply_chain_patterns:
    - '(-\s*"version":\s*"\d+\.\d+\.\d+".*\n\+\s*"version":\s*"\d+\.\d+\.\d+")'
  linked_issue_patterns:
    - '(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+'
    - '#\d+'
  min_duplicate_lines: 6
  min_duplicate_blocks: 2

rules:
  require_description: true
  require_linked_issue: false
  max_files_changed: 0
  max_total_changes: 1500
  max_file_changes: 800

issue_rules:
  min_body_length: 30
  duplicate_threshold: 0.7
  duplicate_lookback: 50
  auto_close_threshold: 8
  auto_lock: false
  auto_lock_threshold: 9
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
