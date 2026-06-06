/**
 * Tool schema definitions for structured AI output via MCP tool calling.
 *
 * Instead of parsing raw JSON from the AI, we define a `submit_analysis` tool
 * with a strict JSON Schema. The AI is forced to call this tool, ensuring
 * deterministic, validated output structure across all providers.
 */
/** Name of the MCP tool the AI must call. */
export declare const ANALYSIS_TOOL_NAME = "submit_analysis";
/** Description shown to the AI model for the tool. */
export declare const ANALYSIS_TOOL_DESCRIPTION: string;
/** JSON Schema for the submit_analysis tool input. */
export declare const ANALYSIS_JSON_SCHEMA: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["risk_score", "risk_level", "confidence", "summary", "author_assessment", "commit_assessment", "code_assessment", "behavioral_signals", "review_suggestions"];
    readonly properties: {
        readonly risk_score: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 10;
            readonly description: "Overall risk score from 0 (safe) to 10 (critical threat)";
        };
        readonly risk_level: {
            readonly type: "string";
            readonly enum: readonly ["low", "medium", "high", "critical"];
            readonly description: "Risk category: low (0-2), medium (3-5), high (6-8), critical (9-10)";
        };
        readonly confidence: {
            readonly type: "string";
            readonly enum: readonly ["high", "medium", "low"];
            readonly description: "How confident the analysis is";
        };
        readonly summary: {
            readonly type: "string";
            readonly description: "2-3 sentence overall assessment";
        };
        readonly author_assessment: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["trust_level", "reasoning"];
            readonly properties: {
                readonly trust_level: {
                    readonly type: "string";
                    readonly enum: readonly ["trusted", "neutral", "suspicious", "unknown"];
                };
                readonly reasoning: {
                    readonly type: "string";
                };
            };
        };
        readonly commit_assessment: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["quality", "reasoning"];
            readonly properties: {
                readonly quality: {
                    readonly type: "string";
                    readonly enum: readonly ["good", "acceptable", "poor", "suspicious"];
                };
                readonly reasoning: {
                    readonly type: "string";
                };
            };
        };
        readonly code_assessment: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["categories_flagged", "reasoning", "suspicious_patterns"];
            readonly properties: {
                readonly categories_flagged: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["phantom_fix", "well_formed_noise", "boilerplate_inflation", "unnecessary_refactoring", "cosmetic_disguise", "duplicate_code", "documentation_slop", "convention_breaking", "obfuscation", "secrets", "backdoor", "dependency_hijack", "ci_tampering", "data_exfiltration", "crypto_mining", "typosquatting", "none"];
                    };
                };
                readonly reasoning: {
                    readonly type: "string";
                };
                readonly suspicious_patterns: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly required: readonly ["file", "description", "severity"];
                        readonly properties: {
                            readonly file: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly severity: {
                                readonly type: "string";
                                readonly enum: readonly ["low", "medium", "high", "critical"];
                            };
                        };
                    };
                };
            };
        };
        readonly behavioral_signals: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["flags", "reasoning"];
            readonly properties: {
                readonly flags: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["spray_and_pray", "reputation_farming", "new_account", "bot_like_timing", "no_engagement", "holiday_burst", "generic_description", "phantom_fix_claim", "description_diff_mismatch", "templated_test_plan", "none"];
                    };
                    readonly description: "Behavioral flags detected in the PR and author patterns";
                };
                readonly reasoning: {
                    readonly type: "string";
                };
            };
        };
        readonly review_suggestions: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "Specific things a human reviewer should check";
        };
    };
};
/**
 * Builds the tool definition for OpenAI function calling.
 * @returns OpenAI-compatible tool object with strict mode enabled.
 */
