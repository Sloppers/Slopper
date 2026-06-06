import { LabelComputer } from '../src/labels'
import { AnalysisResult, AuthorProfile, FileInfo, PrData } from '../src/types'

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

function compute(computer: LabelComputer, result: AnalysisResult, files: FileInfo[] = [], firstTime = false, prData?: PrData) {
  return computer.compute({ analysis: result, files, firstTimeContributor: firstTime, prData })
}

describe('LabelComputer', () => {
  const computer = new LabelComputer()

  describe('risk labels', () => {
    it('assigns slopper/risk/low for scores 0-2', () => {
      const labels = compute(computer, makeResult({ risk_score: 0 }))
      expect(labels).toContain('slopper/risk/low')
    })

    it('assigns slopper/risk/low for score 2', () => {
      const labels = compute(computer, makeResult({ risk_score: 2 }))
      expect(labels).toContain('slopper/risk/low')
    })

    it('assigns slopper/risk/medium for scores 3-5', () => {
      const labels = compute(computer, makeResult({ risk_score: 4 }))
      expect(labels).toContain('slopper/risk/medium')
    })

    it('assigns slopper/risk/high for scores 6-8', () => {
      const labels = compute(computer, makeResult({ risk_score: 7 }))
      expect(labels).toContain('slopper/risk/high')
    })

    it('assigns slopper/risk/critical for scores 9-10', () => {
      const labels = compute(computer, makeResult({ risk_score: 9 }))
      expect(labels).toContain('slopper/risk/critical')
    })
  })

  describe('confidence labels', () => {
    it('assigns slopper/confidence/high', () => {
      const labels = compute(computer, makeResult({ confidence: 'high' }))
      expect(labels).toContain('slopper/confidence/high')
    })

    it('assigns slopper/confidence/medium', () => {
      const labels = compute(computer, makeResult({ confidence: 'medium' }))
      expect(labels).toContain('slopper/confidence/medium')
    })

    it('assigns slopper/confidence/low', () => {
      const labels = compute(computer, makeResult({ confidence: 'low' }))
      expect(labels).toContain('slopper/confidence/low')
    })
  })

  describe('approved label', () => {
    it('assigns slopper/approved when score <= 2 and confidence is high', () => {
      const labels = compute(computer, makeResult({ risk_score: 1, confidence: 'high' }))
      expect(labels).toContain('slopper/approved')
    })

    it('does not assign slopper/approved when score > 2', () => {
      const labels = compute(computer, makeResult({ risk_score: 3, confidence: 'high' }))
      expect(labels).not.toContain('slopper/approved')
    })

    it('does not assign slopper/approved when confidence is not high', () => {
      const labels = compute(computer, makeResult({ risk_score: 1, confidence: 'medium' }))
      expect(labels).not.toContain('slopper/approved')
    })
  })

  describe('first-time contributor', () => {
    it('assigns slopper/first-time-contributor when true', () => {
      const labels = compute(computer, makeResult(), [], true)
      expect(labels).toContain('slopper/first-time-contributor')
    })

    it('does not assign when false', () => {
      const labels = compute(computer, makeResult(), [], false)
      expect(labels).not.toContain('slopper/first-time-contributor')
    })
  })

  describe('CI/dependency file detection', () => {
    it('detects .github/workflows/ changes', () => {
      const files = [makeFile('.github/workflows/ci.yml')]
      const labels = compute(computer, makeResult(), files)
      expect(labels).toContain('slopper/ci-modified')
    })

    it('detects Jenkinsfile changes', () => {
      const files = [makeFile('Jenkinsfile')]
      const labels = compute(computer, makeResult(), files)
      expect(labels).toContain('slopper/ci-modified')
    })

    it('does not flag non-CI files', () => {
      const files = [makeFile('src/index.ts')]
      const labels = compute(computer, makeResult(), files)
      expect(labels).not.toContain('slopper/ci-modified')
    })

    it('detects package.json changes', () => {
      const files = [makeFile('package.json')]
      const labels = compute(computer, makeResult(), files)
      expect(labels).toContain('slopper/dependencies-modified')
    })

    it('detects nested dependency files', () => {
      const files = [makeFile('services/api/requirements.txt')]
      const labels = compute(computer, makeResult(), files)
      expect(labels).toContain('slopper/dependencies-modified')
    })

    it('does not flag non-dependency files', () => {
      const files = [makeFile('src/utils.ts')]
      const labels = compute(computer, makeResult(), files)
      expect(labels).not.toContain('slopper/dependencies-modified')
    })
  })

  describe('security review thresholds', () => {
    it('assigns needs-security-review at score >= 6', () => {
      const labels = compute(computer, makeResult({ risk_score: 6 }))
      expect(labels).toContain('slopper/needs-security-review')
    })

    it('does not assign needs-security-review below 6', () => {
      const labels = compute(computer, makeResult({ risk_score: 5 }))
      expect(labels).not.toContain('slopper/needs-security-review')
    })

    it('assigns suspicious at score >= 8', () => {
      const labels = compute(computer, makeResult({ risk_score: 8 }))
      expect(labels).toContain('slopper/suspicious')
    })

    it('does not assign suspicious below 8', () => {
      const labels = compute(computer, makeResult({ risk_score: 7 }))
      expect(labels).not.toContain('slopper/suspicious')
    })
  })

  describe('failure labels', () => {
    it('returns only analysis-failed', () => {
      const labels = computer.computeFailedLabels()
      expect(labels).toEqual(['slopper/analysis-failed'])
    })
  })

  describe('combined scenarios', () => {
    it('high-risk PR with CI and deps gets all relevant labels', () => {
      const files = [
        makeFile('.github/workflows/deploy.yml'),
        makeFile('package.json'),
        makeFile('src/hack.ts')
      ]
      const result = makeResult({ risk_score: 9, confidence: 'high' })
      const labels = compute(computer, result, files, true)

      expect(labels).toContain('slopper/risk/critical')
      expect(labels).toContain('slopper/confidence/high')
      expect(labels).toContain('slopper/first-time-contributor')
      expect(labels).toContain('slopper/ci-modified')
      expect(labels).toContain('slopper/dependencies-modified')
      expect(labels).toContain('slopper/needs-security-review')
      expect(labels).toContain('slopper/suspicious')
      expect(labels).not.toContain('slopper/approved')
    })

    it('clean PR from known contributor gets minimal labels', () => {
      const files = [makeFile('src/feature.ts')]
      const result = makeResult({ risk_score: 0, confidence: 'high' })
      const labels = compute(computer, result, files)

      expect(labels).toEqual([
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
    const custom = new LabelComputer({ low: 3, medium: 6, high: 9 })

    it('uses custom low threshold for risk label', () => {
      const labels = compute(custom, makeResult({ risk_score: 3 }))
      expect(labels).toContain('slopper/risk/low')
    })

    it('uses custom medium threshold', () => {
      const labels = compute(custom, makeResult({ risk_score: 6 }))
      expect(labels).toContain('slopper/risk/medium')
    })

    it('uses custom high threshold', () => {
      const labels = compute(custom, makeResult({ risk_score: 9 }))
      expect(labels).toContain('slopper/risk/high')
    })

    it('uses custom threshold for approved label', () => {
      const labels = compute(custom, makeResult({ risk_score: 3, confidence: 'high' }))
      expect(labels).toContain('slopper/approved')
    })
  })

  describe('rule-based labels', () => {
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

    const withRules = new LabelComputer(undefined, {
      require_description: true,
      require_linked_issue: true,
      max_files_changed: 10,
      block_first_time_contributors: false
    })

    it('adds missing-description label when body is empty', () => {
      const prData = makePrData({ body: '' })
      const labels = compute(withRules, makeResult(), [], false, prData)
      expect(labels).toContain('slopper/missing-description')
    })

    it('does not add missing-description when body has content', () => {
      const prData = makePrData({ body: 'This PR adds a feature' })
      const labels = compute(withRules, makeResult(), [], false, prData)
      expect(labels).not.toContain('slopper/missing-description')
    })

    it('adds no-linked-issue when body has no issue reference', () => {
      const prData = makePrData({ body: 'Just some changes with no issue ref' })
      const labels = compute(withRules, makeResult(), [], false, prData)
      expect(labels).toContain('slopper/no-linked-issue')
    })

    it('does not add no-linked-issue when body references an issue', () => {
      const prData = makePrData({ body: 'Fixes #123' })
      const labels = compute(withRules, makeResult(), [], false, prData)
      expect(labels).not.toContain('slopper/no-linked-issue')
    })

    it('adds too-many-files when changed_files_count exceeds max', () => {
      const prData = makePrData({ changed_files_count: 15 })
      const labels = compute(withRules, makeResult(), [], false, prData)
      expect(labels).toContain('slopper/too-many-files')
    })

    it('does not add too-many-files when within limit', () => {
      const prData = makePrData({ changed_files_count: 5 })
      const labels = compute(withRules, makeResult(), [], false, prData)
      expect(labels).not.toContain('slopper/too-many-files')
    })

    it('does not add rule labels when rules are disabled', () => {
      const noRules = new LabelComputer()
      const prData = makePrData({ body: '', changed_files_count: 100 })
      const labels = compute(noRules, makeResult(), [], false, prData)
      expect(labels).not.toContain('slopper/missing-description')
      expect(labels).not.toContain('slopper/too-many-files')
    })
  })

  describe('author profile labels', () => {
    it('adds spray-and-pray label when spray_score > 60', () => {
      const labels = computer.compute({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        authorProfile: {
          account_age_days: 365, is_new_account: false, prs_last_7d: 5,
          prs_last_30d: 30, distinct_repos_30d: 25, merge_ratio: 0.3,
          total_stars: 10, total_issues: 5, spray_score: 75, activity_burst: false
        }
      })
      expect(labels).toContain('slopper/spray-and-pray')
    })

    it('adds new-account label for accounts < 30 days', () => {
      const labels = computer.compute({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        authorProfile: {
          account_age_days: 15, is_new_account: true, prs_last_7d: 2,
          prs_last_30d: 5, distinct_repos_30d: 3, merge_ratio: 0.5,
          total_stars: 0, total_issues: 0, spray_score: 20, activity_burst: false
        }
      })
      expect(labels).toContain('slopper/new-account')
    })

    it('adds activity-burst label when > 10 PRs in 7d', () => {
      const labels = computer.compute({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        authorProfile: {
          account_age_days: 365, is_new_account: false, prs_last_7d: 15,
          prs_last_30d: 20, distinct_repos_30d: 5, merge_ratio: 0.8,
          total_stars: 50, total_issues: 10, spray_score: 30, activity_burst: true
        }
      })
      expect(labels).toContain('slopper/activity-burst')
    })
  })

  describe('AI fingerprint labels', () => {
    it('adds likely-ai-generated when score >= 70', () => {
      const labels = computer.compute({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        aiFingerprint: { score: 75, signals: [] }
      })
      expect(labels).toContain('slopper/likely-ai-generated')
    })

    it('adds possibly-ai-generated when score >= 40 and < 70', () => {
      const labels = computer.compute({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        aiFingerprint: { score: 50, signals: [] }
      })
      expect(labels).toContain('slopper/possibly-ai-generated')
      expect(labels).not.toContain('slopper/likely-ai-generated')
    })

    it('adds no fingerprint label when score < 40', () => {
      const labels = computer.compute({
        analysis: makeResult(),
        files: [],
        firstTimeContributor: false,
        aiFingerprint: { score: 20, signals: [] }
      })
      expect(labels).not.toContain('slopper/likely-ai-generated')
      expect(labels).not.toContain('slopper/possibly-ai-generated')
    })
  })
})
