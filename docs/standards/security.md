# Security

## Hard Floors (all projects, all maturity levels)

These rules do not scale down with project size:

1. **No secrets in git.** API keys, connection strings with credentials, SAS URLs, passwords, tokens, private keys and service-account files, browser auth state (Playwright `.auth/`), archives of local config, and Terraform state or saved plan files (`tfplan`, `*.tfplan`) are never committed. Use the mechanisms in [Secrets Management](#secrets-management).
2. **No personal data in git.** CVs, tax profiles, customer exports, and production database dumps are data, not code. Keep them in Blob Storage or the database, and load them at runtime.
3. **Every deployed HTTP endpoint is authenticated**, unless an ADR states why it is intentionally public (health probes, public marketing pages).
4. **Secret scanning runs** in CI or as a local hook (Gitleaks) on every repository that has a pipeline.

If an existing private or training repository violates a floor, the repository's `docs/exec-plans/` must contain a plan (active or deferred) that names the violation and the remediation; the violation is then a known deviation, not an unknown one.

## External Access

Ensure secure and controlled external access to Marka's internal resources by following these best practices and guidelines.

### Access to Internal Resources

- **VPN Access**: Use the provided OpenVPN profiles and certificates to securely access Marka's internal resources. Regularly update profiles and revoke access for inactive users to maintain security.
- **Endpoint Restrictions**: Limit external access to only the endpoints essential for functionality. Ensure these endpoints are well-documented and monitored.

### Secure Database Access

- **Private Network Integration**:
  - Use **Azure Private Link** or **Azure Virtual Network (VNet)** to restrict access to databases containing sensitive information. This ensures that traffic flows securely within the internal network.
  - Avoid exposing databases directly to the internet.
- **Firewall Configuration**:
  - Configure firewalls to restrict database access.
  - Allowlist only specific external IP addresses of trusted users or systems that require database access.
  - Regularly review and update firewall rules to remove obsolete or unnecessary entries.

### Web Application Protection

- **Azure Web Application Firewall (WAF)**:
  - Deploy Azure WAF to protect web applications from common vulnerabilities such as SQL injection, cross-site scripting (XSS), and DDoS attacks.
  - Regularly update WAF rules and monitor traffic to identify potential threats.
- **HTTPS Enforcement**:
  - Use HTTPS to encrypt all web traffic.
  - Implement SSL/TLS certificates and renew them automatically using tools like Let's Encrypt or Azure Key Vault.

### Authentication and Authorization

- **Secure Authentication**:
  - Enforce strong, multi-factor authentication (MFA) for accessing sensitive resources.
  - Integrate with identity providers such as Microsoft Entra ID (formerly Azure Active Directory) for centralized user management.
- **Granular Authorization**:
  - Follow the principle of least privilege (PoLP) by granting users only the minimum permissions needed for their roles.
  - Use role-based access control (RBAC) to manage and audit user permissions effectively.
- Self-hosted identity provider: When self-hosting is required and reasonable for the project, use Keycloak as the primary choice for production-grade authentication and authorization.
- Application APIs: JWT bearer authentication (Entra ID, Keycloak, or Firebase for internal apps) on every controller/router; service-to-service and Function endpoints use an API key or managed identity at minimum. StaffManagement's dual-scheme JWT setup (`docs/authentication-dual-scheme.md` in that repository) is the reference implementation for .NET.
- Pipelines and cloud access: use Workload Identity Federation (OIDC) service connections in Azure DevOps instead of stored service principal secrets. The Terraform in `marka-infrastructure/azuredevops/` creates such a connection and is the reference.

### Monitoring and Auditing

- **Logging and Alerts**:
  - Enable logging for VPN connections, database access, and web application traffic.
  - Set up automated alerts for unauthorized access attempts or anomalies.
- **Regular Audits**:
  - Conduct periodic audits of external access points, firewall rules, and access logs.
  - Document findings and resolve any identified risks promptly.

## Vulnerability and Dependency Management

Regularly scan for vulnerabilities across application code, dependencies, containers, and infrastructure-as-code. Promptly address discovered issues to maintain security and stability.

Standard tool: Snyk (Code/SAST, Open Source/SCA + licenses, Container, IaC).

- Baseline (all projects with a pipeline): projects are imported into Snyk (`snyk monitor --all-projects` from the developer machine or CI) so they appear in the weekly Snyk report e-mailed to the owner. The weekly report is reviewed and critical findings become work items.
- Informational CI step (Level 2): `dotnet list package --vulnerable --include-transitive`, `pnpm audit`, or `pip-audit` runs on every PR with `continueOnError: true`, so drift is visible in the pipeline log.
- Gating (Level 4): `snyk test` / `snyk code test` / `snyk container test` / `snyk iac test` with `--severity-threshold=high` fail the pipeline. Use the official Azure DevOps extension for PR annotations, or the CLI (see [Delivery — CI/CD](delivery.md#cicd-pipelines) for the YAML).
- Ignore policy: Use a `.snyk` policy file for time-bound ignores with a documented reason. Avoid permanent ignores.
- Secrets: Store `SNYK_TOKEN` in Azure DevOps variable groups or Key Vault; pass via environment variables only. Never commit tokens or echo them in logs.
- Container and registry: Scan images post-build; optionally connect ACR to Snyk for registry scanning.
- Remediation targets (Level 3 and above): fix critical within 7 days; high within 30 days; medium/low per team risk assessment with documented exceptions. Below Level 3, record deferred vulnerable-dependency upgrades in `docs/exec-plans/deferred/` with the reason.
- Dependency hygiene: pin or constrain versions where feasible; commit lock files; schedule routine (e.g., monthly) dependency update PRs. See [Automated Dependency Updates](workflow.md#automated-dependency-updates).

## Secrets Management

Where secrets live, by context:

| Context | Mechanism |
| --- | --- |
| Local development, .NET | `dotnet user-secrets` (each Web.Host has a `UserSecretsId`) or `mise.local.toml` (gitignored) |
| Local development, Node/Python | `.env` / `.env.local` (gitignored) plus a committed `.env.example` with placeholder values |
| CI/CD | Azure DevOps secret variables or variable groups linked to Key Vault; never plain `variables:` or inline task inputs (such as a `ConnectionString:`) with real values in YAML |
| Runtime (Container Apps, Functions, App Service) | Container App secrets / app settings populated from the pipeline, or Key Vault references with managed identity |
| Terraform | `TF_VAR_*` from `mise.local.toml` or pipeline secret variables; `sensitive = true` and no `default` on the variable (an unused default is still a committed secret); never `.tfvars` with real values in git |
| Compose stacks on the VM | `.env` next to the compose file on the host, not in the repository; compose files reference `${VAR}` instead of literal keys |
| Kubernetes / Helm | Secret manifests and values files in git carry placeholders only; real values come from Key Vault (Secrets Store CSI driver or External Secrets) or the deploy pipeline |

Rules:

- Add a [`configs/`](../../configs/README.md) `.gitignore` template in the repository's first commit. An ignore rule does not untrack a file that is already committed: when you add a rule for a tracked file, run `git rm --cached <path>` and treat the file's values as leaked.
- Example and template files (`.env.example`, `*.tfvars.example`, `*.parameters.example.json`) hold placeholders only. Write them by hand; never copy the real file and blank out some values.
- Do not share local config by committing an archive of it. The templates ignore `*.zip`, `*.7z`, `*.tar.gz`, and similar; allow a real asset with a `!path/to/asset.zip` exception.
- Store production secrets in Azure Key Vault and reference them via Azure DevOps variable groups; do not commit secrets.
- Never echo secrets in logs or include them in PR descriptions/screenshots.
- Prefer managed identities/service principals with least privilege; prefer WIF/OIDC over client secrets for pipelines.
- Rotate credentials regularly and document rotation procedures.
- Enable secret scanning in at least one required validation pipeline covering every PR and every trunk commit. Auxiliary pipelines do not need to repeat the scan. Use the pinned reusable template [`configs/azure-devops/steps-gitleaks.yml`](../../configs/azure-devops/steps-gitleaks.yml), which verifies the release checksum before running Gitleaks.

- On a leak: rotate the credential first, then remove it from history (`git filter-repo`) and force-push with the team's agreement. Removal without rotation is not remediation.

## Data Handling

- Personal data (employees, candidates, customers) stays in the system of record (database, Blob Storage) with access control. Do not copy it into repositories, test fixtures, or local files that outlive the task.
- Test data is synthetic. When a realistic dataset is required, anonymize it and document the anonymization step.
- Production database dumps pulled to a developer machine for migration rehearsal are deleted when the rehearsal ends; the backup pipelines in Azure DevOps (see [Delivery — Backup Policy](delivery.md#backup-policy)) are the retained copy.
- AI/LLM usage with customer data follows the provider rules in [AI/LLM in Development](ai-development.md).
