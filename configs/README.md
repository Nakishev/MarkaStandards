# Marka Config Templates

Ready-to-use configuration file templates for all languages and tooling used across Marka projects.

## Structure

```
configs/
├── csharp/                     C# / .NET / ASP.NET Core
│   ├── .editorconfig           Code style and formatting rules (Roslyn-compatible)
│   ├── .gitignore              Build outputs, secrets, IDE metadata
│   └── .dockerignore           Excludes test projects, build artifacts, secrets
│
├── javascript-typescript/      JS / TS — Next.js, Nest.js, React, Vite, Node
│   ├── .editorconfig           Indent, quote style, line endings
│   ├── .gitignore              node_modules, build outputs, env files, caches
│   ├── .dockerignore           node_modules, test artifacts, env files
│   ├── biome.json              Biome linter + formatter config (replaces ESLint + Prettier)
│   ├── commitlint.config.js    Conventional Commits enforcement via commitlint
│   └── husky/
│       └── .husky/
│           ├── commit-msg      Runs commitlint on each commit
│           └── pre-commit      Runs lint-staged before each commit
│
├── python/                     Python — FastAPI, Django, Flask, scripts
│   ├── .editorconfig           Indent style, line length, file endings
│   ├── .gitignore              __pycache__, venv, dist, test artifacts
│   └── .dockerignore           venv, __pycache__, test artifacts, secrets
│
├── terraform/                  Terraform / OpenTofu / Bicep / Pulumi / Ansible
│   ├── .editorconfig           HCL, Bicep, YAML, JSON indent rules
│   └── .gitignore              State files, .terraform/, tfvars, plan files
│
└── universal/
    └── .gitignore              Multi-language universal gitignore
                                (C# + Node + React + Terraform + AI editor folders)
```

## Usage

Copy the relevant files to your project root and adjust to fit your project's needs.
All files are starting points — add project-specific overrides on top.

### Quick start (C# project)

```bash
cp configs/csharp/.editorconfig  ./
cp configs/csharp/.gitignore     ./
cp configs/csharp/.dockerignore  ./
```

### Quick start (JS/TS project)

```bash
cp configs/javascript-typescript/.editorconfig        ./
cp configs/javascript-typescript/.gitignore           ./
cp configs/javascript-typescript/.dockerignore        ./
cp configs/javascript-typescript/biome.json           ./
cp configs/javascript-typescript/commitlint.config.js ./

# Install and set up Husky
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
pnpm exec husky init
cp configs/javascript-typescript/husky/.husky/commit-msg  .husky/commit-msg
cp configs/javascript-typescript/husky/.husky/pre-commit  .husky/pre-commit
chmod +x .husky/commit-msg .husky/pre-commit
```

### Quick start (Python project)

```bash
cp configs/python/.editorconfig  ./
cp configs/python/.gitignore     ./
cp configs/python/.dockerignore  ./
```

### Quick start (Terraform / IaC)

```bash
cp configs/terraform/.editorconfig  ./
cp configs/terraform/.gitignore     ./
```
