import { parseTextList } from '../core/utils'

const BASE_URL = 'https://raw.githubusercontent.com/malvads/slopper/main'

export class SlopperClient {
  async fetchRiskyUsers(): Promise<string[]> {
    return this.fetchList('.slopper_risky_users')
  }

  async fetchTrustedOrgs(): Promise<string[]> {
    return this.fetchList('.slopper_trusted_orgs')
  }

  private async fetchList(filename: string): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/${filename}`)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${filename}`)
    }
    return parseTextList(await res.text())
  }
}
