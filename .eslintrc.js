module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  // `eslint-config-prettier` (o "prettier" abaixo) apenas DESLIGA regras
  // estilisticas que conflitam com o Prettier. A checagem de formatacao
  // roda separada, via `npm run format:check`, para nao misturar
  // "codigo errado" (bloqueia merge) com "codigo mal formatado" (nao bloqueia).
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist/**',
    'node_modules/**',
    'coverage/**',
    'prisma/seed.js',
    'prisma/run-seed.js',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};
