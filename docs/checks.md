# Checks & Scoring

Slopper runs **two check suites** that feed into a single unified score. Every check has a `defaultWeight` and a `scoreFactor()`. The risk score is `sum(factor * weight)`, clamped to 0-10. Checks with weight 0 only produce indicators — they flag something without affecting the score.

## Static checks — deterministic, always run, zero cost

Static checks are pure heuristics: they look at the PR metadata, diff, author profile, and commit history. No API calls, no tokens, no latency. They run on every PR regardless of configuration.

There are **22 static checks** total. The ones that contribute to the score:

| Check | Weight | Factor | What it measures |
|-------|--------|--------|-----------------|
| Spray Score | +3 | continuous (0-1) | Cross-repo PR volume, distinct repos, merge ratio, account age |
| Supply Chain | +2 | binary | Lockfile changes without manifest, suspicious resolved URLs, version downgrades |
| New Account | +1 | binary | Account younger than configurable threshold (default 30 days) |
| Low Merge Ratio | +1 | binary | Below configurable threshold (default 40%) |
| Risky User | +1 | binary | Listed in community blocklist |
| Unsigned Commits | +1 | continuous (0-1) | Unsigned commits or author/committer mismatches |
| No Tests | +1 | binary | PR adds source code but no test files |
| Trusted Org | **-2** | binary | Public member of a trusted GitHub organization (reduces score) |

The remaining static checks are **indicator-only** (weight 0) — they flag patterns without changing the score:

| Check | Indicator | What it flags |
|-------|-----------|---------------|
| First Time Contributor | `slopper/first-time-contributor` | First PR to this repo |
| CI Modified | `slopper/ci-modified` | CI/CD config files changed |
| Dependencies Modified | `slopper/dependencies-modified` | Lockfiles or manifests changed |
| Activity Burst | `slopper/activity-burst` | Unusual spike in PR activity |
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

## Agentic checks — AI-powered, only with a provider

Agentic checks are fundamentally different from static checks. Each one makes its own focused AI call with a dedicated prompt and tool schema, then returns structured reasoning and evidence. They only run when you configure an `ai-provider`.

There are **5 agentic checks**:

| Check | Weight | What the AI evaluates |
|-------|--------|----------------------|
| Slop Content | +2 | Generic AI slop: phantom fixes, boilerplate, templated descriptions |
| Security Concern | +2 | Obfuscated code, credentials, backdoors, CI tampering |
| Suspicious Author | +2 | Author profile patterns: new account + high volume, spray-and-pray, bot-like behavior |
| Description Mismatch | +1 | PR description doesn't match the actual diff |
| Code Quality | +1 | Missing edge cases, unnecessary complexity, duplicate functionality |

Key differences from static checks:

- **Async** — each agentic check calls an LLM; static checks are synchronous and instant
- **Parallel execution** — all 5 run concurrently via `Promise.allSettled`, so one failing doesn't block the others
- **Structured reasoning** — each returns `{ triggered, label, reasoning, confidence, evidence[] }`, shown in the PR comment
- **Independent prompts** — each check has its own system/user prompt and tool schema, not a single monolithic AI call
- **Graceful failure** — if an individual check errors, it's skipped; the rest still run

The PR comment shows triggered agentic checks with confidence level, reasoning, and supporting evidence.

## Unified scoring

Both suites feed the same score formula. All weights are configurable via `label_thresholds.score_weights` in `.slopper`. Final score is clamped to 0-10.

## Labels

Only two GitHub labels are applied to PRs:

| Label | Trigger |
|-------|---------|
| `slopper/slop` | Score >= medium threshold (default 5) |
| `slopper/legit` | Score < medium threshold |

All other signals (risk level, check triggers, agentic findings) are shown as **indicators** in the PR comment body — they inform you without cluttering the label sidebar.

## Outputs

Use in subsequent workflow steps:

| Output | Description |
|--------|-------------|
| `risk-score` | 0-10 (deterministic or AI-derived) |
| `risk-level` | `low`, `medium`, `high`, `critical` |
| `confidence` | `low` (deterministic), `low`/`medium`/`high` (with AI) |
| `labels` | Comma-separated list |
