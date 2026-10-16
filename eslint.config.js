import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'legacy-3d', 'node_modules', 'src/assets/gen'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='window'][property.name=/^__/]",
          message: 'Inga globala hooks: använd EventBus/Game (debug-hook bara i main.ts, dev).',
        },
        {
          selector: "AssignmentExpression > MemberExpression.left[object.name='window']",
          message: 'Skriv inte globala variabler på window.',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/main.ts', 'vite.config.ts', 'eslint.config.js'],
    rules: { 'no-restricted-syntax': 'off' },
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