export declare function buildOpenAITool(): {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: boolean;
        parameters: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["risk_score", "risk_level", "confidence", "summary", "author_assessment", "commit_assessment", "code_assessment", "behavioral_signals", "review_suggestions"];
            readonly properties: {
                readonly risk_score: {
                    readonly type: "integer";
                    readonly minimum: 0;
                    readonly maximum: 10;
                    readonly description: "Overall risk score from 0 (safe) to 10 (critical threat)";
                };
                readonly risk_level: {
                    readonly type: "string";
                    readonly enum: readonly ["low", "medium", "high", "critical"];
                    readonly description: "Risk category: low (0-2), medium (3-5), high (6-8), critical (9-10)";
                };
                readonly confidence: {
                    readonly type: "string";
                    readonly enum: readonly ["high", "medium", "low"];
                    readonly description: "How confident the analysis is";
                };
                readonly summary: {
                    readonly type: "string";
                    readonly description: "2-3 sentence overall assessment";
                };
                readonly author_assessment: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly required: readonly ["trust_level", "reasoning"];
                    readonly properties: {
                        readonly trust_level: {
                            readonly type: "string";
                            readonly enum: readonly ["trusted", "neutral", "suspicious", "unknown"];
                        };
                        readonly reasoning: {
                            readonly type: "string";
                        };
                    };
                };
                readonly commit_assessment: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly required: readonly ["quality", "reasoning"];
                    readonly properties: {
                        readonly quality: {
                            readonly type: "string";
                            readonly enum: readonly ["good", "acceptable", "poor", "suspicious"];
                        };
                        readonly reasoning: {
                            readonly type: "string";
                        };
                    };
                };
                readonly code_assessment: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly required: readonly ["categories_flagged", "reasoning", "suspicious_patterns"];
                    readonly properties: {
                        readonly categories_flagged: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly enum: readonly ["phantom_fix", "well_formed_noise", "boilerplate_inflation", "unnecessary_refactoring", "cosmetic_disguise", "duplicate_code", "documentation_slop", "convention_breaking", "obfuscation", "secrets", "backdoor", "dependency_hijack", "ci_tampering", "data_exfiltration", "crypto_mining", "typosquatting", "none"];
                            };
                        };
                        readonly reasoning: {
                            readonly type: "string";
                        };
                        readonly suspicious_patterns: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: false;
                                readonly required: readonly ["file", "description", "severity"];
                                readonly properties: {
                                    readonly file: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly severity: {
                                        readonly type: "string";
                                        readonly enum: readonly ["low", "medium", "high", "critical"];
                                    };
                                };
                            };
                        };
                    };
                };
                readonly behavioral_signals: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly required: readonly ["flags", "reasoning"];
                    readonly properties: {
                        readonly flags: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly enum: readonly ["spray_and_pray", "reputation_farming", "new_account", "bot_like_timing", "no_engagement", "holiday_burst", "generic_description", "phantom_fix_claim", "description_diff_mismatch", "templated_test_plan", "none"];
                            };
                            readonly description: "Behavioral flags detected in the PR and author patterns";
                        };
                        readonly reasoning: {
                            readonly type: "string";
                        };
                    };
                };
                readonly review_suggestions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "Specific things a human reviewer should check";
                };
            };
        };
    };
};
/**
 * Builds the tool definition for Anthropic/Vertex AI tool use.
 * @returns Anthropic-compatible tool object.
 */
export declare function buildAnthropicTool(): {
    name: string;
    description: string;
    input_schema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["risk_score", "risk_level", "confidence", "summary", "author_assessment", "commit_assessment", "code_assessment", "behavioral_signals", "review_suggestions"];
        readonly properties: {
            readonly risk_score: {
                readonly type: "integer";
                readonly minimum: 0;
                readonly maximum: 10;
                readonly description: "Overall risk score from 0 (safe) to 10 (critical threat)";
            };
            readonly risk_level: {
                readonly type: "string";
                readonly enum: readonly ["low", "medium", "high", "critical"];
                readonly description: "Risk category: low (0-2), medium (3-5), high (6-8), critical (9-10)";
            };
            readonly confidence: {
                readonly type: "string";
                readonly enum: readonly ["high", "medium", "low"];
                readonly description: "How confident the analysis is";
            };
            readonly summary: {
                readonly type: "string";
                readonly description: "2-3 sentence overall assessment";
            };
            readonly author_assessment: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["trust_level", "reasoning"];
                readonly properties: {
                    readonly trust_level: {
                        readonly type: "string";
                        readonly enum: readonly ["trusted", "neutral", "suspicious", "unknown"];
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                };
            };
            readonly commit_assessment: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["quality", "reasoning"];
                readonly properties: {
                    readonly quality: {
                        readonly type: "string";
                        readonly enum: readonly ["good", "acceptable", "poor", "suspicious"];
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                };
            };
            readonly code_assessment: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["categories_flagged", "reasoning", "suspicious_patterns"];
                readonly properties: {
                    readonly categories_flagged: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                            readonly enum: readonly ["phantom_fix", "well_formed_noise", "boilerplate_inflation", "unnecessary_refactoring", "cosmetic_disguise", "duplicate_code", "documentation_slop", "convention_breaking", "obfuscation", "secrets", "backdoor", "dependency_hijack", "ci_tampering", "data_exfiltration", "crypto_mining", "typosquatting", "none"];
                        };
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                    readonly suspicious_patterns: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly required: readonly ["file", "description", "severity"];
                            readonly properties: {
                                readonly file: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                                readonly severity: {
                                    readonly type: "string";
                                    readonly enum: readonly ["low", "medium", "high", "critical"];
                                };
                            };
                        };
                    };
                };
            };
            readonly behavioral_signals: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["flags", "reasoning"];
                readonly properties: {
                    readonly flags: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                            readonly enum: readonly ["spray_and_pray", "reputation_farming", "new_account", "bot_like_timing", "no_engagement", "holiday_burst", "generic_description", "phantom_fix_claim", "description_diff_mismatch", "templated_test_plan", "none"];
                        };
                        readonly description: "Behavioral flags detected in the PR and author patterns";
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                };
            };
            readonly review_suggestions: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Specific things a human reviewer should check";
            };
        };
    };
};
/**
 * Builds the function declaration for Google Gemini function calling.
 * @returns Gemini-compatible function declaration.
 */
