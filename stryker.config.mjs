// Mutation testing of the pure domain (ADR-0017): do the Vitest tests fail when a rule changes?
// The command runner activates each mutant through an environment variable and runs Vitest as is: Stryker's Vitest
// runner (10.0) does not activate runtime mutants with Vitest 5 and reports them as survivors.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'command',
  commandRunner: { command: 'npx vitest run src/domain' },
  coverageAnalysis: 'off',
  mutate: ['src/domain/**/*.js', '!src/domain/__tests__/**'],
  reporters: ['clear-text', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  // Below 95 % the run fails: a surviving mutant gets a test, and only a truly equivalent one a disable comment.
  thresholds: { high: 95, low: 90, break: 95 },
  tempDirName: '.stryker-tmp'
};
