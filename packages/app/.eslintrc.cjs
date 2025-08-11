module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: false
  },
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  rules: {
    // Only check for trailing spaces
    'no-trailing-spaces': 'error',
    // Turn off all other rules
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
}