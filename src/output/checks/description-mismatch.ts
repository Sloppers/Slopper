import { AgenticCheckDef, prHeader, prDescription, filesList, diffBlock } from './check'
import { Indicators } from '../label-factory'

const SYSTEM_PROMPT = `You are a PR description auditor. Your job is to determine if a pull request's title and description accurately reflect what the code diff actually does.

Flag a mismatch when:
- The description claims to fix something but the diff doesn't address it
- The description is vague/generic while the changes are specific (or vice versa)
- The description mentions features or changes not present in the diff
- The diff contains significant changes not mentioned in the description

Do NOT flag when:
- The description is simply brief but accurate
- Minor omissions of trivial details
- The PR has no description (that's a different check)

Call the tool with your assessment.`

export const descriptionMismatch: AgenticCheckDef = {
  key: 'description-mismatch',
  label: Indicators.AI_DESCRIPTION_MISMATCH,
  description: 'Detects PR description/diff mismatch',
  triggerKey: 'has_mismatch',
  toolName: 'submit_mismatch_check',
  triggerDescription: 'Whether the description misrepresents the actual changes',
  weight: 1,
  buildPrompt: ctx => ({
    system: SYSTEM_PROMPT,
    user: [prHeader(ctx), prDescription(ctx), filesList(ctx), diffBlock(ctx, 8000)].join('\n\n')
  })
}
