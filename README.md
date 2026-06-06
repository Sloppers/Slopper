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
- **Two check suites** — static checks run always (no cost); agentic checks use AI for deeper analysis (slop detection, description-vs-diff mismatch, code quality, security review)

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
      - uses: malvads/slopper@v0.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

That's it. No API keys needed — Slopper scores PRs using deterministic heuristics out of the box.

For deeper AI-powered analysis, add a provider:

```yaml
      - uses: malvads/slopper@v0.1.0
        with:
          ai-provider: 'gemini'
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

See [`examples/`](examples/) for more setups (strict mode, merge gating, multi-provider).

## How Scoring Works

Slopper runs **two check suites** that feed into a single unified score. Every check has a `defaultWeight` and a `scoreFactor()`. The risk score is `sum(factor × weight)`, clamped to 0–10. Checks with weight 0 only produce labels — they flag something without affecting the score.

### Static checks — deterministic, always run, zero cost

Static checks are pure heuristics: they look at the PR metadata, diff, author profile, and commit history. No API calls, no tokens, no latency. They run on every PR regardless of configuration.

There are **24 static checks** total. The ones that contribute to the score:

| Check | Weight | Factor | What it measures |
|-------|--------|--------|-----------------|
| AI Fingerprint | +4 | continuous (0–1) | 6 heuristic signals detecting machine-generated code patterns |
| Spray Score | +3 | continuous (0–1) | Cross-repo PR volume, distinct repos, merge ratio, account age |
| Supply Chain | +2 | binary | Lockfile changes without manifest, suspicious resolved URLs, version downgrades |
| New Account | +1 | binary | Account younger than configurable threshold (default 30 days) |
| Low Merge Ratio | +1 | binary | Below configurable threshold (default 40%) |
| Risky User | +1 | binary | Listed in community blocklist |
| Unsigned Commits | +1 | continuous (0–1) | Unsigned commits or author/committer mismatches |
| No Tests | +1 | binary | PR adds source code but no test files |
| Trusted Org | **-2** | binary | Public member of a trusted GitHub organization (reduces score) |

The remaining static checks are **label-only** (weight 0) — they flag patterns without changing the score:

| Check | Label | What it flags |
|-------|-------|---------------|
| First Time Contributor | `slopper/first-time-contributor` | First PR to this repo |
| CI Modified | `slopper/ci-modified` | CI/CD config files changed |
| Dependencies Modified | `slopper/dependencies-modified` | Lockfiles or manifests changed |
| Activity Burst | `slopper/activity-burst` | Unusual spike in PR activity |
| Possibly AI | `slopper/possibly-ai-generated` | Moderate AI fingerprint score (40–70) |
| Missing Description | `slopper/missing-description` | PR body is empty |
| No Linked Issue | `slopper/no-linked-issue` | No issue reference in PR body |
| Too Many Files | `slopper/too-many-files` | PR changes more files than threshold |
| Heavy Changes | `slopper/heavy-changes` | Total line changes exceed threshold |
| Large File | `slopper/large-file` | Single file diff exceeds threshold |
| Code Duplication | `slopper/code-duplication` | Duplicated code blocks in the diff |
| Security Review | `slopper/needs-security-review` | Score is high enough to warrant security review |
| Suspicious | `slopper/suspicious` | Score is very high |
| Approved | `slopper/approved` | Low score + high confidence |
| Deterministic Mode | `slopper/mode/deterministic` | No AI provider configured |

### Agentic checks — AI-powered, only with a provider

Agentic checks are fundamentally different from static checks. Each one makes its own focused AI call with a dedicated prompt and tool schema, then returns structured reasoning and evidence. They only run when you configure an `ai-provider`.

There are **4 agentic checks**:

| Check | Weight | What the AI evaluates |
|-------|--------|----------------------|
| Slop Content | +2 | Generic AI slop: phantom fixes, boilerplate, templated descriptions |
| Security Concern | +2 | Obfuscated code, credentials, backdoors, CI tampering |
| Description Mismatch | +1 | PR description doesn't match the actual diff |
| Code Quality | +1 | Missing edge cases, unnecessary complexity, duplicate functionality |

**Key differences from static checks:**

- **Async** — each agentic check calls an LLM; static checks are synchronous and instant
- **Parallel execution** — all 4 run concurrently via `Promise.allSettled`, so one failing doesn't block the others
- **Structured reasoning** — each returns `{ triggered, label, reasoning, confidence, evidence[] }`, shown in the PR comment
- **Independent prompts** — each check has its own system/user prompt and tool schema, not a single monolithic AI call
- **Graceful failure** — if an individual check errors, it's skipped; the rest still run

The PR comment shows triggered agentic checks with confidence level, reasoning, and supporting evidence.

### Unified scoring

Both suites feed the same score formula. All weights are configurable via `label_thresholds.score_weights` in `.slopper`. Final score is clamped to 0–10.

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

## Commands

Comment on any PR:

| Command | Who | What it does |
|---------|-----|-------------|
| `/slopper vouch` | Maintainers / code owners | Permanently whitelists the PR author — creates `.slopper.d/vouched/<username>`, future PRs skip analysis |
| `/slopper report` | Maintainers / code owners | Bans the PR author, closes the PR, creates `.slopper.d/banned/<username>` |

### Merge-safe user lists

Vouch and report actions write **one file per user** under `.slopper.d/`:

```
.slopper.d/
  banned/
    spam-account-1
    spam-account-2
  vouched/
    trusted-dev
    dependabot[bot]
