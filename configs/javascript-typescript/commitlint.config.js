// ──────────────────────────────────────────────────────────────
// Marka commitlint configuration — Conventional Commits
// https://commitlint.js.org/
//
// Install:
//   pnpm add -D @commitlint/cli @commitlint/config-conventional
//
// Preferred enforcement: run in CI/PR validation.
// Optional local hook (see .husky/commit-msg in this repo):
//   pnpm add -D husky
//   pnpm exec husky init
//   echo "pnpm exec commitlint --edit \$1" > .husky/commit-msg
// ──────────────────────────────────────────────────────────────

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // ── Type ────────────────────────────────────────────────
    // Allowed commit types (extend as needed)
    'type-enum': [
      2,
      'always',
      [
        'feat',      // New feature
        'fix',       // Bug fix
        'refactor',  // Code change that is neither a feature nor a fix
        'perf',      // Performance improvement
        'test',      // Adding or updating tests
        'docs',      // Documentation only
        'style',     // Formatting, missing semicolons — no logic change
        'build',     // Build system or dependency changes
        'ci',        // CI/CD configuration changes
        'chore',     // Maintenance tasks (releases, tooling, etc.)
        'revert',    // Reverts a previous commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // ── Scope ───────────────────────────────────────────────
    // Optional scope in parentheses: feat(auth): ...
    // Uncomment and populate to enforce a specific scope list:
    // 'scope-enum': [2, 'always', ['auth', 'api', 'ui', 'db', 'infra']],
    'scope-case': [2, 'always', 'lower-case'],

    // ── Subject ─────────────────────────────────────────────
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],   // No trailing period
    'subject-case': [0, 'always'],            // Do not block PR/squash titles on wording case
    'subject-max-length': [2, 'always', 100],

    // ── Body / Footer ───────────────────────────────────────
    'body-leading-blank': [1, 'always'],   // Blank line between subject and body
    'footer-leading-blank': [1, 'always'],
    'body-max-line-length': [0, 'always'], // Do not block detailed PR/squash bodies on wrapping
    'footer-max-line-length': [2, 'always', 120],
  },
};
