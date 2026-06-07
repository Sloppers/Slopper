<h1 align="center">SLOPPER</h1>

<p align="center">
  <a href="https://github.com/Sloppers/Slopper/actions"><img src="https://github.com/Sloppers/Slopper/workflows/CI/badge.svg" alt="CI" /></a>
  <a href="https://github.com/marketplace/actions/slopper-ai-slop-detector"><img src="https://img.shields.io/badge/Marketplace-Slopper-blue?logo=github" alt="GitHub Marketplace" /></a>
  <a href="https://github.com/Sloppers/Slopper/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Sloppers/Slopper" alt="License" /></a>
</p>

<p align="center"><strong>Very experimental</strong> — expect rough edges, false positives, and breaking changes.</p>

---

Slopper is an open source initiative to fight back against low-quality contributions flooding GitHub. Maintainers are drowning in AI-generated pull requests that look clean but add nothing — Slopper scores every PR using deterministic heuristics to answer one question: **does this PR actually add value?**

No API keys, no cost, one workflow file.

## Community Lists

Slopper maintains a set of [community-driven lists](https://github.com/Sloppers/community-list) that every installation fetches at runtime:

| List | Purpose |
|------|---------|
| [`risky_users/`](https://github.com/Sloppers/community-list/tree/main/risky_users) | Reported accounts flagged for AI slop or spam PRs |
| [`trusted_orgs/`](https://github.com/Sloppers/community-list/tree/main/trusted_orgs) | GitHub orgs whose members get a score reduction |

Each entry is its own file — no merge conflicts. To report a user or add a trusted org, open an issue or PR on the [community-list](https://github.com/Sloppers/community-list) repo.

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
      - uses: Sloppers/Slopper@v0.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

For deeper AI-powered analysis, add a provider:

```yaml
      - uses: Sloppers/Slopper@v0.1.0
        with:
          ai-provider: 'gemini'
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

See [`examples/`](examples/) for more setups (strict mode, merge gating, multi-provider).

## What it does

- **Scores PRs 0-10** from 22 deterministic checks and 5 optional AI-powered agentic checks
- **Profiles contributors** across GitHub — account age, PR volume, merge ratio, spray score
- **Labels PRs** as `slopper/slop` or `slopper/legit`
- **Auto-closes, auto-approves, or requests review** based on configurable thresholds
- `/slopper vouch` — maintainers permanently whitelist a contributor
- `/slopper report` — maintainers ban an account and close the PR

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

rules:
  require_description: true
  require_linked_issue: false
  max_files_changed: 0
  max_total_changes: 1500
  max_file_changes: 800
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
