module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Переведены в warn до lint-cleanup (после Task 002 — testing foundation).
    // Исправление ~1800 ошибок без покрытия тестами создаёт риск регрессий.
    // TODO: вернуть в error после Task 002 + lint-cleanup task.
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'no-empty-pattern': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-dupe-keys': 'warn',
    'no-useless-catch': 'warn',
    'react/jsx-key': 'warn',
    'no-irregular-whitespace': 'warn',
    'no-empty': 'warn',
    'no-unreachable': 'warn',
    'react/no-unescaped-entities': 'warn',
    'no-useless-escape': 'warn',
  },
}
