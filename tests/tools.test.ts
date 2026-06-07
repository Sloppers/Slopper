import { ANALYSIS_TOOL_NAME, ANALYSIS_JSON_SCHEMA } from '../src/ai/tools'

describe('Tool Schema', () => {
  it('has the correct tool name', () => {
    expect(ANALYSIS_TOOL_NAME).toBe('submit_analysis')
  })

  it('includes all required fields', () => {
    expect(ANALYSIS_JSON_SCHEMA.required).toEqual([
      'risk_score', 'risk_level', 'confidence', 'summary',
      'author_assessment', 'commit_assessment', 'code_assessment',
      'behavioral_signals', 'review_suggestions'
    ])
  })

  it('constrains risk_score to 0-10', () => {
    const riskScore = ANALYSIS_JSON_SCHEMA.properties.risk_score
    expect(riskScore.minimum).toBe(0)
    expect(riskScore.maximum).toBe(10)
  })

  it('constrains risk_level to valid enums', () => {
    const riskLevel = ANALYSIS_JSON_SCHEMA.properties.risk_level
    expect(riskLevel.enum).toEqual(['low', 'medium', 'high', 'critical'])
  })

  it('sets additionalProperties false on all nested objects', () => {
    expect(ANALYSIS_JSON_SCHEMA.additionalProperties).toBe(false)
    expect(ANALYSIS_JSON_SCHEMA.properties.author_assessment.additionalProperties).toBe(false)
    expect(ANALYSIS_JSON_SCHEMA.properties.commit_assessment.additionalProperties).toBe(false)
    expect(ANALYSIS_JSON_SCHEMA.properties.code_assessment.additionalProperties).toBe(false)
    expect(ANALYSIS_JSON_SCHEMA.properties.behavioral_signals.additionalProperties).toBe(false)
  })
})
