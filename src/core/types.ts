export interface AuthorProfile {
  login: string
  created_at: string
  public_repos: number
  followers: number
  following: number
  bio: string
  company: string
  is_bot: boolean
  is_collaborator: boolean
  past_merged_prs_in_repo: number
  past_issues_in_repo: number
  first_time_contributor: boolean
}

export interface CommitSummary {
  count: number
  messages: string[]
  unsigned_count: number
  author_committer_mismatches: number
}

export interface FileInfo {
  filename: string
  status: string
  additions: number
  deletions: number
  is_binary: boolean
}

export interface PrData {
  repo: string
  pr_number: number
  title: string
  body: string
  base_branch: string
  head_branch: string
  changed_files_count: number
  additions: number
  deletions: number
  author: AuthorProfile
  commits: CommitSummary
  files: FileInfo[]
  diff: string
}

export interface SuspiciousPattern {
  file: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AnalysisResult {
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical' | 'unknown'
  confidence: 'low' | 'medium' | 'high'
  summary: string
  author_assessment: {
    trust_level: string
    reasoning: string
  }
  commit_assessment: {
    quality: string
    reasoning: string
  }
  code_assessment: {
    categories_flagged: string[]
    reasoning: string
    suspicious_patterns: SuspiciousPattern[]
  }
  behavioral_signals: {
    flags: string[]
    reasoning: string
  }
  review_suggestions: string[]
  provider?: string
  pr_number?: number
  repo?: string
  error?: string
}

export interface AuthorProfileAnalysis {
  account_age_days: number
  is_new_account: boolean
  prs_last_7d: number
  prs_last_30d: number
  prs_in_burst_window: number
  burst_window_days: number
  distinct_repos_30d: number
  merge_ratio: number
  total_stars: number
  total_issues: number
  spray_score: number
  activity_burst: boolean
}

export interface AiFingerprintSignal {
  name: string
  score: number
  detail: string
}

export interface AiFingerprintResult {
  score: number
  signals: AiFingerprintSignal[]
}
