import { jaccardSimilarity, findDuplicates } from '../src/output/checks/issue-duplicate'
import { IssueData } from '../src/core/types'

function makeIssueData(overrides: Partial<IssueData> = {}): IssueData {
  return {
    repo: 'test/repo',
    issue_number: 1,
    title: 'Test issue',
    body: 'Test body',
    author: {
      login: 'testuser',
      created_at: '2020-01-01T00:00:00Z',
      public_repos: 10,
      followers: 5,
      following: 3,
      bio: '',
      company: '',
      is_bot: false,
      is_collaborator: false,
      past_merged_prs_in_repo: 0,
      past_issues_in_repo: 0,
      first_time_contributor: true
    },
    labels: [],
    comments_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    is_pull_request: false,
    ...overrides
  }
}

describe('Jaccard similarity', () => {
  it('returns 0 for empty sets', () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(0)
  })

  it('returns 1 for identical sets', () => {
    const s = new Set(['hello', 'world', 'test'])
    expect(jaccardSimilarity(s, s)).toBe(1)
  })

  it('returns 0 for disjoint sets', () => {
    const a = new Set(['hello', 'world'])
    const b = new Set(['foo', 'bar'])
    expect(jaccardSimilarity(a, b)).toBe(0)
  })

  it('computes correct similarity for overlapping sets', () => {
    const a = new Set(['hello', 'world', 'test'])
    const b = new Set(['hello', 'world', 'other'])
    expect(jaccardSimilarity(a, b)).toBeCloseTo(0.5)
  })

  it('handles single-element overlap', () => {
    const a = new Set(['hello', 'world'])
    const b = new Set(['hello', 'bar'])
    expect(jaccardSimilarity(a, b)).toBeCloseTo(1 / 3)
  })
})

describe('findDuplicates', () => {
  it('returns empty for no candidates', () => {
    const issue = makeIssueData()
    expect(findDuplicates(issue, [], 0.7)).toEqual([])
  })

  it('finds duplicate issues above threshold', () => {
    const issue = makeIssueData({
      title: 'Login page crashes on submit button click',
      body: 'When I click the submit button on the login page the app crashes with an error'
    })
    const candidate = makeIssueData({
      issue_number: 2,
      title: 'Login page crashes on submit button click',
      body: 'When I click the submit button on the login page the app crashes with an error message'
    })
    const results = findDuplicates(issue, [candidate], 0.5)
    expect(results.length).toBe(1)
    expect(results[0].issue.issue_number).toBe(2)
    expect(results[0].similarity).toBeGreaterThan(0.5)
  })

  it('filters issues below threshold', () => {
    const issue = makeIssueData({
      title: 'Add dark mode',
      body: 'Please add dark mode theme support'
    })
    const candidate = makeIssueData({
      issue_number: 2,
      title: 'Fix CI pipeline timeout',
      body: 'The CI pipeline is timing out after 30 minutes on large test suites'
    })
    const results = findDuplicates(issue, [candidate], 0.5)
    expect(results.length).toBe(0)
  })

  it('excludes the same issue number', () => {
    const issue = makeIssueData({ issue_number: 5 })
    const same = makeIssueData({ issue_number: 5 })
    expect(findDuplicates(issue, [same], 0)).toEqual([])
  })

  it('sorts results by similarity descending', () => {
    const issue = makeIssueData({
      title: 'Button broken on mobile browser',
      body: 'The submit button does not respond to clicks on mobile Safari browser'
    })
    const highMatch = makeIssueData({
      issue_number: 2,
      title: 'Submit button broken on mobile Safari',
      body: 'The button does not respond to clicks on mobile Safari browser when tapping'
    })
    const lowMatch = makeIssueData({
      issue_number: 3,
      title: 'Mobile browser button issue',
      body: 'Something about a button on mobile that is somewhat related but different'
    })
    const results = findDuplicates(issue, [lowMatch, highMatch], 0.3)
    if (results.length >= 2) {
      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity)
    }
  })
})
