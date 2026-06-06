import { AiFingerprintAnalyzer } from '../src/analysis/ai-fingerprint'

describe('AiFingerprintAnalyzer', () => {
  const analyzer = new AiFingerprintAnalyzer()

  it('returns score 0 for empty diff', () => {
    const result = analyzer.analyze('')
    expect(result.score).toBe(0)
    expect(result.signals).toEqual([])
  })

  it('detects high comment density', () => {
    const diff = [
      '+// This function validates the input',
      '+// It checks if the value is within range',
      '+// Returns true if valid, false otherwise',
      '+// @param value - the value to validate',
      '+// @returns boolean indicating validity',
      '+function validate(value: number): boolean {',
      '+  return value > 0 && value < 100',
      '+'
    ].join('\n')

    const result = analyzer.analyze(diff)
    const commentSignal = result.signals.find(s => s.name === 'comment_density')
    expect(commentSignal).toBeDefined()
    expect(commentSignal!.score).toBeGreaterThan(30)
  })

  it('detects slop vocabulary', () => {
    const diff = [
      '+// Enhance the robust and comprehensive functionality',
      '+// Leverage this streamlined approach to facilitate',
      '+// optimal and scalable architecture',
      '+function enhanceRobustFunctionality() {',
      '+  return "comprehensive"',
      '+'
    ].join('\n')

    const result = analyzer.analyze(diff)
    const vocabSignal = result.signals.find(s => s.name === 'slop_vocabulary')
    expect(vocabSignal).toBeDefined()
    expect(vocabSignal!.score).toBeGreaterThan(20)
  })

  it('detects verbose identifiers', () => {
    const diff = [
      '+const calculateAndValidateUserInputParameters = () => {}',
      '+function processAndTransformDataForOutputRendering() {}',
      '+const initializeApplicationConfigurationSettings = true',
      '+const x = 1',
    ].join('\n')

    const result = analyzer.analyze(diff)
    const verboseSignal = result.signals.find(s => s.name === 'verbose_identifiers')
    expect(verboseSignal).toBeDefined()
    expect(verboseSignal!.score).toBeGreaterThan(0)
  })

  it('scores minimal human-like code low', () => {
    const diff = [
      '+function add(a: number, b: number): number {',
      '+  return a + b',
      '+}',
      '+',
      '+const result = add(1, 2)',
    ].join('\n')

    const result = analyzer.analyze(diff)
    expect(result.score).toBeLessThan(30)
  })

  it('includes commit messages in slop vocabulary analysis', () => {
    const diff = '+const x = 1\n'
    const commits = [
      'Enhance comprehensive functionality for robust architecture',
      'Streamline and leverage modular paradigm'
    ]

    const result = analyzer.analyze(diff, commits)
    const vocabSignal = result.signals.find(s => s.name === 'slop_vocabulary')
    expect(vocabSignal).toBeDefined()
    expect(vocabSignal!.score).toBeGreaterThan(0)
  })

  it('detects docstring-heavy code', () => {
    const diff = [
      '+/**',
      '+ * @brief Validates the input parameter',
      '+ * @param value The value to check',
      '+ * @returns True if valid',
      '+ */',
      '+function validate(value: number) { return value > 0 }',
      '+/**',
      '+ * @description Processes the data',
      '+ * @param data Input data',
      '+ * @returns Processed result',
      '+ */',
      '+function process(data: string) { return data }',
    ].join('\n')

    const result = analyzer.analyze(diff)
    const docSignal = result.signals.find(s => s.name === 'docstring_density')
    expect(docSignal).toBeDefined()
    expect(docSignal!.score).toBeGreaterThan(0)
  })

  it('returns 6 signals always', () => {
    const diff = '+const x = 1\n'
    const result = analyzer.analyze(diff)
    expect(result.signals).toHaveLength(6)
    const names = result.signals.map(s => s.name)
    expect(names).toContain('comment_density')
    expect(names).toContain('verbose_identifiers')
    expect(names).toContain('slop_vocabulary')
    expect(names).toContain('docstring_density')
    expect(names).toContain('boilerplate_ratio')
    expect(names).toContain('structural_patterns')
  })
})
