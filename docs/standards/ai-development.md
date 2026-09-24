# AI/LLM in Development

AI/LLM-assisted work is part of Marka’s standard development and operational model. Teams should use AI to improve delivery speed, review quality, triage consistency, documentation accuracy, and operational visibility while keeping customer data protection and project constraints explicit.

Provider usage depends on the project type:

- **Commercial/customer projects:** Use only approved enterprise-grade or isolated deployments. Allowed options are self-hosted/private deployments of Azure OpenAI, Enterprise subscriptions from Anthropic, or Enterprise subscriptions from OpenAI. Do not send customer code, customer data, secrets, production telemetry, or sensitive business context to personal, free, trial, or unapproved AI accounts.
- **Internal projects:** No provider restrictions apply by default. Any model or provider may be used if it is appropriate for the task, cost, and data sensitivity. Still avoid exposing secrets and document project-specific exceptions where needed.

AI capabilities are expected to be integrated into operational workflows rather than used only as ad-hoc developer assistance. Marka Agents, deployed at https://agents.marka-development.com, is the standard internal platform for automating AI-assisted reviews, telemetry triage, and operational checks.

## Marka Agents Platform

Use Marka Agents as the operational entry point for AI-assisted development workflows. The platform provides shared navigation for review runs, work item runs, App Insights triage, pull requests, work items, settings, and system health. It centralizes AI findings so teams can see what was analyzed, when it was analyzed, whether the result was published, and what follow-up is required.

Each run should make the following information visible:

- Project, repository, workspace, work item, or pull request being analyzed
- Run status, start time, publication status, and minimum severity
- Summary of the analysis in plain language
- Findings grouped by severity, category, and related code/work item context
- Links back to Azure DevOps or the relevant operational system
- Clear suggested actions for the assignee, reviewer, or project lead

## Work Item Review Workflow

Use the work item review workflow to improve backlog quality before implementation starts and to detect unclear or incomplete issues. A work item review should be run for bugs, features, tasks, and technical debt items that are ready for grooming, planning, or implementation.

The review should check whether the work item contains enough information to act safely:

- Reproduction steps for bugs, including the specific screen, dialog, endpoint, or workflow affected
- Expected behavior and actual behavior
- Environment and context such as project, user role, browser, feature flags, deployment slot, or tenant
- Acceptance criteria or a testable target state
- Related commits, builds, pull requests, incidents, dependencies, or previous work items
- Attachments, screenshots, logs, or telemetry links when they materially clarify the issue

When the analysis identifies missing information, the item should be marked as needing clarification instead of treated as ready for implementation. The assignee or product owner should update the work item directly in Azure DevOps, then re-run the review or wait for the next scheduled run. Published findings should be used as actionable backlog hygiene feedback, not as a replacement for product ownership.

## Pull Request Review Workflow

Use the pull request review workflow as an additional quality gate before merge. It complements human review and CI checks by analyzing code changes, linked work items, dependency changes, configuration changes, and project-specific risk areas.

The PR review should evaluate:

- Correctness risks introduced by the diff
- Regression risks in business logic, persistence, concurrency, configuration, infrastructure, or integrations
- Missing or weak tests for changed behavior
- Unsafe handling of secrets, telemetry, customer data, or production configuration
- Dependency or container changes that may affect deployment or runtime behavior
- Whether linked work items and PR descriptions explain the intent, validation, and rollout concerns

Findings should be grouped by severity and eligibility for publication. Blocking findings should result in requested changes or follow-up commits before merge. Non-blocking findings may be handled as comments, follow-up tasks, or documented exceptions. Human reviewers remain responsible for the final merge decision; AI review results provide structured risk signals and suggested fixes.

## App Insights Monitoring Workflow

Use the App Insights workflow for manual or scheduled telemetry triage against configured Log Analytics workspaces. It is intended for application health review, incident discovery, and recurring operational checks across environments.

The workflow should analyze telemetry for:

- Exceptions, failed requests, dependency failures, and abnormal status-code patterns
- Spikes or regressions in error rate, response time, dependency duration, or availability
- Repeated incidents connected to the same service, endpoint, tenant, customer scenario, or deployment
- Missing or low-quality telemetry that prevents root-cause analysis
- Correlation between incidents, recent releases, pull requests, work items, or infrastructure changes

Each App Insights run should show the workspace analyzed, start time, incident count, publication status, and query scope. Findings should summarize the suspected operational impact and include links or query context needed for engineers to reproduce the investigation. Use this workflow to create or enrich work items when telemetry indicates a user-facing defect, reliability risk, or observability gap.

## Publishing, Traceability, and Follow-up

AI findings should be published only when they are useful to the team and have sufficient context for action. Published findings should link back to the source work item, pull request, review run, or App Insights run. For commercial/customer projects, ensure that any published AI-generated text does not expose secrets, personal data, customer-confidential context, or internal-only infrastructure details beyond the intended audience.

Teams should treat Marka Agents output as an auditable operational signal:

- Review critical and high-severity findings before merge or release.
- Track unresolved work item clarification findings during backlog grooming.
- Convert recurring App Insights findings into engineering tasks or observability improvements.
- Document accepted risks or false positives in the linked work item or pull request.
- Re-run analysis after material changes when the original finding affected merge or release readiness.

When adding new AI/LLM automation to a project, document the provider, model family, data categories sent to the model, retention assumptions, approval scope, and fallback behavior in the project README or ADRs.

## Agent Instruction Files and Skills

AI coding agents (Claude Code, Codex, Cursor, Copilot, PI) are part of the daily workflow. Every repository gives them the same instructions a new team member would get:

- `AGENTS.md` at the repository root is the canonical instruction file: repository shape, documentation map, task runner usage, conventions, plan lifecycle, validation expectations, and secrets policy. Nested `AGENTS.md` files may add directory-scoped rules (e.g. `webapp/AGENTS.md`).
- `CLAUDE.md` is a thin adapter that imports `AGENTS.md` (`@AGENTS.md`); do not duplicate content. The same applies to `.cursor/rules`, `.github/copilot-instructions.md`, and similar harness files: pointer, not copy.
- Project skills live in `.agents/skills/<name>/SKILL.md` (with `evals.json` where the skill has a testable outcome) and are symlinked into `.claude/skills/`. Skills encode repository-specific procedures (design-system checks, IDE tooling, deploy runbooks), not general knowledge.
- Hooks (e.g. `.claude/hooks/post-edit-check.sh` running `tsc --noEmit` after edits) are acceptable when they are fast and deterministic.
- Plans an agent produces go to `docs/exec-plans/active/` and follow the lifecycle in [Workflow — Planning and Execution Plans](workflow.md#planning-and-execution-plans).
- Agents never commit, push, deploy, or change secrets on their own; the developer reviews the diff and runs `mise run verify` before any of those.
- Do not commit agent memory or session state (`.brv/`, `.claude/settings.local.json`, tool caches); gitignore them. Generic MCP-tool boilerplate that does not describe the repository does not belong in `AGENTS.md` or `copilot-instructions.md`.
- Agent identities that appear as commit authors ("Cursor Agent", "T3 Code") are acceptable in small projects; in team projects the developer is the author and the agent is mentioned in the body (`Co-authored-by:`).

---