export declare function buildGeminiFunctionDeclaration(): {
    name: string;
    description: string;
    parametersJsonSchema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["risk_score", "risk_level", "confidence", "summary", "author_assessment", "commit_assessment", "code_assessment", "behavioral_signals", "review_suggestions"];
        readonly properties: {
            readonly risk_score: {
                readonly type: "integer";
                readonly minimum: 0;
                readonly maximum: 10;
                readonly description: "Overall risk score from 0 (safe) to 10 (critical threat)";
            };
            readonly risk_level: {
                readonly type: "string";
                readonly enum: readonly ["low", "medium", "high", "critical"];
                readonly description: "Risk category: low (0-2), medium (3-5), high (6-8), critical (9-10)";
            };
            readonly confidence: {
                readonly type: "string";
                readonly enum: readonly ["high", "medium", "low"];
                readonly description: "How confident the analysis is";
            };
            readonly summary: {
                readonly type: "string";
                readonly description: "2-3 sentence overall assessment";
            };
            readonly author_assessment: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["trust_level", "reasoning"];
                readonly properties: {
                    readonly trust_level: {
                        readonly type: "string";
                        readonly enum: readonly ["trusted", "neutral", "suspicious", "unknown"];
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                };
            };
            readonly commit_assessment: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["quality", "reasoning"];
                readonly properties: {
                    readonly quality: {
                        readonly type: "string";
                        readonly enum: readonly ["good", "acceptable", "poor", "suspicious"];
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                };
            };
            readonly code_assessment: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["categories_flagged", "reasoning", "suspicious_patterns"];
                readonly properties: {
                    readonly categories_flagged: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                            readonly enum: readonly ["phantom_fix", "well_formed_noise", "boilerplate_inflation", "unnecessary_refactoring", "cosmetic_disguise", "duplicate_code", "documentation_slop", "convention_breaking", "obfuscation", "secrets", "backdoor", "dependency_hijack", "ci_tampering", "data_exfiltration", "crypto_mining", "typosquatting", "none"];
                        };
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                    readonly suspicious_patterns: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly required: readonly ["file", "description", "severity"];
                            readonly properties: {
                                readonly file: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                                readonly severity: {
                                    readonly type: "string";
                                    readonly enum: readonly ["low", "medium", "high", "critical"];
                                };
                            };
                        };
                    };
                };
            };
            readonly behavioral_signals: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["flags", "reasoning"];
                readonly properties: {
                    readonly flags: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                            readonly enum: readonly ["spray_and_pray", "reputation_farming", "new_account", "bot_like_timing", "no_engagement", "holiday_burst", "generic_description", "phantom_fix_claim", "description_diff_mismatch", "templated_test_plan", "none"];
                        };
                        readonly description: "Behavioral flags detected in the PR and author patterns";
                    };
                    readonly reasoning: {
                        readonly type: "string";
                    };
                };
            };
            readonly review_suggestions: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Specific things a human reviewer should check";
            };
        };
    };
};
//# sourceMappingURL=tools.d.ts.map