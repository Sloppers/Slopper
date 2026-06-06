import { AiFingerprintResult, AiFingerprintSignal } from '../core/types'

const SLOP_WORDS = [
  'enhance', 'robust', 'comprehensive', 'streamline', 'leverage',
  'utilize', 'facilitate', 'implement', 'functionality', 'maintainability',
  'scalability', 'extensibility', 'encapsulate', 'modular', 'seamless',
  'optimal', 'efficiently', 'paradigm', 'architecture', 'ecosystem'
]

const COMMENT_PATTERNS = [
  /^\s*\/\//,          // JS/TS single line
  /^\s*#/,             // Python/Shell
  /^\s*\*/,            // Block comment continuation
  /^\s*\/\*/,          // Block comment start
  /^\s*\*\//,          // Block comment end
  /^\s*<!--/,          // HTML comment
]

const DOCSTRING_PATTERNS = [
  /\/\*\*/,            // JSDoc
  /"""/,               // Python docstring
  /@brief/,            // Doxygen
  /@param/,            // JSDoc param
  /@returns?/,         // JSDoc return
  /@description/,      // JSDoc description
]

const FUNCTION_PATTERNS = [
  /(?:function|def|fn|func|pub fn)\s+\w+/,
  /(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>/,
  /(?:public|private|protected|static)\s+(?:async\s+)?\w+\s*\(/,
]

export class AiFingerprintAnalyzer {
  analyze(diff: string, commitMessages?: string[]): AiFingerprintResult {
    const addedLines = this.extractAddedLines(diff)
    if (addedLines.length === 0) {
      return { score: 0, signals: [] }
    }

    const signals: AiFingerprintSignal[] = []

    signals.push(this.analyzeCommentDensity(addedLines))
    signals.push(this.analyzeVerboseIdentifiers(addedLines))
    signals.push(this.analyzeSlopVocabulary(addedLines, commitMessages))
    signals.push(this.analyzeDocstringDensity(addedLines))
    signals.push(this.analyzeBoilerplate(addedLines))
    signals.push(this.analyzeStructuralPatterns(addedLines))

    const weights = [0.25, 0.20, 0.20, 0.15, 0.10, 0.10]
    const weightedScore = Math.round(
      signals.reduce((sum, s, i) => sum + s.score * weights[i], 0)
    )

    return {
      score: Math.min(weightedScore, 100),
      signals
    }
  }

  private extractAddedLines(diff: string): string[] {
    return diff
      .split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.slice(1))
  }

  private analyzeCommentDensity(lines: string[]): AiFingerprintSignal {
    const codeLines = lines.filter(l => l.trim().length > 0)
    if (codeLines.length === 0) {
      return { name: 'comment_density', score: 0, detail: 'No code lines to analyze' }
    }

    const commentLines = codeLines.filter(l =>
      COMMENT_PATTERNS.some(p => p.test(l))
    )
    const ratio = commentLines.length / codeLines.length

    // Humans typically have 5-15% comments. AI often has 30-50%+
    let score = 0
    if (ratio > 0.5) score = 100
    else if (ratio > 0.4) score = 80
    else if (ratio > 0.3) score = 60
    else if (ratio > 0.2) score = 30
    else if (ratio > 0.15) score = 10

    return {
      name: 'comment_density',
      score,
      detail: `${commentLines.length}/${codeLines.length} lines are comments (${Math.round(ratio * 100)}%)`
    }
  }

  private analyzeVerboseIdentifiers(lines: string[]): AiFingerprintSignal {
    const identifierPattern = /[a-z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)*/g
    let totalIdentifiers = 0
    let verboseCount = 0

    for (const line of lines) {
      if (COMMENT_PATTERNS.some(p => p.test(line))) continue
      const matches = line.match(identifierPattern) ?? []
      for (const m of matches) {
        if (m.length >= 4) {
          totalIdentifiers++
          if (m.length > 30) verboseCount++
        }
      }
    }

    if (totalIdentifiers === 0) {
      return { name: 'verbose_identifiers', score: 0, detail: 'No identifiers found' }
    }

    const ratio = verboseCount / totalIdentifiers
    let score = 0
    if (ratio > 0.15) score = 100
    else if (ratio > 0.10) score = 70
    else if (ratio > 0.05) score = 40
    else if (ratio > 0.02) score = 15

    return {
      name: 'verbose_identifiers',
      score,
      detail: `${verboseCount}/${totalIdentifiers} identifiers are over 30 chars (${Math.round(ratio * 100)}%)`
    }
  }

  private analyzeSlopVocabulary(lines: string[], commitMessages?: string[]): AiFingerprintSignal {
    const allText = [...lines, ...(commitMessages ?? [])].join(' ').toLowerCase()
    const words = allText.split(/\W+/).filter(w => w.length > 3)

    if (words.length === 0) {
      return { name: 'slop_vocabulary', score: 0, detail: 'No text to analyze' }
    }

    const slopHits: Record<string, number> = {}
    for (const word of words) {
      if (SLOP_WORDS.includes(word)) {
        slopHits[word] = (slopHits[word] ?? 0) + 1
      }
    }

    const totalHits = Object.values(slopHits).reduce((a, b) => a + b, 0)
    const uniqueHits = Object.keys(slopHits).length
    const density = totalHits / words.length

    let score = 0
    if (density > 0.05) score = 100
    else if (density > 0.03) score = 70
    else if (density > 0.02) score = 50
    else if (density > 0.01) score = 25
    else if (uniqueHits >= 3) score = 20

    const topWords = Object.entries(slopHits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w, c]) => `${w}(${c})`)
      .join(', ')

    return {
      name: 'slop_vocabulary',
      score,
      detail: totalHits > 0
        ? `${totalHits} slop words found (${uniqueHits} unique): ${topWords}`
        : 'No slop vocabulary detected'
    }
  }

  private analyzeDocstringDensity(lines: string[]): AiFingerprintSignal {
    const functionCount = lines.filter(l =>
      FUNCTION_PATTERNS.some(p => p.test(l))
    ).length

    if (functionCount === 0) {
      return { name: 'docstring_density', score: 0, detail: 'No functions found' }
    }

    const docstringCount = lines.filter(l =>
      DOCSTRING_PATTERNS.some(p => p.test(l))
    ).length

    const ratio = docstringCount / functionCount

    // Humans document selectively. AI documents everything.
    let score = 0
    if (ratio >= 3) score = 100
    else if (ratio >= 2) score = 70
    else if (ratio >= 1.5) score = 50
    else if (ratio >= 1) score = 20

    return {
      name: 'docstring_density',
      score,
      detail: `${docstringCount} doc annotations across ${functionCount} functions (ratio: ${ratio.toFixed(1)})`
    }
  }

  private analyzeBoilerplate(lines: string[]): AiFingerprintSignal {
    const codeLines = lines.filter(l => l.trim().length > 0)
    if (codeLines.length === 0) {
      return { name: 'boilerplate_ratio', score: 0, detail: 'No code to analyze' }
    }

    const boilerplatePatterns = [
      /^\s*import\s/,
      /^\s*export\s+(default\s+)?(?:class|interface|type|enum)\s/,
      /^\s*(?:constructor|get|set)\s*\(\s*\)\s*\{\s*\}/, // empty constructors/getters
      /^\s*(?:return\s+this\.\w+;?)$/,                     // trivial getters
      /^\s*this\.\w+\s*=\s*\w+;?\s*$/,                     // trivial assignments
      /^\s*}\s*$/,                                           // closing braces
      /^\s*{\s*$/,                                           // opening braces
    ]

    const boilerplateCount = codeLines.filter(l =>
      boilerplatePatterns.some(p => p.test(l))
    ).length

    const ratio = boilerplateCount / codeLines.length

    let score = 0
    if (ratio > 0.6) score = 100
    else if (ratio > 0.4) score = 60
    else if (ratio > 0.3) score = 30
    else if (ratio > 0.2) score = 10

    return {
      name: 'boilerplate_ratio',
      score,
      detail: `${boilerplateCount}/${codeLines.length} lines are boilerplate (${Math.round(ratio * 100)}%)`
    }
  }

  private analyzeStructuralPatterns(lines: string[]): AiFingerprintSignal {
    const fullText = lines.join('\n')
    let score = 0
    const findings: string[] = []

    // Single-method classes
    const classBlocks = fullText.match(/class\s+\w+[^{]*\{[^}]*\}/g) ?? []
    for (const block of classBlocks) {
      const methods = block.match(/(?:public|private|protected|static|async)\s+\w+\s*\(/g) ?? []
      if (methods.length === 1) {
        score += 30
        findings.push('single-method class')
      }
    }

    // Wrapper functions that just call another function
    const wrapperPattern = /(?:function|const\s+\w+\s*=)\s*.*?\{[\s\n]*return\s+\w+\(.*?\);?\s*\}/g
    const wrappers = fullText.match(wrapperPattern) ?? []
    if (wrappers.length > 2) {
      score += 20
      findings.push(`${wrappers.length} wrapper functions`)
    }

    // Excessive interface/type definitions relative to implementation
    const typeCount = (fullText.match(/(?:interface|type)\s+\w+/g) ?? []).length
    const functionCount = lines.filter(l => FUNCTION_PATTERNS.some(p => p.test(l))).length
    if (typeCount > 0 && functionCount > 0 && typeCount > functionCount * 2) {
      score += 20
      findings.push(`${typeCount} types for ${functionCount} functions`)
    }

    return {
      name: 'structural_patterns',
      score: Math.min(score, 100),
      detail: findings.length > 0
        ? `Found: ${findings.join(', ')}`
        : 'No suspicious structural patterns'
    }
  }
}
