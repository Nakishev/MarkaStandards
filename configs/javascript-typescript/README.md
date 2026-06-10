# JavaScript / TypeScript Config Templates

| File | Purpose |
|---|---|
| `.editorconfig` | Indent style, quote type, line endings for TS/JS/JSON/YAML/CSS |
| `.gitignore` | node_modules, build outputs, env files, package manager caches, test artifacts |
| `.dockerignore` | node_modules, build outputs, test artifacts, env files — for Node.js Docker images |
| `biome.json` | Biome linter + formatter (replaces ESLint + Prettier) |
| `commitlint.config.js` | Conventional Commits enforcement via `@commitlint/config-conventional` |
| `husky/.husky/commit-msg` | Optional local hook: runs commitlint on every commit message |
| `husky/.husky/pre-commit` | Optional local hook: runs lint-staged on staged files before commit |

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

## Commitlint

Use `commitlint` for Conventional Commit validation. The preferred enforcement point is CI/PR validation; local Husky hooks are optional for teams that want faster feedback before pushing.

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
cp configs/javascript-typescript/commitlint.config.js ./
```

Recommended Azure DevOps PR validation pattern:

```yaml
steps:
  - checkout: self
    fetchDepth: 0 # required when commitlint falls back to a commit range such as HEAD~1..HEAD

  - task: UseNode@1 # NodeTool@0 is deprecated
    inputs:
      version: '22.x'

  - script: |
      corepack enable
      corepack prepare pnpm@latest --activate
      pnpm install --frozen-lockfile
    displayName: Install dependencies

  - script: |
      if [ -n "$SYSTEM_PULLREQUEST_PULLREQUESTTITLE" ]; then
        echo "$SYSTEM_PULLREQUEST_PULLREQUESTTITLE" | pnpm exec commitlint
      else
        pnpm exec commitlint --from=HEAD~1 --to=HEAD
      fi
    displayName: Validate Conventional Commit title/message
```

Notes:

- Use `fetchDepth: 0` whenever validating a Git range. Shallow PR checkouts often do not contain `HEAD~1`.
- Use `UseNode@1` instead of deprecated `NodeTool@0` in Azure DevOps.
- `SYSTEM_PULLREQUEST_PULLREQUESTTITLE` may not be populated in every Azure DevOps trigger/template context. If PR title validation is mandatory, fetch the title from the Azure DevOps REST API using `System.PullRequest.PullRequestId` and `System.AccessToken`; otherwise fall back to commit-range validation with full checkout.
- The Marka base config intentionally does not enforce `subject-case` or body line wrapping. PR titles and squash commit bodies should be descriptive without failing on capitalization or long bullet lines.

### Optional local Husky hooks

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
cp configs/javascript-typescript/husky/.husky/commit-msg  .husky/commit-msg
cp configs/javascript-typescript/husky/.husky/pre-commit  .husky/pre-commit
chmod +x .husky/commit-msg .husky/pre-commit
```

Add to `package.json` when using the optional pre-commit hook:

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
