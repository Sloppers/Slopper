import { LabelComputer } from '../src/output/labels'
import { AnalysisResult, AuthorProfile, FileInfo, PrData } from '../src/core/types'

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    risk_score: 1,
    risk_level: 'low',
    confidence: 'high',
    summary: 'Test summary',
    author_assessment: { trust_level: 'trusted', reasoning: 'test' },
    commit_assessment: { quality: 'good', reasoning: 'test' },
    code_assessment: { categories_flagged: ['none'], reasoning: 'test', suspicious_patterns: [] },
    behavioral_signals: { flags: [], reasoning: 'test' },
    review_suggestions: [],
    ...overrides
  }
}

function makeFile(filename: string): FileInfo {
  return { filename, status: 'modified', additions: 10, deletions: 5, is_binary: false }
}

function computeLabels(computer: LabelComputer, result: AnalysisResult, files: FileInfo[] = [], firstTime = false, prData?: PrData) {
  return computer.compute({ analysis: result, files, firstTimeContributor: firstTime, prData })
}

function computeIndicators(computer: LabelComputer, result: AnalysisResult, files: FileInfo[] = [], firstTime = false, prData?: PrData) {
  return computer.computeIndicators({ analysis: result, files, firstTimeContributor: firstTime, prData })
}

describe('LabelComputer', () => {
  const computer = new LabelComputer()

  describe('verdict labels', () => {
    it('assigns slopper/legit for low scores', () => {
      const labels = computeLabels(computer, makeResult({ risk_score: 0 }))
      expect(labels).toEqual(['slopper/legit'])
    })

    it('assigns slopper/legit for scores below medium threshold', () => {
      const labels = computeLabels(computer, makeResult({ risk_score: 4 }))
      expect(labels).toEqual(['slopper/legit'])
    })

    it('assigns slopper/slop for scores at medium threshold', () => {
      const labels = computeLabels(computer, makeResult({ risk_score: 5 }))
      expect(labels).toEqual(['slopper/slop'])
    })

    it('assigns slopper/slop for high scores', () => {
      const labels = computeLabels(computer, makeResult({ risk_score: 9 }))
      expect(labels).toEqual(['slopper/slop'])
    })
  })

  describe('risk indicators', () => {
    it('includes slopper/risk/low for scores 0-2', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 0 }))
      expect(indicators).toContain('slopper/risk/low')
    })

    it('includes slopper/risk/medium for scores 3-5', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 4 }))
      expect(indicators).toContain('slopper/risk/medium')
    })

    it('includes slopper/risk/high for scores 6-8', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 7 }))
      expect(indicators).toContain('slopper/risk/high')
    })

    it('includes slopper/risk/critical for scores 9-10', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 9 }))
      expect(indicators).toContain('slopper/risk/critical')
    })
  })

  describe('confidence indicators', () => {
    it('includes slopper/confidence/high', () => {
      const indicators = computeIndicators(computer, makeResult({ confidence: 'high' }))
      expect(indicators).toContain('slopper/confidence/high')
    })

    it('includes slopper/confidence/medium', () => {
      const indicators = computeIndicators(computer, makeResult({ confidence: 'medium' }))
      expect(indicators).toContain('slopper/confidence/medium')
    })

    it('includes slopper/confidence/low', () => {
      const indicators = computeIndicators(computer, makeResult({ confidence: 'low' }))
      expect(indicators).toContain('slopper/confidence/low')
    })
  })

  describe('approved indicator', () => {
    it('includes slopper/approved when score <= 2 and confidence is high', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 1, confidence: 'high' }))
      expect(indicators).toContain('slopper/approved')
    })

    it('does not include slopper/approved when score > 2', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 3, confidence: 'high' }))
      expect(indicators).not.toContain('slopper/approved')
    })
  })

  describe('first-time contributor indicator', () => {
    it('includes slopper/first-time-contributor when true', () => {
      const indicators = computeIndicators(computer, makeResult(), [], true)
      expect(indicators).toContain('slopper/first-time-contributor')
    })

    it('does not include when false', () => {
      const indicators = computeIndicators(computer, makeResult(), [], false)
      expect(indicators).not.toContain('slopper/first-time-contributor')
    })
  })

  describe('CI/dependency file indicators', () => {
    it('detects .github/workflows/ changes', () => {
      const files = [makeFile('.github/workflows/ci.yml')]
      const indicators = computeIndicators(computer, makeResult(), files)
      expect(indicators).toContain('slopper/ci-modified')
    })

    it('detects Jenkinsfile changes', () => {
      const files = [makeFile('Jenkinsfile')]
      const indicators = computeIndicators(computer, makeResult(), files)
      expect(indicators).toContain('slopper/ci-modified')
    })

    it('does not flag non-CI files', () => {
      const files = [makeFile('src/index.ts')]
      const indicators = computeIndicators(computer, makeResult(), files)
      expect(indicators).not.toContain('slopper/ci-modified')
    })

    it('detects package.json changes', () => {
      const files = [makeFile('package.json')]
      const indicators = computeIndicators(computer, makeResult(), files)
      expect(indicators).toContain('slopper/dependencies-modified')
    })

    it('detects nested dependency files', () => {
      const files = [makeFile('services/api/requirements.txt')]
      const indicators = computeIndicators(computer, makeResult(), files)
      expect(indicators).toContain('slopper/dependencies-modified')
    })

    it('does not flag non-dependency files', () => {
      const files = [makeFile('src/utils.ts')]
      const indicators = computeIndicators(computer, makeResult(), files)
      expect(indicators).not.toContain('slopper/dependencies-modified')
    })
  })

  describe('security review indicators', () => {
    it('includes needs-security-review at score >= 6', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 6 }))
      expect(indicators).toContain('slopper/needs-security-review')
    })

    it('does not include needs-security-review below 6', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 5 }))
      expect(indicators).not.toContain('slopper/needs-security-review')
    })

    it('includes suspicious at score >= 8', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 8 }))
      expect(indicators).toContain('slopper/suspicious')
    })

    it('does not include suspicious below 8', () => {
      const indicators = computeIndicators(computer, makeResult({ risk_score: 7 }))
      expect(indicators).not.toContain('slopper/suspicious')
    })
  })

  describe('failure labels', () => {
    it('returns only analysis-failed', () => {
      const labels = computer.computeFailedLabels()
      expect(labels).toEqual(['slopper/analysis-failed'])
    })
  })

  describe('combined scenarios', () => {
    it('high-risk PR gets slopper/slop label', () => {
      const result = makeResult({ risk_score: 9, confidence: 'high' })
      const labels = computeLabels(computer, result, [], true)
      expect(labels).toEqual(['slopper/slop'])
    })

    it('high-risk PR gets all relevant indicators', () => {
      const files = [
        makeFile('.github/workflows/deploy.yml'),
        makeFile('package.json'),
        makeFile('src/hack.ts')
      ]
      const result = makeResult({ risk_score: 9, confidence: 'high' })
      const indicators = computeIndicators(computer, result, files, true)

      expect(indicators).toContain('slopper/risk/critical')
      expect(indicators).toContain('slopper/confidence/high')
      expect(indicators).toContain('slopper/first-time-contributor')
      expect(indicators).toContain('slopper/ci-modified')
      expect(indicators).toContain('slopper/dependencies-modified')
      expect(indicators).toContain('slopper/needs-security-review')
      expect(indicators).toContain('slopper/suspicious')
      expect(indicators).not.toContain('slopper/approved')
    })

    it('clean PR gets slopper/legit and minimal indicators', () => {
      const files = [makeFile('src/feature.ts'), makeFile('src/__tests__/feature.test.ts')]
      const result = makeResult({ risk_score: 0, confidence: 'high' })
      const labels = computeLabels(computer, result, files)
      const indicators = computeIndicators(computer, result, files)

      expect(labels).toEqual(['slopper/legit'])
      expect(indicators).toEqual([
        'slopper/risk/low',
        'slopper/confidence/high',
        'slopper/approved'
      ])
    })
  })

  describe('shouldSuggestVouch', () => {
    function makeAuthor(overrides: Partial<AuthorProfile> = {}): AuthorProfile {
      return {
        login: 'trusted-dev',
        created_at: '2020-01-01T00:00:00Z',
        public_repos: 50,
        followers: 100,
        following: 20,
        bio: 'Senior dev',
        company: 'ACME',
        is_bot: false,
        is_collaborator: true,
        past_merged_prs_in_repo: 10,
        past_issues_in_repo: 5,
        first_time_contributor: false,
        ...overrides
      }
    }

    const trustedResult = makeResult({
      risk_score: 0,
      confidence: 'high',
      author_assessment: { trust_level: 'trusted', reasoning: 'Long history' }
    })

    it('suggests vouch for a perfect score + collaborator', () => {
      expect(computer.shouldSuggestVouch(trustedResult, makeAuthor())).toBe(true)
    })

    it('suggests vouch for non-collaborator with 3+ merged PRs', () => {
      const author = makeAuthor({ is_collaborator: false, past_merged_prs_in_repo: 5 })
      expect(computer.shouldSuggestVouch(trustedResult, author)).toBe(true)
    })

    it('does not suggest when risk score > 0', () => {
      const result = makeResult({
        risk_score: 1,
        confidence: 'high',
        author_assessment: { trust_level: 'trusted', reasoning: 'ok' }
      })
      expect(computer.shouldSuggestVouch(result, makeAuthor())).toBe(false)
    })

    it('does not suggest when confidence is not high', () => {
      const result = makeResult({
        risk_score: 0,
        confidence: 'medium',
        author_assessment: { trust_level: 'trusted', reasoning: 'ok' }
      })
      expect(computer.shouldSuggestVouch(result, makeAuthor())).toBe(false)
    })

    it('does not suggest when author trust level is not trusted', () => {
      const result = makeResult({
        risk_score: 0,
        confidence: 'high',
        author_assessment: { trust_level: 'neutral', reasoning: 'ok' }
      })
      expect(computer.shouldSuggestVouch(result, makeAuthor())).toBe(false)
    })

    it('does not suggest for bots', () => {
      const author = makeAuthor({ is_bot: true })
      expect(computer.shouldSuggestVouch(trustedResult, author)).toBe(false)
    })

    it('does not suggest for non-collaborator with < 3 merged PRs', () => {
      const author = makeAuthor({ is_collaborator: false, past_merged_prs_in_repo: 2 })
      expect(computer.shouldSuggestVouch(trustedResult, author)).toBe(false)
    })
  })

  describe('custom thresholds', () => {
    const custom = new LabelComputer({ thresholds: { low: 3, medium: 6, high: 9 } })

    it('uses custom medium threshold for slop/legit', () => {
      expect(computeLabels(custom, makeResult({ risk_score: 5 }))).toEqual(['slopper/legit'])
      expect(computeLabels(custom, makeResult({ risk_score: 6 }))).toEqual(['slopper/slop'])
    })

    it('uses custom thresholds for risk indicators', () => {
      const indicators = computeIndicators(custom, makeResult({ risk_score: 3 }))
      expect(indicators).toContain('slopper/risk/low')
    })
  })

  describe('rule-based indicators', () => {
    function makePrData(overrides: Partial<PrData> = {}): PrData {
      return {
        repo: 'owner/repo',
        pr_number: 1,
        title: 'Test PR',
        body: 'Fixes #42',
        base_branch: 'main',
        head_branch: 'feature',
        changed_files_count: 3,
        additions: 100,
        deletions: 50,
        author: {
          login: 'dev', created_at: '2020-01-01T00:00:00Z', public_repos: 10,
          followers: 5, following: 5, bio: '', company: '', is_bot: false,
          is_collaborator: true, past_merged_prs_in_repo: 5,
          past_issues_in_repo: 2, first_time_contributor: false
        },
        commits: { count: 1, messages: ['fix bug'], unsigned_count: 0, author_committer_mismatches: 0 },
        files: [makeFile('src/index.ts')],
        diff: 'diff content',
        ...overrides
      }
    }

    const withRules = new LabelComputer({
      rules: {
        require_description: true,
        require_linked_issue: true,
        max_files_changed: 10,
        max_total_changes: 1500,
        max_file_changes: 800,
        block_first_time_contributors: false
      }
    })

    it('includes missing-description indicator when body is empty', () => {
      const prData = makePrData({ body: '' })
      const indicators = computeIndicators(withRules, makeResult(), [], false, prData)
      expect(indicators).toContain('slopper/missing-description')
    })

    it('does not include missing-description when body has content', () => {
      const prData = makePrData({ body: 'This PR adds a feature' })
      const indicators = computeIndicators(withRules, makeResult(), [], false, prData)
      expect(indicators).not.toContain('slopper/missing-description')
    })

    it('includes no-linked-issue when body has no issue reference', () => {
      const prData = makePrData({ body: 'Just some changes with no issue ref' })
      const indicators = computeIndicators(withRules, makeResult(), [], false, prData)
      expect(indicators).toContain('slopper/no-linked-issue')
    })

    it('includes too-many-files when changed_files_count exceeds max', () => {
      const prData = makePrData({ changed_files_count: 15 })
      const indicators = computeIndicators(withRules, makeResult(), [], false, prData)
      expect(indicators).toContain('slopper/too-many-files')
    })

    it('does not include rule indicators when rules are disabled', () => {
      const noRules = new LabelComputer()
      const prData = makePrData({ body: '', changed_files_count: 100 })
      const indicators = computeIndicators(noRules, makeResult(), [], false, prData)
      expect(indicators).not.toContain('slopper/missing-description')
      expect(indicators).not.toContain('slopper/too-many-files')
    })
  })

  describe('author profile indicators', () => {
    it('includes spray-and-pray when spray_score > 60', () => {
      const indicators = computer.computeIndicators({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        authorProfile: {
          account_age_days: 365, is_new_account: false, prs_last_7d: 5,
          prs_last_30d: 30, prs_in_burst_window: 5, burst_window_days: 7,
          distinct_repos_30d: 25, merge_ratio: 0.3,
          total_stars: 10, total_issues: 5, spray_score: 75, activity_burst: false
        }
      })
      expect(indicators).toContain('slopper/spray-and-pray')
    })

    it('includes new-account for accounts < 30 days', () => {
      const indicators = computer.computeIndicators({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        authorProfile: {
          account_age_days: 15, is_new_account: true, prs_last_7d: 2,
          prs_last_30d: 5, prs_in_burst_window: 2, burst_window_days: 7,
          distinct_repos_30d: 3, merge_ratio: 0.5,
          total_stars: 0, total_issues: 0, spray_score: 20, activity_burst: false
        }
      })
      expect(indicators).toContain('slopper/new-account')
    })

    it('includes activity-burst when > 10 PRs in 7d', () => {
      const indicators = computer.computeIndicators({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        authorProfile: {
          account_age_days: 365, is_new_account: false, prs_last_7d: 15,
          prs_last_30d: 20, prs_in_burst_window: 15, burst_window_days: 7,
          distinct_repos_30d: 5, merge_ratio: 0.8,
          total_stars: 50, total_issues: 10, spray_score: 30, activity_burst: true
        }
      })
      expect(indicators).toContain('slopper/activity-burst')
    })
  })

})
