# Universal Config Templates

| File | Purpose |
|---|---|
| `.gitignore` | Multi-language universal gitignore covering C# + .NET, Node.js + React + NestJS, Terraform, and common AI editor local folders |

## When to use the universal gitignore

Use this file for **monorepos** or **full-stack projects** that combine multiple languages/frameworks in a single repository (e.g., a .NET backend + React frontend + Terraform IaC).

For single-language projects, prefer the language-specific gitignore from the corresponding `configs/<language>/` folder — it will be more precise and easier to maintain.

## Merging with a language-specific gitignore

If you start with a language-specific gitignore and later expand the repo, you can extend it:

```bash
# Append JS/TS rules to an existing C# gitignore
cat configs/javascript-typescript/.gitignore >> .gitignore

# Or start from the universal file and trim what doesn't apply
cp configs/universal/.gitignore .gitignore
```

## Related standards

- [Version Control and Branching](../../README.md#version-control-and-branching)
