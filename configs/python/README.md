# Python Config Templates

| File | Purpose |
|---|---|
| `.editorconfig` | 4-space indentation, LF line endings, PEP 8 line length (88 = Black default), file-type overrides |
| `.gitignore` | `__pycache__`, virtual environments, dist artifacts, test results, type-checker caches |
| `.dockerignore` | Virtual environments, byte-code, test artifacts, secrets — for Python Docker images |

## .editorconfig notes

- `max_line_length = 88` for `.py` files — matches [Black](https://black.readthedocs.io/) and [Ruff](https://docs.astral.sh/ruff/) defaults
- JSON and YAML files use 2-space indentation (common in config/CI files)
- Makefiles and batch files use tabs (required by their syntax)

## Recommended tooling

| Tool | Purpose | Install |
|---|---|---|
| [Ruff](https://docs.astral.sh/ruff/) | Fast linter + formatter (replaces Flake8 + isort + Black) | `pip install ruff` |
| [mypy](https://mypy-lang.org/) | Static type checking | `pip install mypy` |
| [pytest](https://pytest.org/) | Test runner | `pip install pytest` |
| [pre-commit](https://pre-commit.com/) | Git hooks for lint/format | `pip install pre-commit` |

### Ruff configuration (add to `pyproject.toml`)

```toml
[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "UP", "B", "SIM"]
ignore = []

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

### pre-commit configuration (`.pre-commit-config.yaml`)

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
```

## Related standards

- [Linters and Formatters](../../README.md#linters-and-formatters)
- [Containerization](../../README.md#containerization)
