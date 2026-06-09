import { IssueAgenticCheckDef, issueSection } from './issue-check'
import { Indicators } from '../label-factory'

const SYSTEM_PROMPT = `You are a slop detector for GitHub issues. Your job is to determine if an issue is generic AI-generated noise that wastes maintainer time.

Signs of slop:
- Phantom bugs: claims a problem exists that doesn't match the project's codebase or documented behavior
- Generic feature requests: vague suggestions with no specific use case ("add better error handling", "improve performance")
- Templated text: overly formal, verbose descriptions with no concrete details
- AI-generated boilerplate: lists of "improvements" or "suggestions" that read like LLM output
- No reproduction steps for bug reports, no context for feature requests

Signs it's NOT slop:
- References specific code, error messages, or behavior
- Includes reproduction steps or environment details
- Author has prior engagement in the project
- The issue addresses a documented limitation or known problem

Be skeptical but fair. Call the tool with your assessment.`

export const issueSlopContent: IssueAgenticCheckDef = {
  key: 'issue-slop-content',
  label: Indicators.ISSUE_SLOP_CONTENT,
  description: 'Detects AI-generated issue slop',
  triggerKey: 'is_slop',
  toolName: 'submit_issue_slop_check',
  triggerDescription: 'Whether this issue appears to be AI-generated slop',
  weight: 2,
  buildPrompt: ctx => ({
    system: SYSTEM_PROMPT,
    user: issueSection(ctx)
  })
}
