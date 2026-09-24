# .NET / ASP.NET Core Conventions

Conventions for C# services. These are derived from StockMate and StaffManagement, the two reference .NET repositories.

## Toolchain

- Current LTS/STS .NET pinned in `global.json` (`"rollForward": "latestPatch"`) and in `mise.toml`.
- `dotnet-tools.json` at the root for `dotnet-ef` and other local tools; `dotnet tool restore` is the first step of every pipeline.
- `mise` tasks: `build`, `lint` (`dotnet format --verify-no-changes`), `test`, `test-integration`, `verify`, `migration-*`. See [Workflow — Task Runner](workflow.md#task-runner-mise).

## Solution layout

One solution at the root. Clean-architecture split per service:

```
src/
├── <Service>.Domain/            Entities, value objects, domain services. No dependencies.
├── <Service>.Application/       Use cases, DTOs, interfaces (repositories, external services), validation.
├── <Service>.Infrastructure.*/  Persistence (EF Core), Azure, messaging, external clients.
├── <Service>.Web.Host/          ASP.NET Core host: DI wiring, middleware, controllers/endpoints.
└── <Solution>.Common/           Cross-service helpers shared by hosts (auth extensions, error factory, health checks).
tests/
├── <Service>.Application.Tests/
├── <Service>.Web.Host.Tests/
└── <Solution>.IntegrationTests/  Testcontainers-backed
```

- Test projects live under `tests/`, not inside `src/`.
- Every tool, migration runner, or utility project is listed in the solution file.
- No absolute `HintPath` references; every dependency is a PackageReference or ProjectReference.

## Repository-wide build settings

Use `Directory.Build.props` at the root so each `.csproj` contains only what is specific to it. Start from [`configs/csharp/Directory.Build.props`](../../configs/csharp/Directory.Build.props):

- `Nullable=enable`, `ImplicitUsings=enable`, `Deterministic=true`, `ContinuousIntegrationBuild` in CI.
- `TreatWarningsAsErrors=true` once the analyzer baseline is clean; until then keep it `false` and track the baselining work in `docs/exec-plans/`.
- Analyzers (`StyleCop.Analyzers`, `Microsoft.CodeAnalysis.NetAnalyzers`) referenced once here, not in every project.
- `.editorconfig` from [`configs/csharp/.editorconfig`](../../configs/csharp/.editorconfig) as the single style source; `stylecop.json` only when StyleCop needs settings the `.editorconfig` cannot express.

Use central package management (`Directory.Packages.props`, [template](../../configs/csharp/Directory.Packages.props)) so a package has exactly one version per repository. Enable `RestorePackagesWithLockFile` and commit `packages.lock.json` for deployable hosts.

## Formatting and linting

- `dotnet format` is the formatter (CSharpier is retired). `dotnet format <sln> --verify-no-changes --severity warn --no-restore` is the CI gate; see the IMPORTS-filter wrapper in [`configs/csharp/README.md`](../../configs/csharp/README.md) for legacy import ordering.
- Function length: keep methods short (StockMate `AGENTS.md` uses 50 lines as the threshold); extract before you nest.

## Web API host

- Errors: use RFC 9457 Problem Details (`builder.Services.AddProblemDetails()` + `app.UseExceptionHandler()`); add `traceId` and an application `code` extension. Existing custom envelopes (StaffManagement ADR-0002) are legacy and are migrated when the API is next versioned. See [API conventions](api.md#error-handling-and-status-codes).
- Routing: lowercase kebab-case routes (`[Route("api/tax-filing")]`), not `[controller]` tokens that produce PascalCase URLs. Set `RouteOptions.LowercaseUrls = true`.
- Versioning: `Asp.Versioning` with URL segment (`/api/v1/...`) for every public or multi-consumer API; single-consumer internal APIs may stay unversioned and document that.
- OpenAPI: one generator only. Use the built-in `Microsoft.AspNetCore.OpenApi` (or Swashbuckle on older hosts) to produce the document, and one UI — Scalar (`Scalar.AspNetCore`) preferred, Swagger UI acceptable. Do not register Swashbuckle, NSwag, and Scalar together.
- Health: `AddHealthChecks()` with checks for the database, message broker, and critical dependencies; map `/health/live` and `/health/ready`. Container Apps probes and Uptime Kuma point at these.
- Authentication: JWT bearer for every controller/endpoint by default (`FallbackPolicy = RequireAuthenticatedUser`), `[AllowAnonymous]` only on health and explicitly public endpoints. Reference: StaffManagement dual-scheme setup.
- CORS: explicit origin list from configuration, never `AllowAnyOrigin` with credentials.

## Logging and observability

- `Microsoft.Extensions.Logging.ILogger<T>` only. Do not add Serilog unless a sink requires it; remove unused Serilog references.
- Structured message templates (`"Found {Count} transactions"`), never string interpolation in log calls. The logger category (class name) replaces the old `[Solution.Service.Method]` prefix.
- Application Insights via `Microsoft.ApplicationInsights.AspNetCore`; OpenTelemetry metrics/traces via `OpenTelemetry.Extensions.Hosting` (or .NET Aspire `ServiceDefaults`, which is the reference wiring in StaffManagement).
- Request-level business context goes into the Wide Event context, not into extra log lines. See [Observability — Wide Events](observability.md#wide-events).

## Persistence

- EF Core with PostgreSQL (`Npgsql`) is the default provider. Keep exactly one provider per solution unless a migration is in progress and documented.
- Migrations live with the persistence project; apply through `mise run migration-apply-<env>`, never by hand. Production migration scripts are generated (`migration-script-prod`) and reviewed before apply.
- Schema snapshots for documentation are generated into `docs/generated/db-schema.md`.

## Testing

- xUnit + NSubstitute (not Moq) + Shouldly or plain `Assert`; one assertion library per repository.
- Test names: `MethodName_Scenario_ExpectedResult`.
- Integration tests use `Testcontainers.PostgreSql` (and RabbitMQ/MsSql modules as needed) with `Microsoft.AspNetCore.Mvc.Testing`; mark them `[Trait("Category", "Integration")]` so CI can run `--filter "Category!=Integration"` on agents without Docker and `Category=Integration` where Docker exists.
- Coverage: `coverlet.collector` with a root `CodeCoverage.runsettings`; publish Cobertura in Azure DevOps. See [Testing](testing.md).

## PR validation

Use [`configs/azure-devops/pr-validate-dotnet.yml`](../../configs/azure-devops/pr-validate-dotnet.yml): restore tools and packages, build, unit tests with coverage, integration tests, publish results, `dotnet format` style gate, informational vulnerability scan.
