/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    'react-refresh/only-export-components': 'warn'
  },
  ignorePatterns: ['dist', 'node_modules']
}
