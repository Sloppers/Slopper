import { AnalysisResult, AuthorProfile, FileInfo } from './types'

/** File path patterns that indicate CI/CD infrastructure. */
const CI_PATTERNS = [
  '.github/workflows/',
  '.github/actions/',
  '.gitlab-ci',
  '.circleci/',
  '.travis.yml',
  'Jenkinsfile',
  'azure-pipelines'
]

/** Basenames of common dependency/lockfiles. */
const DEPENDENCY_FILES = new Set([
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'requirements.txt',
  'Pipfile.lock',
  'poetry.lock',
  'go.sum',
  'go.mod',
  'Cargo.lock',
  'Gemfile.lock',
  'composer.lock',
  'pubspec.lock'
])

/**
 * Deterministically computes PR labels from analysis results and file metadata.
 *
 * Labels are never suggested by the AI — they are computed by code from
 * the risk score, confidence level, changed file paths, and author metadata.
 * This ensures consistent, predictable labeling regardless of AI provider.
 */
export class LabelComputer {
  /**
   * Computes the full set of labels for a PR.
   * @param analysis - The AI analysis result.
   * @param files - List of changed files in the PR.
   * @param firstTimeContributor - Whether the author is a first-time contributor.
   * @returns Array of label names to apply.
   */
  compute(
    analysis: AnalysisResult,
    files: FileInfo[],
    firstTimeContributor: boolean
  ): string[] {
    const labels: string[] = []
    const score = analysis.risk_score

    labels.push(this.riskLabel(score))
    labels.push(`slopper/confidence/${analysis.confidence}`)

    if (score <= 2 && analysis.confidence === 'high') {
      labels.push('slopper/approved')
    }

    if (firstTimeContributor) {
      labels.push('slopper/first-time-contributor')
    }

    if (this.hasCiChanges(files)) {
      labels.push('slopper/ci-modified')
    }

    if (this.hasDependencyChanges(files)) {
      labels.push('slopper/dependencies-modified')
    }

    if (score >= 6) labels.push('slopper/needs-security-review')
    if (score >= 8) labels.push('slopper/suspicious')

    return labels
  }

  /**
   * Returns labels for a failed analysis.
   * @returns Array containing only the analysis-failed label.
   */
  computeFailedLabels(): string[] {
    return ['slopper/analysis-failed']
  }

  /**
   * Determines whether slopper should suggest vouching this author.
   *
   * Criteria (all must be true):
   * - Risk score is 0 (completely clean)
   * - Confidence is high
   * - AI assessed the author as "trusted"
   * - Author is a collaborator OR has 3+ previously merged PRs in this repo
   * - Author is not a bot
   *
   * @param analysis - The AI analysis result.
   * @param author - The PR author's profile.
   * @returns True if slopper should suggest vouching.
   */
  shouldSuggestVouch(analysis: AnalysisResult, author: AuthorProfile): boolean {
    if (analysis.risk_score !== 0) return false
    if (analysis.confidence !== 'high') return false
    if (analysis.author_assessment.trust_level !== 'trusted') return false
    if (author.is_bot) return false
    if (!author.is_collaborator && author.past_merged_prs_in_repo < 3) return false
    return true
  }

  /**
   * Maps a numeric risk score to the corresponding risk label.
   * @param score - Risk score (0-10).
   */
  private riskLabel(score: number): string {
    if (score <= 2) return 'slopper/risk/low'
    if (score <= 5) return 'slopper/risk/medium'
    if (score <= 8) return 'slopper/risk/high'
    return 'slopper/risk/critical'
  }

  /**
   * Checks if any changed files match CI/CD infrastructure patterns.
   * @param files - List of changed files.
   */
  private hasCiChanges(files: FileInfo[]): boolean {
    return files.some(f =>
      CI_PATTERNS.some(pattern => f.filename.includes(pattern))
    )
  }

  /**
   * Checks if any changed files are dependency/lockfiles.
   * @param files - List of changed files.
   */
  private hasDependencyChanges(files: FileInfo[]): boolean {
    return files.some(f => {
      const basename = f.filename.split('/').pop() ?? ''
      return DEPENDENCY_FILES.has(basename)
    })
  }
}
