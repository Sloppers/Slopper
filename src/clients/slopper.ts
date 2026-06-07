import { parseTextList } from '../core/utils'

const BASE_URL = 'https://raw.githubusercontent.com/Sloppers/community-list/main'

export class SlopperClient {
  async fetchRiskyUsers(): Promise<string[]> {
    return this.fetchList('risky_users.txt')
  }

  async fetchTrustedOrgs(): Promise<string[]> {
    return this.fetchList('trusted_orgs.txt')
  }

  private async fetchList(filename: string): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/${filename}`)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${filename}`)
    }
    return parseTextList(await res.text())
  }
}