```

Each file is a single entry — no merge conflicts when multiple maintainers vouch or report users in parallel. At load time, Slopper merges `.slopper.d/banned/*` and `.slopper.d/vouched/*` with the lists in `.slopper`. You can use either location — the inline `vouched:` / `banned:` arrays in `.slopper` still work, the directory entries are additive.

## Labels

All labels are deterministic — the AI never picks them.

| Label | Trigger | Config key |
|-------|---------|------------|
| `slopper/risk/low` ... `critical` | Score thresholds | `thresholds.low/medium/high` |
| `slopper/likely-ai-generated` | Fingerprint >= 70 | `label_thresholds.ai_likely` |
| `slopper/possibly-ai-generated` | Fingerprint >= 40 | `label_thresholds.ai_possibly` |
| `slopper/spray-and-pray` | Spray score > 60 | `label_thresholds.spray_score` |
| `slopper/new-account` | Account < 30 days | `label_thresholds.new_account_days` |
| `slopper/low-merge-ratio` | Merge ratio < 40% | `label_thresholds.merge_ratio_suspect` |
| `slopper/activity-burst` | > 10 PRs in 7 days | `label_thresholds.activity_burst_prs` |
| `slopper/risky-user` | On community list | — |
| `slopper/trusted-org` | Member of trusted org | `trusted_orgs` |
| `slopper/supply-chain` | Suspicious dependency/lockfile changes | — |
| `slopper/unsigned-commits` | Unsigned commits or author/committer mismatch | — |
| `slopper/no-tests` | Adds code but no tests | — |
| `slopper/code-duplication` | Duplicated code blocks in diff | — |
| `slopper/heavy-changes` | Total lines > 1500 | `rules.max_total_changes` |
| `slopper/large-file` | Single file > 800 lines | `rules.max_file_changes` |
| `slopper/mode/deterministic` | No AI provider set | — |
| `slopper/banned` | Banned or reported | — |
| `slopper/ci-modified` | CI/CD files changed | — |
| `slopper/dependencies-modified` | Lockfiles changed | — |
| `slopper/ai/slop-content` | AI: generic slop detected | Requires AI provider |
| `slopper/ai/description-mismatch` | AI: description ≠ diff | Requires AI provider |
| `slopper/ai/code-quality` | AI: quality issues found | Requires AI provider |
| `slopper/ai/security-concern` | AI: security concern | Requires AI provider |

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
