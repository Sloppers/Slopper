export const ANALYSIS_TOOL_NAME = 'submit_analysis'

export const ANALYSIS_TOOL_DESCRIPTION =
  'Submit the structured quality and trust analysis results for a pull request. ' +
  'You MUST call this tool exactly once with your complete analysis.'

export const ANALYSIS_JSON_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  required: [
    'risk_score',
    'risk_level',
    'confidence',
    'summary',
    'author_assessment',
    'commit_assessment',
    'code_assessment',
    'behavioral_signals',
    'review_suggestions'
  ],
  properties: {
    risk_score: {
      type: 'integer' as const,
      minimum: 0,
      maximum: 10,
      description: 'Overall risk score from 0 (safe) to 10 (critical threat)'
    },
    risk_level: {
      type: 'string' as const,
      enum: ['low', 'medium', 'high', 'critical'],
      description: 'Risk category: low (0-2), medium (3-5), high (6-8), critical (9-10)'
    },
    confidence: {
      type: 'string' as const,
      enum: ['high', 'medium', 'low'],
      description: 'How confident the analysis is'
    },
    summary: {
      type: 'string' as const,
      description: '2-3 sentence overall assessment'
    },
    author_assessment: {
      type: 'object' as const,
      additionalProperties: false,
      required: ['trust_level', 'reasoning'],
      properties: {
        trust_level: {
          type: 'string' as const,
          enum: ['trusted', 'neutral', 'suspicious', 'unknown']
        },
        reasoning: { type: 'string' as const }
      }
    },
    commit_assessment: {
      type: 'object' as const,
      additionalProperties: false,
      required: ['quality', 'reasoning'],
      properties: {
        quality: {
          type: 'string' as const,
          enum: ['good', 'acceptable', 'poor', 'suspicious']
        },
        reasoning: { type: 'string' as const }
      }
    },
    code_assessment: {
      type: 'object' as const,
      additionalProperties: false,
      required: ['categories_flagged', 'reasoning', 'suspicious_patterns'],
      properties: {
        categories_flagged: {
          type: 'array' as const,
          items: {
            type: 'string' as const,
            enum: [
              'phantom_fix', 'well_formed_noise', 'boilerplate_inflation',
              'unnecessary_refactoring', 'cosmetic_disguise', 'duplicate_code',
              'documentation_slop', 'convention_breaking',
              'obfuscation', 'secrets', 'backdoor', 'dependency_hijack',
              'ci_tampering', 'data_exfiltration', 'crypto_mining',
              'typosquatting', 'none'
            ]
          }
        },
        reasoning: { type: 'string' as const },
        suspicious_patterns: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            additionalProperties: false,
            required: ['file', 'description', 'severity'],
            properties: {
              file: { type: 'string' as const },
              description: { type: 'string' as const },
              severity: {
                type: 'string' as const,
                enum: ['low', 'medium', 'high', 'critical']
              }
            }
          }
        }
      }
    },
    behavioral_signals: {
      type: 'object' as const,
      additionalProperties: false,
      required: ['flags', 'reasoning'],
      properties: {
        flags: {
          type: 'array' as const,
          items: {
            type: 'string' as const,
            enum: [
              'spray_and_pray', 'reputation_farming', 'new_account',
              'bot_like_timing', 'no_engagement', 'holiday_burst',
              'generic_description', 'phantom_fix_claim',
              'description_diff_mismatch', 'templated_test_plan',
              'none'
            ]
          },
          description: 'Behavioral flags detected in the PR and author patterns'
        },
        reasoning: { type: 'string' as const }
      }
    },
    review_suggestions: {
      type: 'array' as const,
      items: { type: 'string' as const },
      description: 'Specific things a human reviewer should check'
    }
  }
} as const
