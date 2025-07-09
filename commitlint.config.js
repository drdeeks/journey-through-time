module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // new feature
        'fix',      // bug fix
        'docs',     // documentation changes
        'style',    // formatting, missing semicolons, etc.
        'refactor', // code change that neither fixes a bug nor adds a feature
        'perf',     // performance improvements
        'test',     // adding missing tests or correcting existing tests
        'build',    // changes that affect the build system or external dependencies
        'ci',       // changes to CI configuration files and scripts
        'chore',    // other changes that don't modify src or test files
        'revert',   // reverts a previous commit
        'security', // security improvements
        'contract', // smart contract specific changes
        'frontend', // frontend specific changes
        'blockchain' // blockchain related changes
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  },
}; 