# JavaScript / TypeScript Config Templates

| File | Purpose |
|---|---|
| `.editorconfig` | Indent style, quote type, line endings for TS/JS/JSON/YAML/CSS |
| `.gitignore` | node_modules, build outputs, env files, package manager caches, test artifacts |
| `.dockerignore` | node_modules, build outputs, test artifacts, env files — for Node.js Docker images |
| `biome.json` | Biome linter + formatter (replaces ESLint + Prettier) |
| `commitlint.config.js` | Conventional Commits enforcement via `@commitlint/config-conventional` |
| `husky/.husky/commit-msg` | Git hook: runs commitlint on every commit message |
| `husky/.husky/pre-commit` | Git hook: runs lint-staged on staged files before commit |

## Biome

[Biome](https://biomejs.dev/) is the standard linter and formatter for all JS/TS projects.
It replaces both ESLint and Prettier with a single fast binary.

```bash
# Install
pnpm add -D @biomejs/biome

# Format + lint all files
pnpm exec biome check --write .

# Check only (no writes — use in CI)
pnpm exec biome check .
```

Recommended `package.json` scripts:

```json
{
  "scripts": {
    "lint":        "biome check .",
    "lint:fix":    "biome check --write .",
    "format":      "biome format --write ."
  }
}
```

## Commitlint + Husky

```bash
# Install
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Initialise Husky (creates .husky/ directory)
pnpm exec husky init

# Copy hooks from this repo
cp configs/javascript-typescript/husky/.husky/commit-msg  .husky/commit-msg
cp configs/javascript-typescript/husky/.husky/pre-commit  .husky/pre-commit
chmod +x .husky/commit-msg .husky/pre-commit
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["biome check --write"],
    "*.{json,css,md}":   ["biome format --write"]
  }
}
```

## Related standards

- [Linters and Formatters](../../README.md#linters-and-formatters)
- [Commit Message Standards](../../README.md#commit-message-standards)
- [Commit Message Validation](../../README.md#commit-message-validation)
- [Containerization](../../README.md#containerization)
