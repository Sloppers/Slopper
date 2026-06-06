import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

const MIN_BLOCK_LINES = 6
const MIN_DUPLICATE_BLOCKS = 2

export class CodeDuplicationCheck extends Check {
  readonly label = Labels.CODE_DUPLICATION.name

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.prData) return false
    const addedBlocks = extractAddedBlocks(ctx.prData.diff)
    if (addedBlocks.length < MIN_DUPLICATE_BLOCKS) return false
    return hasDuplicates(addedBlocks)
  }
}

function extractAddedBlocks(diff: string): string[] {
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
    if (current.length >= MIN_BLOCK_LINES) {
      blocks.push(current.join('\n'))
    }
    current = []
  }
  if (current.length >= MIN_BLOCK_LINES) {
    blocks.push(current.join('\n'))
  }

  return blocks
}

function hasDuplicates(blocks: string[]): boolean {
  const seen = new Set<string>()
  for (const block of blocks) {
    if (seen.has(block)) return true
    seen.add(block)
  }
  return false
}
