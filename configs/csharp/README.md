# C# / .NET Config Templates

| File | Purpose |
|---|---|
| `.editorconfig` | Code style, indentation, naming rules, and StyleCop diagnostic suppressions for Roslyn/VS/Rider |
| `.gitignore` | Excludes build outputs, IDE metadata, test results, secrets, and local config overrides |
| `.dockerignore` | Excludes test projects, build artifacts, secrets, and documentation from Docker build context |

## .editorconfig highlights

- 4-space indentation and LF line endings by default (teams may override line endings when a legacy repository requires it)
- `.editorconfig` is the C# formatting source of truth for Marka projects
- Enforces PascalCase for types and non-field members; `I` prefix for interfaces
- All `dotnet_style_*` and `csharp_style_*` conventions pre-configured
- StyleCop diagnostic suppressions for rules commonly disabled in Marka projects (SA1101, SA1200, SA1309, etc.)
- Treat C# analyzer warnings as suggestions by default; escalate to errors in CI via `<TreatWarningsAsErrors>` after analyzer baselining
- Keep `dotnet format style --verify-no-changes` in CI for baselined projects, but do not let import-ordering noise block PRs unless the repository has explicitly adopted a strict import-order convention

> CSharpier is retired for Marka C# projects because it does not respect the full `.editorconfig` rule set. Use `.editorconfig` + Roslyn/StyleCop analyzers instead.

## CI style gate pattern

Run the style gate after restore/build so the workspace loads correctly:

```bash
dotnet format style MySolution.sln --severity warn --verify-no-changes --no-restore
```

If a repository has a large legacy import-ordering baseline, keep the style gate but ignore import-order-only failures instead of disabling style validation entirely. `dotnet format` may still report the built-in `IMPORTS` diagnostic even when `--exclude-diagnostics IMPORTS` is supplied, so filter that diagnostic at the pipeline step level:

```bash
set +e
output=$(dotnet format style MySolution.sln --severity warn --verify-no-changes --no-restore 2>&1)
status=$?
set -e

echo "$output"

if [ "$status" -eq 0 ]; then
  exit 0
fi

import_errors=$(printf '%s\n' "$output" | grep -E 'error IMPORTS:' || true)
non_import_errors=$(printf '%s\n' "$output" | grep -E 'error [A-Z0-9]+:' | grep -v 'error IMPORTS:' || true)

if [ -n "$import_errors" ] && [ -z "$non_import_errors" ]; then
  echo "Only import-ordering diagnostics were reported; ignoring IMPORTS for the PR style baseline."
  exit 0
fi

exit "$status"
```

Use this exception as a baseline strategy only. New repositories may choose to enforce import ordering from day one.

## .dockerignore notes

- Test project folders (`*Tests*`, `*Test*`) are excluded from the build context — production images should not include test code
- Secrets and local config overrides (`.env`, `local.settings.json`, `appsettings.*.local.json`) are always excluded
- NuGet packages are excluded because they are restored inside the Dockerfile via `dotnet restore`

## Related standards

- [Linters and Formatters](../../README.md#linters-and-formatters)
- [Containerization](../../README.md#containerization)
- [Secrets Management](../../README.md#secrets-management)
