import { ConfigLoader } from '../src/core/config'

jest.mock('@actions/core', () => ({
  info: jest.fn()
}))

function makeMockGitHub(fileContent: string | null) {
  return {
    getFileContent: jest.fn().mockImplementation(async () => fileContent),
    listDirectory: jest.fn().mockImplementation(async () => [])
  } as any
}

describe('ConfigLoader', () => {
  describe('plain text format (legacy)', () => {
    it('parses newline-separated usernames', async () => {
      const gh = makeMockGitHub('alice\nbob\ncharlie')
      const loader = new ConfigLoader(gh)
      const config = await loader.load()

      expect(config.vouched).toEqual(['alice', 'bob', 'charlie'])
      expect(config.actions.auto_close.enabled).toBe(false)
    })

    it('ignores comments and blank lines', async () => {
      const gh = makeMockGitHub('# trusted users\nalice\n\n# bots\ndependabot[bot]\n')
      const loader = new ConfigLoader(gh)
      const config = await loader.load()

      expect(config.vouched).toEqual(['alice', 'dependabot[bot]'])
    })
  })

  describe('YAML format', () => {
    it('parses full YAML config', async () => {
      const yaml = `
vouched:
  - alice
  - bob

banned:
  - slop-bot

actions:
  auto_close:
    enabled: true
    threshold: 8
    comment: "Closed by Slopper"
  auto_approve:
    enabled: true
    threshold: 1
  auto_request_review:
    enabled: true
    threshold: 5
    reviewers:
      - reviewer1

thresholds:
  low: 3
  medium: 6
  high: 9

ignore_paths:
  - "*.md"
  - "docs/**"

rules:
  require_description: true
  require_linked_issue: true
  max_files_changed: 50
  block_first_time_contributors: true
`
      const gh = makeMockGitHub(yaml)
      const loader = new ConfigLoader(gh)
      const config = await loader.load()

      expect(config.vouched).toEqual(['alice', 'bob'])
      expect(config.banned).toEqual(['slop-bot'])
      expect(config.actions.auto_close.enabled).toBe(true)
      expect(config.actions.auto_close.threshold).toBe(8)
      expect(config.actions.auto_close.comment).toBe('Closed by Slopper')
      expect(config.actions.auto_approve.enabled).toBe(true)
      expect(config.actions.auto_approve.threshold).toBe(1)
      expect(config.actions.auto_request_review.reviewers).toEqual(['reviewer1'])
      expect(config.thresholds).toEqual({ low: 3, medium: 6, high: 9 })
      expect(config.ignore_paths).toEqual(['*.md', 'docs/**'])
      expect(config.rules.require_description).toBe(true)
      expect(config.rules.max_files_changed).toBe(50)
      expect(config.rules.block_first_time_contributors).toBe(true)
      expect(config.label_thresholds).toEqual({
        spray_score: 60,
        new_account_days: 30, activity_burst_prs: 10, activity_burst_days: 7,
        spray_weights: { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 },
        merge_ratio_suspect: 0.4, security_review_score: 6, suspicious_score: 8,
        score_weights: {
          spray_and_pray: 3, supply_chain: 2, activity_burst: 2,
          new_account: 1, low_merge_ratio: 1, risky_user: 1, unsigned_commits: 1, no_tests: 1,
          first_time_contributor: 1, ci_modified: 1, dependencies_modified: 1, missing_description: 1,
          no_linked_issue: 1, too_many_files: 1, heavy_changes: 1, large_file: 1, code_duplication: 1,
          trusted_org: -2,
          verified_org: -1
        }
      })
    })

    it('parses custom label_thresholds', async () => {
      const yaml = `
vouched: []
label_thresholds:
  spray_score: 40
  new_account_days: 60
  activity_burst_prs: 5
  activity_burst_days: 14
  spray_weights:
    repos: 50
    volume: 25
    merge_ratio: 15
    account_age: 10
  merge_ratio_suspect: 0.3
  security_review_score: 7
  suspicious_score: 9
`
      const gh = makeMockGitHub(yaml)
      const loader = new ConfigLoader(gh)
      const config = await loader.load()

      expect(config.label_thresholds).toEqual({
        spray_score: 40,
        new_account_days: 60,
        activity_burst_prs: 5,
        activity_burst_days: 14,
        spray_weights: { repos: 50, volume: 25, merge_ratio: 15, account_age: 10 },
        merge_ratio_suspect: 0.3,
        security_review_score: 7,
        suspicious_score: 9,
        score_weights: {
          spray_and_pray: 3, supply_chain: 2, activity_burst: 2,
          new_account: 1, low_merge_ratio: 1, risky_user: 1, unsigned_commits: 1, no_tests: 1,
          first_time_contributor: 1, ci_modified: 1, dependencies_modified: 1, missing_description: 1,
          no_linked_issue: 1, too_many_files: 1, heavy_changes: 1, large_file: 1, code_duplication: 1,
          trusted_org: -2,
          verified_org: -1
        }
      })
    })

    it('fills missing fields with defaults', async () => {
      const yaml = `
vouched:
  - alice
actions:
  auto_close:
    enabled: true
`
      const gh = makeMockGitHub(yaml)
      const loader = new ConfigLoader(gh)
      const config = await loader.load()

      expect(config.vouched).toEqual(['alice'])
      expect(config.banned).toEqual([])
      expect(config.actions.auto_close.enabled).toBe(true)
      expect(config.actions.auto_close.threshold).toBe(9)
      expect(config.actions.auto_close.comment).toContain('critical risk score')
      expect(config.actions.auto_approve.enabled).toBe(false)
      expect(config.thresholds).toEqual({ low: 2, medium: 5, high: 8 })
      expect(config.ignore_paths).toEqual([])
      expect(config.rules.require_description).toBe(false)
      expect(config.label_thresholds.spray_score).toBe(60)
    })
  })

  describe('no .slopper file', () => {
    it('returns all defaults', async () => {
      const gh = makeMockGitHub(null)
      const loader = new ConfigLoader(gh)
      const config = await loader.load()

      expect(config.vouched).toEqual([])
      expect(config.banned).toEqual([])
      expect(config.actions.auto_close.enabled).toBe(false)
      expect(config.thresholds).toEqual({ low: 2, medium: 5, high: 8 })
      expect(config.ignore_paths).toEqual([])
      expect(config.rules.block_first_time_contributors).toBe(false)
      expect(config.label_thresholds).toEqual({
        spray_score: 60,
        new_account_days: 30, activity_burst_prs: 10, activity_burst_days: 7,
        spray_weights: { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 },
        merge_ratio_suspect: 0.4, security_review_score: 6, suspicious_score: 8,
        score_weights: {
          spray_and_pray: 3, supply_chain: 2, activity_burst: 2,
          new_account: 1, low_merge_ratio: 1, risky_user: 1, unsigned_commits: 1, no_tests: 1,
          first_time_contributor: 1, ci_modified: 1, dependencies_modified: 1, missing_description: 1,
          no_linked_issue: 1, too_many_files: 1, heavy_changes: 1, large_file: 1, code_duplication: 1,
          trusted_org: -2,
          verified_org: -1
        }
      })
    })
  })
})
