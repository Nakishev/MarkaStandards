# Azure DevOps Pipeline Templates

PR validation pipelines lifted from StaffManagement (`Infrastructure/Pipelines/marka-tech/pr/`), the reference implementation. Standard text: [Delivery — CI/CD Pipelines](../../docs/standards/delivery.md#cicd-pipelines).

| File | What it gates | Adjust |
|---|---|---|
| `pr-validate-dotnet.yml` | restore tools + packages, build, unit tests (`Category!=Integration`) with coverage, integration tests, publish TRX + coverage, `dotnet format <sln> --verify-no-changes --severity warn --no-restore` (IMPORTS-filtered), informational `dotnet list package --vulnerable` | `MySolution.sln`, `paths.include`, `.NET SDK` version |
| `pr-validate-webapp.yml` | `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test`, `build`, and the pinned Gitleaks template | `directory`, `paths.include`, pnpm/corepack versions |
| `steps-gitleaks.yml` | Reusable Gitleaks v8.30.1 download, checksum verification, and repository scan | Keep alongside the pipelines that include it |
| `pr-conventional-commit-validate.yml` | PR title (or source commit) passes commitlint conventional config **and** contains a work item reference `#123` | commitlint version; drop the work-item check for repositories without Azure Boards |

## Install

```bash
mkdir -p infrastructure/pipelines/pr
cp configs/azure-devops/pr-*.yml configs/azure-devops/steps-gitleaks.yml infrastructure/pipelines/pr/
```

1. Create one pipeline per file in Azure DevOps (Pipelines → New → Existing YAML).
2. Repos → Branches → `dev` and `main` → Branch policies → Build validation → add each pipeline as **Required**.
3. The style gate fails on formatter or analyzer findings. The IMPORTS-only compatibility filter remains for legacy import ordering.

## Branch policies and small projects

For Azure Repos, add the validation pipeline as a **Required** build-validation branch policy on every PR target and run it on every trunk commit. A small trunk-based project may narrow the branch trigger list to its one trunk (for example, `main` or `master`) while retaining these PR build-policy instructions and the same build, test, style, coverage, and Gitleaks steps.

## Notes

- `fetchDepth: 0` is required for the commit-range fallback and for the synthetic merge commit (`HEAD^2`) that Azure Repos build validation checks out.
- `UseNode@1` replaces the deprecated `NodeTool@0`.
- Level 4 gates (SonarQube, Snyk) belong on the deploy pipelines; SonarQube Community Build cannot analyze PRs. Record that in an ADR.
- Scheduled maintenance pipelines (backups, dev DB refresh) are in `marka-infrastructure/azuredevops/pipelines/`; use them as the pattern for `infrastructure/pipelines/maintenance/`.
