import { IssueCheckContext, buildIssueCheckContext } from '../src/output/checks/issue-check'
import { IssueData, AuthorProfileAnalysis } from '../src/core/types'
import { allIssueChecks } from '../src/output/checks/issue-registry'
import { issueMissingDescription } from '../src/output/checks/issue-missing-description'
import { issueLowEffort } from '../src/output/checks/issue-low-effort'
import { issueDuplicate } from '../src/output/checks/issue-duplicate'
import { issueNewAccount } from '../src/output/checks/issue-new-account'

function makeIssueData(overrides: Partial<IssueData> = {}): IssueData {
  return {
    repo: 'test/repo',
    issue_number: 1,
    title: 'Test issue',
    body: 'This is a detailed description of the issue with reproduction steps and expected behavior.',
    author: {
      login: 'testuser',
      created_at: '2020-01-01T00:00:00Z',
      public_repos: 10,
      followers: 5,
      following: 3,
      bio: 'Developer',
      company: 'TestCo',
      is_bot: false,
      is_collaborator: false,
      past_merged_prs_in_repo: 5,
      past_issues_in_repo: 3,
      first_time_contributor: false
    },
    labels: [],
    comments_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    is_pull_request: false,
    ...overrides
  }
}

function makeProfile(overrides: Partial<AuthorProfileAnalysis> = {}): AuthorProfileAnalysis {
  return {
    account_age_days: 365,
    is_new_account: false,
    prs_last_7d: 2,
    prs_last_30d: 5,
    prs_in_burst_window: 2,
    burst_window_days: 7,
    distinct_repos_30d: 2,
    merge_ratio: 0.8,
    total_stars: 10,
    total_issues: 10,
    spray_score: 20,
    activity_burst: false,
    ...overrides
  }
}

function makeCtx(overrides: Partial<Parameters<typeof buildIssueCheckContext>[0]> = {}): IssueCheckContext {
  return buildIssueCheckContext({
    issueData: makeIssueData(),
    authorProfile: makeProfile(),
    ...overrides
  })
}

describe('Issue checks', () => {
  describe('registry', () => {
    it('loads all issue checks', () => {
      const checks = allIssueChecks()
      expect(checks.length).toBeGreaterThanOrEqual(10)
    })

    it('each check has required fields', () => {
      for (const check of allIssueChecks()) {
        expect(check.label).toBeTruthy()
        expect(typeof check.weight).toBe('number')
        expect(typeof check.evaluate).toBe('function')
      }
    })
  })

  describe('missing-description', () => {
    it('triggers for empty body', () => {
      const ctx = makeCtx({ issueData: makeIssueData({ body: '' }) })
      expect(issueMissingDescription.evaluate(ctx)).toBe(true)
    })

    it('triggers for short body', () => {
      const ctx = makeCtx({ issueData: makeIssueData({ body: 'too short' }) })
      expect(issueMissingDescription.evaluate(ctx)).toBe(true)
    })

    it('passes for sufficient body', () => {
      const ctx = makeCtx({ issueData: makeIssueData({ body: 'A detailed description of the issue that is longer than the minimum threshold.' }) })
      expect(issueMissingDescription.evaluate(ctx)).toBe(false)
    })
  })

  describe('low-effort', () => {
    it('triggers for single-line short body', () => {
      const ctx = makeCtx({ issueData: makeIssueData({ body: 'This is broken.' }) })
      expect(issueLowEffort.evaluate(ctx)).toBe(true)
    })

    it('triggers for "please fix" pattern', () => {
      const ctx = makeCtx({ issueData: makeIssueData({ body: 'Please fix this bug' }) })
      expect(issueLowEffort.evaluate(ctx)).toBe(true)
    })

    it('passes for detailed body', () => {
      const ctx = makeCtx({
        issueData: makeIssueData({
          body: 'When I run the command `npm test`, I get the following error:\n\n```\nError: Cannot find module\n```\n\nExpected behavior: tests should pass.\n\nEnvironment: Node 18, macOS 14.'
        })
      })
      expect(issueLowEffort.evaluate(ctx)).toBe(false)
    })

    it('does not trigger for empty body', () => {
      const ctx = makeCtx({ issueData: makeIssueData({ body: '' }) })
      expect(issueLowEffort.evaluate(ctx)).toBe(false)
    })
  })

  describe('new-account', () => {
    it('triggers for new accounts', () => {
      const ctx = makeCtx({ authorProfile: makeProfile({ account_age_days: 5 }) })
      expect(issueNewAccount.evaluate(ctx)).toBe(true)
    })

    it('passes for established accounts', () => {
      const ctx = makeCtx({ authorProfile: makeProfile({ account_age_days: 365 }) })
      expect(issueNewAccount.evaluate(ctx)).toBe(false)
    })
  })

  describe('duplicate', () => {
    it('triggers when similar issue exists', () => {
      const issue = makeIssueData({ title: 'Submit button does not work on mobile Safari', body: 'The submit button does not work when I click it on mobile Safari browser' })
      const similar = makeIssueData({ issue_number: 2, title: 'Submit button does not work on mobile Safari', body: 'The submit button does not work when I click it on mobile Safari browser page' })
      const ctx = makeCtx({ issueData: issue, recentIssues: [similar] })
      expect(issueDuplicate.evaluate(ctx)).toBe(true)
    })

    it('passes when no similar issues', () => {
      const issue = makeIssueData({ title: 'Add dark mode support', body: 'Please add dark mode theme support to the app.' })
      const different = makeIssueData({ issue_number: 2, title: 'Fix login page redirect', body: 'After logging in, the user is redirected to the wrong page.' })
      const ctx = makeCtx({ issueData: issue, recentIssues: [different] })
      expect(issueDuplicate.evaluate(ctx)).toBe(false)
    })

    it('passes when no recent issues', () => {
      const ctx = makeCtx({ recentIssues: [] })
      expect(issueDuplicate.evaluate(ctx)).toBe(false)
    })
  })
})
