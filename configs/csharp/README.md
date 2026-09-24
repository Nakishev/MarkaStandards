# C# / .NET Config Templates

| File | Purpose |
|---|---|
| `.editorconfig` | Code style, indentation, naming rules, and StyleCop diagnostic suppressions for Roslyn/VS/Rider |
| `Directory.Build.props` | Repository-wide build settings: nullable, implicit usings, analyzers, `TreatWarningsAsErrors` switch, NuGet lock files |
| `Directory.Packages.props` | Central package management: one version per package for the whole solution, standard package set |
| `CodeCoverage.runsettings` | XPlat coverage collection: Cobertura for Azure DevOps and OpenCover for SonarQube |
| `.gitignore` | Excludes build outputs, IDE metadata, test results, secrets (env, keys, service accounts, `mise.local.toml`, archives, Playwright auth state, Terraform plans), and local config overrides |
| `.dockerignore` | Excludes test projects, build artifacts, secrets, and documentation from Docker build context |

## .editorconfig highlights

- 4-space indentation and LF line endings by default (teams may override line endings when a legacy repository requires it)
- `.editorconfig` is the C# formatting source of truth for Marka projects
- Enforces PascalCase for types and non-field members; `I` prefix for interfaces
- All `dotnet_style_*` and `csharp_style_*` conventions pre-configured
- StyleCop diagnostic suppressions for rules commonly disabled in Marka projects (SA1101, SA1200, SA1309, etc.)
- Treat C# analyzer warnings as suggestions by default; escalate to errors in CI via `<TreatWarningsAsErrors>` after analyzer baselining
- Keep `dotnet format <sln> --verify-no-changes --severity warn --no-restore` in CI for baselined projects, but do not let import-ordering noise block PRs unless the repository has explicitly adopted a strict import-order convention

> CSharpier is retired for Marka C# projects because it does not respect the full `.editorconfig` rule set. Use `.editorconfig` + Roslyn/StyleCop analyzers instead.

## CI style gate pattern

Run the style gate after restore/build so the workspace loads correctly:

```bash
dotnet format MySolution.sln --verify-no-changes --severity warn --no-restore
```

If a repository has a large legacy import-ordering baseline, keep the style gate but ignore import-order-only failures instead of disabling style validation entirely. `dotnet format` may still report the built-in `IMPORTS` diagnostic even when `--exclude-diagnostics IMPORTS` is supplied, so filter that diagnostic at the pipeline step level:

```bash
set +e
output=$(dotnet format MySolution.sln --verify-no-changes --severity warn --no-restore 2>&1)
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

## Directory.Build.props / Directory.Packages.props

- Put both at the repository root next to the `.sln`; remove `Nullable`, `ImplicitUsings`, analyzer references and `Version="..."` attributes from the individual `.csproj` files.
- `TreatWarningsAsErrors` starts `false`; flip it once `dotnet format` and the analyzers are clean, and track the baselining in `docs/exec-plans/`.
- With central package management, `dotnet restore` writes `packages.lock.json` per project; commit them.
- Full conventions: [.NET standards](../../docs/standards/dotnet.md).

## Related standards

- [.NET conventions](../../docs/standards/dotnet.md)
- [Linters and Formatters](../../docs/standards/workflow.md#linters-and-formatters)
- [Containerization](../../docs/standards/delivery.md#containerization)
- [Secrets Management](../../docs/standards/security.md#secrets-management)
