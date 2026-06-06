import { AnalysisResult, AuthorProfile, FileInfo, PrData, AuthorProfileAnalysis, AiFingerprintResult } from '../core/types'
import { ThresholdsConfig, LabelThresholdsConfig, RulesConfig, ScoreWeightsConfig } from '../core/config'

const CI_PATTERNS = [
  '.github/workflows/',
  '.github/actions/',
  '.gitlab-ci',
  '.circleci/',
  '.travis.yml',
  'Jenkinsfile',
  'azure-pipelines'
]

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

export interface ComputeLabelsOptions {
  analysis?: AnalysisResult
  files: FileInfo[]
  firstTimeContributor: boolean
  prData?: PrData
  authorProfile?: AuthorProfileAnalysis
  aiFingerprint?: AiFingerprintResult
  riskyUser?: boolean
  trustedOrg?: boolean
}

export class LabelComputer {
  private readonly thresholds: ThresholdsConfig
  private readonly labelThresholds: LabelThresholdsConfig
  private readonly rules: RulesConfig

  constructor(
    thresholds?: ThresholdsConfig,
    rules?: RulesConfig,
    labelThresholds?: LabelThresholdsConfig
  ) {
    this.thresholds = thresholds ?? { low: 2, medium: 5, high: 8 }
    this.labelThresholds = labelThresholds ?? {
      ai_likely: 70,
      ai_possibly: 40,
      spray_score: 60,
      new_account_days: 30,
      activity_burst_prs: 10,
      activity_burst_days: 7,
      spray_weights: { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 },
      merge_ratio_suspect: 0.4,
      security_review_score: 6,
      suspicious_score: 8,
      score_weights: {
        fingerprint: 4, spray: 3, new_account: 1,
        low_merge_ratio: 1, risky_user: 1, trusted_org: -2
      }
    }
    this.rules = rules ?? {
      require_description: false,
      require_linked_issue: false,
      max_files_changed: 0,
      block_first_time_contributors: false
    }
  }

  compute(opts: ComputeLabelsOptions): string[] {
    const { analysis, files, firstTimeContributor, prData, authorProfile, aiFingerprint, riskyUser, trustedOrg } = opts
    const labels: string[] = []
    const score = analysis
      ? analysis.risk_score
      : LabelComputer.computeDeterministicScore({
          authorProfile, aiFingerprint, riskyUser, trustedOrg,
          weights: this.labelThresholds.score_weights
        })

    labels.push(this.riskLabel(score))

    if (analysis) {
      labels.push(`slopper/confidence/${analysis.confidence}`)
      if (score <= this.thresholds.low && analysis.confidence === 'high') {
        labels.push('slopper/approved')
      }
    } else {
      labels.push('slopper/mode/deterministic')
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

    if (score >= this.labelThresholds.security_review_score) labels.push('slopper/needs-security-review')
    if (score >= this.labelThresholds.suspicious_score) labels.push('slopper/suspicious')

    if (prData) {
      labels.push(...this.ruleLabels(prData))
    }

    if (authorProfile) {
      if (authorProfile.spray_score > this.labelThresholds.spray_score) labels.push('slopper/spray-and-pray')
      if ((authorProfile.prs_in_burst_window ?? authorProfile.prs_last_7d) > this.labelThresholds.activity_burst_prs) labels.push('slopper/activity-burst')
      if (authorProfile.account_age_days < this.labelThresholds.new_account_days) labels.push('slopper/new-account')
    }

    if (aiFingerprint) {
      if (aiFingerprint.score >= this.labelThresholds.ai_likely) labels.push('slopper/likely-ai-generated')
      else if (aiFingerprint.score >= this.labelThresholds.ai_possibly) labels.push('slopper/possibly-ai-generated')
    }

    if (riskyUser) labels.push('slopper/risky-user')
    if (trustedOrg) labels.push('slopper/trusted-org')

    return labels
  }

  static computeDeterministicScore(opts: {
    authorProfile?: AuthorProfileAnalysis
    aiFingerprint?: AiFingerprintResult
    riskyUser?: boolean
    trustedOrg?: boolean
    weights?: ScoreWeightsConfig
  }): number {
    const { authorProfile, aiFingerprint, riskyUser, trustedOrg, weights } = opts
    const w = weights ?? {
      fingerprint: 4, spray: 3, new_account: 1,
      low_merge_ratio: 1, risky_user: 1, trusted_org: -2
    }
    let score = 0
    if (aiFingerprint) score += (aiFingerprint.score / 100) * w.fingerprint
    if (authorProfile) {
      score += (authorProfile.spray_score / 100) * w.spray
      if (authorProfile.account_age_days < 30) score += w.new_account
      if (authorProfile.merge_ratio < 0.4) score += w.low_merge_ratio
    }
    if (riskyUser) score += w.risky_user
    if (trustedOrg) score += w.trusted_org
    return Math.max(0, Math.min(10, Math.round(score * 10) / 10))
  }

  computeFailedLabels(): string[] {
    return ['slopper/analysis-failed']
  }

  shouldSuggestVouch(analysis: AnalysisResult, author: AuthorProfile): boolean {
    if (analysis.risk_score !== 0) return false
    if (analysis.confidence !== 'high') return false
    if (analysis.author_assessment.trust_level !== 'trusted') return false
    if (author.is_bot) return false
    if (!author.is_collaborator && author.past_merged_prs_in_repo < 3) return false
    return true
  }

  private ruleLabels(prData: PrData): string[] {
    const labels: string[] = []

    if (this.rules.require_description && !prData.body.trim()) {
      labels.push('slopper/missing-description')
    }

    if (this.rules.require_linked_issue && !this.hasLinkedIssue(prData.body)) {
      labels.push('slopper/no-linked-issue')
    }

    if (this.rules.max_files_changed > 0 && prData.changed_files_count > this.rules.max_files_changed) {
      labels.push('slopper/too-many-files')
    }

    return labels
  }

  private hasLinkedIssue(body: string): boolean {
    return /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i.test(body) || /#\d+/.test(body)
  }

  private riskLabel(score: number): string {
    if (score <= this.thresholds.low) return 'slopper/risk/low'
    if (score <= this.thresholds.medium) return 'slopper/risk/medium'
    if (score <= this.thresholds.high) return 'slopper/risk/high'
    return 'slopper/risk/critical'
  }

  private hasCiChanges(files: FileInfo[]): boolean {
    return files.some(f =>
      CI_PATTERNS.some(pattern => f.filename.includes(pattern))
    )
  }

  private hasDependencyChanges(files: FileInfo[]): boolean {
    return files.some(f => {
      const basename = f.filename.split('/').pop() ?? ''
      return DEPENDENCY_FILES.has(basename)
    })
  }
}
