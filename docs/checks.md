# Checks & Scoring

Slopper runs **two check suites** that feed into a single unified score. Every check has a `defaultWeight` and a `scoreFactor()`. The risk score is `sum(factor * weight)`, clamped to 0-10. All checks contribute to the score — there are no indicator-only checks.

## Static checks — deterministic, always run, zero cost

Static checks are pure heuristics: they look at the PR metadata, diff, author profile, and commit history. No API calls, no tokens, no latency. They run on every PR regardless of configuration.

There are **18 static checks**:

| Check | Key | Weight | Factor | What it measures |
|-------|-----|--------|--------|-----------------|
| Spray Score | `spray_and_pray` | +3 | continuous (0-1) | Cross-repo PR volume, distinct repos, merge ratio, account age |
| Supply Chain | `supply_chain` | +2 | binary | Lockfile changes without manifest, suspicious resolved URLs, version downgrades |
| Activity Burst | `activity_burst` | +2 | binary | Unusual spike in PR activity (> threshold in burst window) |
| New Account | `new_account` | +1 | binary | Account younger than configurable threshold (default 30 days) |
| Low Merge Ratio | `low_merge_ratio` | +1 | binary | Below configurable threshold (default 40%) |
| Risky User | `risky_user` | +1 | binary | Listed in community blocklist |
| Unsigned Commits | `unsigned_commits` | +1 | continuous (0-1) | Unsigned commits or author/committer mismatches |
| No Tests | `no_tests` | +1 | binary | PR adds source code but no test files |
| First Time Contributor | `first_time_contributor` | +1 | binary | First PR to this repo |
| CI Modified | `ci_modified` | +1 | binary | CI/CD config files changed |
| Dependencies Modified | `dependencies_modified` | +1 | binary | Lockfiles or manifests changed |
| Missing Description | `missing_description` | +1 | binary | PR body is empty (requires `rules.require_description: true`) |
| No Linked Issue | `no_linked_issue` | +1 | binary | No issue reference in PR body (requires `rules.require_linked_issue: true`) |
| Too Many Files | `too_many_files` | +1 | binary | PR changes more files than threshold |
| Heavy Changes | `heavy_changes` | +1 | binary | Total line changes exceed threshold |
| Large File | `large_file` | +1 | binary | Single file diff exceeds threshold |
| Code Duplication | `code_duplication` | +1 | binary | Duplicated code blocks in the diff |
| Trusted Org | `trusted_org` | **-2** | binary | Public member of a trusted GitHub organization (reduces score) |

## Derived indicators

These are not checks — they're computed from the final score and shown in the PR comment:

| Indicator | Trigger |
|-----------|---------|
| `slopper/approved` | Score ≤ low threshold AND high AI confidence |
| `slopper/mode/deterministic` | No AI provider configured |
| `slopper/needs-security-review` | Score ≥ security review threshold (default 6) |
| `slopper/suspicious` | Score ≥ suspicious threshold (default 8) |

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

Both suites feed the same score formula. All weights are configurable via `label_thresholds.score_weights` in `.slopper` — the key is the check's snake_case name (see the Key column above). Final score is clamped to 0-10.

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
