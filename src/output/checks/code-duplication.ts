import { CheckDef, CheckContext } from './check'
import { Indicators } from '../label-factory'

function extractAddedBlocks(diff: string, minLines: number): string[] {
  const blocks: string[] = []
  let current: string[] = []

  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1).trim()
      if (content.length > 0) {
        current.push(content)
        continue
      }
    }
    if (current.length >= minLines) {
      blocks.push(current.join('\n'))
    }
    current = []
  }
  if (current.length >= minLines) {
    blocks.push(current.join('\n'))
  }
  return blocks
}

function evaluate(ctx: CheckContext): boolean {
  if (!ctx.prData) return false
  const minLines = ctx.patterns.min_duplicate_lines
  const blocks = extractAddedBlocks(ctx.prData.diff, minLines)
  if (blocks.length < ctx.patterns.min_duplicate_blocks) return false
  const seen = new Set<string>()
  for (const block of blocks) {
    if (seen.has(block)) return true
    seen.add(block)
  }
  return false
}

export const codeDuplication: CheckDef = {
  label: Indicators.CODE_DUPLICATION,
  weight: 1,
  evaluate
}
