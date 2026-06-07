const API_BASE = 'https://api.github.com/repos/Sloppers/community-list/contents'

interface GitHubContentEntry {
  name: string
  type: string
}

export class SlopperClient {
  async fetchRiskyUsers(): Promise<string[]> {
    return this.fetchDirectory('risky_users')
  }

  async fetchTrustedOrgs(): Promise<string[]> {
    return this.fetchDirectory('trusted_orgs')
  }

  private async fetchDirectory(path: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/${path}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${path}`)
    }
    const entries = await res.json() as GitHubContentEntry[]
    return entries
      .filter(e => e.type === 'file' && !e.name.startsWith('.'))
      .map(e => e.name)
  }
}
