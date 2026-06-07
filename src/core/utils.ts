export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function buildMetadataEntry(fields: Record<string, string>): string {
  return Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n') + '\n'
}

export function parseTextList(raw: string): string[] {
  return raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
}

export function truncateDiff(diff: string, maxLength: number): string {
  if (diff.length <= maxLength) return diff
  return diff.slice(0, maxLength) + '\n... (truncated)'
}
