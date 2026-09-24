# Web Frontend (React / TypeScript)

Conventions for browser applications. Backend conventions live in [.NET](dotnet.md) and [Python](python.md).

## Tooling

- Package manager: `pnpm` (pinned via `packageManager` in `package.json` and in `mise.toml`). CI installs with `pnpm install --frozen-lockfile`.
- Build: `vite` for SPAs; `next` (App Router) when server rendering or routing conventions are needed.
- Language: TypeScript, `strict: true`. `tsc --noEmit` is the `typecheck` task and runs in CI.
- Lint + format: `Biome` only (no ESLint, no Prettier). Start from [`configs/javascript-typescript/biome.json`](../../configs/javascript-typescript/biome.json). Keep `recommended: true`; disable individual rules with a comment explaining why, not wholesale.
- Styling: Tailwind CSS v4; shared primitives from Radix/shadcn. Put design tokens in one place (`DESIGN.md` + the Tailwind theme) and reference them, not raw values.
- Data: TanStack Query for server state, TanStack Table for tables, `zustand` for the little client state that remains, `zod` for runtime validation of API responses and forms.
- Tests: Vitest + Testing Library for units and components (`*.test.tsx`), Playwright for end-to-end (`playwright-tests/` or `e2e/`). See [Testing](testing.md).
- Analytics/observability: PostHog or Application Insights JS SDK; never send personal data in event properties.

Required `package.json` scripts (the `mise` tasks call these):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

## Components

- Define component props with a TypeScript `interface` named `<Component>Props`.
- Keep hooks at the top of the component, effects after other hooks, and early returns (loading/error) before render logic. Move reusable helpers out of the component file.
- One component per file; colocate its test (`Button.test.tsx`) and, if any, its story.
- Put API access behind typed client functions (generated from OpenAPI with NSwag/Kiota where the backend exposes a spec, otherwise hand-written with `zod` schemas). Components never call `fetch` directly.

## Project layout

```
src/
├── app/ or routes/     Route components (Next: app/; Vite: routes/)
├── components/         Shared UI components
├── features/<name>/    Feature modules: components, hooks, api, tests
├── lib/                Framework-agnostic helpers
├── data/               Static content (e.g. user-facing changelog)
└── test/               Test setup and shared fixtures
```

## Environment configuration

- Only `VITE_*` / `NEXT_PUBLIC_*` variables reach the browser; treat them as public.
- Commit `.env.example`; gitignore `.env`, `.env.local`, and any `.env.<env>` that carries real values. Per-environment public config may be committed when it contains only public endpoints and feature flags.

## PR validation

Use [`configs/azure-devops/pr-validate-webapp.yml`](../../configs/azure-devops/pr-validate-webapp.yml): install with frozen lockfile, `lint`, `typecheck`, `test`, `build`.
