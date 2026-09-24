# Python Conventions

Conventions for Python services and AI/RAG components. Derived from the `rag-search-engine` (Atlas) repository.

## Toolchain

- Interpreter pinned in `.python-version` and `mise.toml`; `requires-python` in `pyproject.toml` uses a bounded range (`>=3.12,<3.13`). The Dockerfile base image uses the same minor version.
- Package manager: `uv`. `uv.lock` is committed; CI and Docker install with `uv sync --frozen`.
- One `pyproject.toml` at the root holds project metadata, dependencies, dependency groups (`dev`), and tool configuration. Start from [`configs/python/pyproject.toml`](../../configs/python/pyproject.toml).
- `mise` tasks: `dev`, `lint`, `lint-fix`, `typecheck`, `test`, `verify`, `docker-build`. Check that every task refers to a command that exists (`uv run ruff check`, not `ruff type check`).

## Formatting, linting, typing

- `ruff format` and `ruff check` are the only formatter and linter. Enable at least `E, F, I, B, UP, SIM` (see template); `I` alone is not a lint configuration.
- Type checking with `ty` (Astral) or `pyright`; run in `verify` and CI.
- Type hints on all public functions; `pydantic` models at boundaries (API I/O, settings, LLM tool schemas).

## Application structure (FastAPI)

```
app/
├── api/            FastAPI app factory, routers, dependencies, middleware
├── services/       Use cases; orchestrate data and models
├── data/           Repositories and store backends (pgvector, blob, local)
├── models/         Pydantic models and domain types
├── core/           Settings (pydantic-settings), logging, telemetry
└── cli/            Command-line entry points
tests/              pytest, mirrors app/ module names; shared fixtures in conftest.py
scripts/            One-off operational scripts (documented in docs/operations.md)
```

- Layering: `api → services → data`; do not skip layers.
- Settings: `pydantic-settings` reading environment variables; `.env` and `mise.local.toml` are gitignored; `.env.example` is committed.
- Errors: register exception handlers that return RFC 9457 Problem Details (`application/problem+json`); never pass `str(exc)` of an internal exception to the client. See [API conventions](api.md#error-handling-and-status-codes).
- Auth: an API-key or JWT dependency on every router; admin/destructive routes additionally require an admin scope. No unauthenticated destructive endpoints.
- OpenAPI: FastAPI's built-in `/docs` and `/openapi.json` are sufficient; tag routers.
- Health: `/health/live` (static) and `/health/ready` (checks DB, vector store, and model provider reachability).

## Logging and observability

- Structured logging: stdlib `logging` with a JSON formatter, or Loguru with `serialize=True`. Include a request id per request (middleware) and propagate it to outbound calls.
- Application Insights via `azure-monitor-opentelemetry` when deployed to Azure; Langfuse (or another LLM tracer) for prompt/model spans.

## AI-specific

- Model names and embedding models are configuration, not literals in service code.
- Keep an evaluation set (queries + expected results) under `tests/evals/` and a `mise run eval` task; run it before changing chunking, retrieval, or prompts.
- Never commit source documents that contain personal data (CVs, contracts); load them from Blob Storage at index time.
- Schema changes (indexes, tables) go through a migration tool (Alembic) rather than ad-hoc DDL scripts.

## Containers

- Multi-stage Dockerfile: `uv` build stage, slim runtime stage with the same Python minor version, non-root user, `HEALTHCHECK`.
- `docker-compose.yaml` declares only services the code uses; placeholder secrets come from `.env`, not from literals in the compose file.

## Testing

- `pytest` with `pytest-cov`; `[tool.pytest.ini_options]` in `pyproject.toml`.
- Unit tests do not call model providers; use recorded responses or fakes. Integration tests that need PostgreSQL/pgvector use `testcontainers` (`testcontainers[postgres]`).
