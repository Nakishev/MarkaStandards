# Marka Config Templates

Ready-to-use configuration file templates for all languages and tooling used across Marka projects.

## Structure

```
configs/
├── csharp/                     C# / .NET / ASP.NET Core
│   ├── .editorconfig           Code style and formatting rules (Roslyn-compatible)
│   ├── Directory.Build.props   Repository-wide build settings (nullable, analyzers, lock files)
│   ├── CodeCoverage.runsettings   XPlat coverage settings (Cobertura for Azure DevOps, OpenCover for SonarQube)
│   ├── Directory.Packages.props Central package management with the standard package set
│   ├── .gitignore              Build outputs, secrets, IDE metadata
│   └── .dockerignore           Excludes test projects, build artifacts, secrets
│
├── javascript-typescript/      JS / TS — Next.js, Nest.js, React, Vite, Node
│   ├── .editorconfig           Indent, quote style, line endings
│   ├── .gitignore              node_modules, build outputs, env files, caches
│   ├── .dockerignore           node_modules, test artifacts, env files
│   ├── biome.json              Biome linter + formatter config (replaces ESLint + Prettier)
│   ├── commitlint.config.js    Conventional Commits enforcement via commitlint
│   └── husky/                  Optional local hooks for teams that want pre-commit feedback
│       └── .husky/
│           ├── commit-msg      Runs commitlint on each commit
│           └── pre-commit      Runs lint-staged before each commit
│
├── python/                     Python — FastAPI, scripts, AI services
│   ├── pyproject.toml          uv project with ruff (format + lint), ty, pytest, coverage
│   ├── .editorconfig           Indent style, line length, file endings
│   ├── .gitignore              __pycache__, venv, dist, test artifacts
│   └── .dockerignore           venv, __pycache__, test artifacts, secrets
│
├── terraform/                  Terraform / OpenTofu / Bicep / Pulumi / Ansible
│   ├── .editorconfig           HCL, Bicep, YAML, JSON indent rules
│   └── .gitignore              State files, .terraform/, tfvars, plan files
│
├── mise/
│   └── mise.toml               Task runner starter with the canonical task names
│
├── azure-devops/               PR validation pipelines (.NET, webapp, conventional commits)
│   ├── steps-gitleaks.yml        Pinned Gitleaks secret scan
│   ├── pr-validate-dotnet.yml
│   ├── pr-validate-webapp.yml
│   ├── pr-conventional-commit-validate.yml
│   └── README.md
│
└── universal/
    └── .gitignore              Multi-language universal gitignore
                                (C# + Node + React + Terraform + AI editor folders)
```

## Usage

Copy the relevant files to your project root and adjust to fit your project's needs.
All files are starting points — add project-specific overrides on top.

### Every project

```bash
cp configs/mise/mise.toml ./                 # then delete tools/tasks you do not use
mkdir -p docs/exec-plans/{active,completed,deferred} docs/adr
```

### Quick start (C# project)

```bash
cp configs/csharp/.editorconfig             ./
cp configs/csharp/Directory.Build.props     ./
cp configs/csharp/Directory.Packages.props  ./   # then remove Version="..." from every PackageReference
cp configs/csharp/.gitignore                ./
cp configs/csharp/.dockerignore             ./
rm -f .csharpierrc* .csharpierignore             # CSharpier is retired; dotnet format is the formatter
```

### Quick start (JS/TS project)

```bash
cp configs/javascript-typescript/.editorconfig        ./
cp configs/javascript-typescript/.gitignore           ./
cp configs/javascript-typescript/.dockerignore        ./
cp configs/javascript-typescript/biome.json           ./
cp configs/javascript-typescript/commitlint.config.js ./

# Install commitlint for CI/PR validation
pnpm add -D @commitlint/cli @commitlint/config-conventional

# Optional: install local Husky hooks for faster pre-commit feedback
pnpm add -D husky lint-staged
pnpm exec husky init
cp configs/javascript-typescript/husky/.husky/commit-msg  .husky/commit-msg
cp configs/javascript-typescript/husky/.husky/pre-commit  .husky/pre-commit
chmod +x .husky/commit-msg .husky/pre-commit
```

### Quick start (Python project)

```bash
cp configs/python/pyproject.toml ./   # merge with the existing file if there is one
cp configs/python/.editorconfig  ./
cp configs/python/.gitignore     ./
cp configs/python/.dockerignore  ./
uv sync
```

### Quick start (Terraform / IaC)

```bash
cp configs/terraform/.editorconfig  ./
cp configs/terraform/.gitignore     ./
```

### Quick start (Azure DevOps PR validation)

See [`azure-devops/README.md`](azure-devops/README.md).
