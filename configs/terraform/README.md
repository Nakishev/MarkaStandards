# Terraform / IaC Config Templates

| File | Purpose |
|---|---|
| `.editorconfig` | 2-space indentation for HCL, Bicep, YAML, JSON; LF line endings |
| `.gitignore` | State files, `.terraform/`, tfvars, plan files, Pulumi secrets, Bicep ARM output |

## .gitignore notes

### What to commit vs what to ignore

| Item | Commit? | Notes |
|---|---|---|
| `*.tf` source files | ✅ Yes | All Terraform source code |
| `.terraform.lock.hcl` | ✅ Yes | Commit in application repos; optional in reusable modules |
| `*.tfvars` / `*.tfvars.json` | ❌ No | May contain secrets; use `*.tfvars.example` templates instead |
| `*.tfstate` / `*.tfstate.*` | ❌ Never | Use remote state (Azure Blob, Terraform Cloud) |
| `.terraform/` directory | ❌ No | Provider plugins; restored by `terraform init` |
| `*.tfplan` | ❌ No | Generated artifacts; store in CI only if needed |
| `Pulumi.*.yaml` | ❌ No | Stack files may contain encrypted secrets |
| `Pulumi.yaml` | ✅ Yes | Project definition file |
| `*.parameters.json` | ❌ No | ARM/Bicep parameter files may contain secrets; use `.parameters.example.json` |

## Remote state (Terraform — Azure Blob)

```hcl
# infrastructure/iac/backend.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate-prod"
    storage_account_name = "satfstatemarka"
    container_name       = "tfstate"
    key                  = "project-name.terraform.tfstate"
  }
}
```

Store backend config values in `backend.config` (gitignored) and pass via:

```bash
terraform init -backend-config=backend.config
```

## Recommended tooling

| Tool | Purpose |
|---|---|
| [terraform fmt](https://developer.hashicorp.com/terraform/cli/commands/fmt) | Format HCL files |
| [terraform validate](https://developer.hashicorp.com/terraform/cli/commands/validate) | Validate configuration |
| [tflint](https://github.com/terraform-linters/tflint) | Linting and best-practice checks |
| [Checkov](https://www.checkov.io/) | IaC security scanning (alternative/complement to Snyk IaC) |
| [az bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install) | Bicep CLI for build/lint/publish |

## Related standards

- [Infrastructure as Code (IaC)](../../README.md#infrastructure-as-code-iac)
- [CI/CD Pipelines](../../README.md#cicd-pipelines)
- [Secrets Management](../../README.md#secrets-management)
