# C# / .NET Config Templates

| File | Purpose |
|---|---|
| `.editorconfig` | Code style, indentation, naming rules, and StyleCop diagnostic suppressions for Roslyn/VS/Rider |
| `.gitignore` | Excludes build outputs, IDE metadata, test results, secrets, and local config overrides |
| `.dockerignore` | Excludes test projects, build artifacts, secrets, and documentation from Docker build context |

## .editorconfig highlights

- 4-space indentation, CRLF line endings (configurable per team)
- Enforces PascalCase for types and non-field members; `I` prefix for interfaces
- All `dotnet_style_*` and `csharp_style_*` conventions pre-configured
- StyleCop diagnostic suppressions for rules commonly disabled in Marka projects (SA1101, SA1200, SA1309, etc.)
- Treat C# analyzer warnings as suggestions by default; escalate to errors in CI via `<TreatWarningsAsErrors>`

## .dockerignore notes

- Test project folders (`*Tests*`, `*Test*`) are excluded from the build context — production images should not include test code
- Secrets and local config overrides (`.env`, `local.settings.json`, `appsettings.*.local.json`) are always excluded
- NuGet packages are excluded because they are restored inside the Dockerfile via `dotnet restore`

## Related standards

- [Linters and Formatters](../../README.md#linters-and-formatters)
- [Containerization](../../README.md#containerization)
- [Secrets Management](../../README.md#secrets-management)
