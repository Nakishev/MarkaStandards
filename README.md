![Marka Logo](Assets/logo.png)

# Marka Engineering Standards

This repository presents Marka’s official processes, standards, and best practices. It ensures that all teams operate with consistency, quality, and efficiency, while maintaining alignment with organizational goals. Use it as the reference for standard operating procedures, technical conventions, and recommended workflows across all projects and departments within Marka.

**Table of Contents**

- [How to read this handbook](#how-to-read-this-handbook)
- [Repository Structure](#repository-structure)
- [Applicability and Exceptions](#applicability-and-exceptions)
- [Process Maturity Levels](#process-maturity-levels)
- [Small and Educational Projects](#small-and-educational-projects)
- [Hard Floors](#hard-floors)
- [Standards by Topic](#standards-by-topic)
- [Reference Repositories](#reference-repositories)
- [Official Resources](#official-resources)

---

## How to read this handbook

1. Decide the project's **maturity level** (below) at kick-off and write it in the repository `README.md` and `AGENTS.md`.
2. Read the topic documents under [`docs/standards/`](docs/standards/) that apply to the stack.
3. Copy the matching templates from [`configs/`](configs/README.md) into the repository.
4. Record every deviation as an ADR or an entry in `docs/exec-plans/` in the project repository (see [Applicability and Exceptions](#applicability-and-exceptions)).

## Repository Structure

```
MarkaStandards/
├── README.md                       This document — scope, maturity levels, hard floors, index
│
├── docs/
│   ├── standards/                  The handbook, one topic per file
│   │   ├── workflow.md             Collaboration, planning (exec-plans, ADRs), mise, Git, commits, PRs
│   │   ├── dotnet.md               .NET / ASP.NET Core conventions
│   │   ├── web-frontend.md         React / TypeScript conventions
│   │   ├── python.md               Python / FastAPI conventions
│   │   ├── api.md                  Web API conventions and API documentation
│   │   ├── observability.md        Logging, metrics, tracing, wide events, uptime monitoring
│   │   ├── testing.md              Test types, coverage, tooling
│   │   ├── delivery.md             Containers, Azure, CI/CD, SonarQube, IaC, backups, project docs
│   │   ├── security.md             Hard floors, external access, Snyk, secrets, data handling
│   │   ├── ai-development.md       AI provider rules, Marka Agents, agent instruction files
│   │   └── hr.md                   Onboarding and qualification tracking (Staff Management)
│   ├── design-docs/                Design proposals (e.g. wide events adoption)
│   └── references/                 Field references (schemas, patterns, query examples)
│
├── configs/                        Ready-to-use templates (copy into your project)
│   ├── csharp/                     .editorconfig, Directory.Build.props, Directory.Packages.props, .gitignore, .dockerignore
│   ├── javascript-typescript/      .editorconfig, biome.json, commitlint.config.js, .gitignore, .dockerignore, optional Husky hooks
│   ├── python/                     pyproject.toml (ruff/ty/pytest), .editorconfig, .gitignore, .dockerignore
│   ├── terraform/                  .editorconfig, .gitignore
│   ├── mise/                       mise.toml starter with the canonical task names
│   ├── azure-devops/               PR validation pipelines (.NET, webapp, conventional commits)
│   └── universal/                  Universal multi-language .gitignore (monorepos)
│
└── Assets/                         Screenshots and diagrams referenced by the documents
```

## Applicability and Exceptions

While this handbook defines Marka’s standards, some projects (e.g., small scope, legacy constraints, tech‑stack limitations, budget restrictions, limited cloud availability, or explicit customer requirements) may treat it as guidance and best practices rather than strict policy. In such cases, apply these principles pragmatically and document any deviations and their rationale in the project’s README, an ADR under `docs/adr/`, or a plan under `docs/exec-plans/` (see [Workflow — Planning and Execution Plans](docs/standards/workflow.md#planning-and-execution-plans)). A deviation that is written down is a decision; one that is not is a defect.

## Process Maturity Levels

Use the following levels to describe and plan the maturity of a project’s processes relative to Marka’s standards:

- Level 1 — Baseline (Guideline Adoption)
  - Basic branching and PRs; tests for business logic changes; manual or simple scripted deployments acceptable.
  - Core code style followed informally; minimal logging/monitoring; ad‑hoc backups.
  - Document deviations and a plan to improve where practical.
- Level 2 — Standardized (Core Standard)
  - Enforced code style and PR process; CI with lint/format/build/unit tests and published coverage. Coverage thresholds are not required until Level 3.
  - Containerized services with health checks; environments (dev/stage/prod) with approvals; secrets via Key Vault.
  - Basic observability and release tagging; documented rollback procedures.
- Level 3 — Advanced (Full Standard)
  - Comprehensive observability (OTel logs/metrics/traces, Azure AppInsights, Azure Log Workspaces); code coverage thresholds (≥80% overall, ≥90% for critical modules) with reports published in Azure DevOps; IaC for infra; scheduled maintenance pipelines (Azure DevOps); uptime monitoring (Azure Monitor, Uptime Kuma); and governance (Azure Policy, budgets, tags).
  - Formal architecture/ADRs; per‑service README with run/test/deploy instructions.
- Level 4 — Secure & Intelligent (Elite Standard)
  - Security-by-default gates: mandatory approved security scans on PRs and main (Snyk is the recommended default for Code/SAST, Open Source/SCA+licenses, Container, and IaC); fail on high/critical by default; nightly/weekly scheduled scans and registry scanning; documented remediation SLAs (critical ≤7 days, high ≤30 days).
  - Deep code quality analysis: SonarQube CE integrated into pipelines; coverage imported; enforce Quality Gate on new code (coverage ≥80% on new code, duplication ≤3%, Maintainability and Reliability ratings A); block merges on gate failure.
  - Secrets protection: all secrets in Key Vault; mandatory secret scanning (e.g., Gitleaks) in CI and at repo host; pipelines fail on detected secrets.
  - Coverage as a gate: branch and line coverage thresholds enforced per component; critical modules target ≥90% line and meaningful branch coverage; publish risk hotspots and coverage dashboards in Azure DevOps.
  - Supply chain hardening: pin/lock dependencies; signed container images where applicable; container base images kept current; container scanning gates active on images built in CI.
  - Governance & compliance: policy‑as‑code (Azure Policy), environment approvals and audit trails, release tagging and changelogs; periodic security/quality reviews with action items tracked.

Define the current and target maturity level at project kick‑off and revisit each quarter or major release.

## Small and Educational Projects

Many Marka repositories are internal tools, training projects, demos, or one-developer products. A project qualifies as **small/educational** when its risk is low, it has one or two active developers, and it has no external customer or real personal/third-party production data. One maintainer alone does not qualify a project that manages shared production infrastructure or real personal or third-party production data. Qualifying projects may use the listed delivery simplifications; everything else, including the hard floors, applies as written.

| Area | Small/educational project | Reference |
| --- | --- | --- |
| Branching | Trunk-based on `main`/`master`; short-lived branches optional; release tags required | [Workflow](docs/standards/workflow.md#small-and-educational-projects) |
| Pull requests | Optional for a single developer; AI PR review before deploying user-facing changes | [Workflow](docs/standards/workflow.md#code-review-and-pull-requests) |
| Commits | Conventional Commits, validated locally (optional hook), not in CI | [Workflow](docs/standards/workflow.md#commit-message-validation) |
| Planning | Work items + `docs/exec-plans/`; no sprints | [Workflow](docs/standards/workflow.md#planning-and-execution-plans) |
| CI | One validation pipeline (build, unit tests, style gate) on the trunk; deployment may be manual via `mise run deploy-<target>` | [Delivery](docs/standards/delivery.md#cicd-pipelines) |
| Tests | Unit tests for business logic; integration tests where Docker is available; coverage published, no threshold | [Testing](docs/standards/testing.md) |
| Observability | Application Insights + health endpoint; wide events when debugging needs them | [Observability](docs/standards/observability.md#low-scale-solutions-demo-training-etc-projects) |
| Security scanning | Project imported into Snyk for the weekly report; informational `dotnet list package --vulnerable` / `pnpm audit` step | [Security](docs/standards/security.md#vulnerability-and-dependency-management) |
| Infrastructure | Terraform may be applied from a developer machine; plan output attached to the work item | [Delivery](docs/standards/delivery.md#infrastructure-as-code-iac) |
| Documentation | `README.md`, `AGENTS.md`, `docs/exec-plans/`; ADRs only for hard-to-reverse decisions | [Workflow](docs/standards/workflow.md#planning-and-execution-plans) |

Non-deployable documentation, library, and script projects do not need containers, IaC, or monitoring. Kubernetes compatibility is required only when Kubernetes is a deployment target. The [Hard Floors](#hard-floors) still apply. Record risk-based eligibility and any transition in `docs/exec-plans/active/`.

## Hard Floors

These rules do not scale down with project size or maturity level. Full text: [Security — Hard Floors](docs/standards/security.md#hard-floors-all-projects-all-maturity-levels).

1. No secrets in git (keys, connection strings, SAS URLs, service-account files, browser auth state, config archives, Terraform state/plan files).
2. No personal data in git (CVs, tax data, customer exports, production dumps).
3. Every deployed HTTP endpoint is authenticated unless an ADR says why it is public.
4. Secret scanning (Gitleaks) runs in at least one required validation pipeline that covers every pull request and every trunk commit; auxiliary pipelines do not need duplicate scans.

A private or training repository that currently violates a floor records the violation and its remediation in `docs/exec-plans/` so it is a known deviation.

## Standards by Topic

| Document | Covers |
| --- | --- |
| [Workflow](docs/standards/workflow.md) | Communication, project management, planning and execution plans, ADRs, `mise` task runner, Git and branching, Conventional Commits, code style and formatters, code review and PRs, dependency updates, repository hygiene |
| [.NET](docs/standards/dotnet.md) | Toolchain, solution layout, `Directory.Build.props` / central package management, `dotnet format`, ASP.NET Core host conventions, logging, EF Core, testing |
| [Web Frontend](docs/standards/web-frontend.md) | pnpm, Vite/Next, Biome, Tailwind, TanStack, component conventions, environment config |
| [Python](docs/standards/python.md) | uv, ruff, ty, FastAPI structure, logging, AI-specific rules, containers, testing |
| [Web API](docs/standards/api.md) | REST conventions, Problem Details errors, pagination, idempotency, versioning, caching, data formats, API documentation tools |
| [Observability](docs/standards/observability.md) | Low-scale and high-scale logging, OpenTelemetry metrics and tracing, Wide Events, Uptime Kuma |
| [Testing](docs/standards/testing.md) | Test types and requirements per level, coverage policy, tooling, naming |
| [Delivery](docs/standards/delivery.md) | Containerization, project documentation (ADRs, changelogs, test reports), Azure naming and governance, deployment types, CI/CD pipelines, SonarQube, scheduled maintenance pipelines, IaC, backup policy |
| [Security](docs/standards/security.md) | Hard floors, external access, authentication, Snyk vulnerability management, secrets management, data handling |
| [AI/LLM in Development](docs/standards/ai-development.md) | Provider rules per project type, Marka Agents workflows, agent instruction files and skills |
| [Human Resources](docs/standards/hr.md) | Onboarding, Staff Management System, skill checks |

Supporting material: [Wide Events Adoption](docs/design-docs/wide-events-adoption.md) (design), [Wide Events Reference](docs/references/wide-events-reference.md) (schema and KQL), [`configs/`](configs/README.md) (templates).

## Reference Repositories

The standards point at real implementations rather than describing them twice:

| Practice | Reference |
| --- | --- |
| PR validation pipelines (.NET, webapp, conventional commits + work item check) | StaffManagement `Infrastructure/Pipelines/marka-tech/pr/` (copied to [`configs/azure-devops/`](configs/azure-devops/README.md)) |
| ADR that records a disabled gate | StaffManagement `docs/adr/0001-backend-pr-sonarqube-validation.md` |
| Dual-scheme JWT authentication in ASP.NET Core | StaffManagement `docs/authentication-dual-scheme.md` |
| Aspire ServiceDefaults with OpenTelemetry | StaffManagement `src/StaffManagement.Aspire/` |
| Wide Events middleware, context, telemetry initializer | StockMate `StockMate.Infrastructure.WebAPI/Observability/` |
| Execution-plan lifecycle and tech-debt tracker | StockMate `docs/exec-plans/`, `AGENTS.md` |
| Project skills with evals, post-edit hooks | StockMate and StaffManagement `.agents/skills/`, `.claude/hooks/` |
| WIF/OIDC service connection via Terraform | marka-infrastructure `azuredevops/main.tf` |
| Scheduled backup pipelines | marka-infrastructure `azuredevops/pipelines/` |
| Python/FastAPI layout with uv and ruff | rag-search-engine `app/`, `pyproject.toml` |

## Official Resources

- [Official Public Site](https://marka-development.com/)
- [Staff Management System](https://wa-staffmanagement-linux-prod.azurewebsites.net)
- [Marka Agents](https://agents.marka-development.com)
- [Marka’s Process Standards (GitHub)](https://github.com/Nakishev/MarkaStandards)
