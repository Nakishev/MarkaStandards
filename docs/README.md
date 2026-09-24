# Docs

```
docs/
├── standards/                       The handbook, one topic per file (index in ../README.md)
├── design-docs/
│   └── wide-events-adoption.md      Wide event observability pattern — design proposal and migration plan
└── references/
    └── wide-events-reference.md     Wide event schema reference, patterns, KQL queries
```

- Add or change standards under `standards/`; keep each file about one topic and link between files with relative links.
- Add new design documents under `design-docs/` and reference material under `references/`.
- Architecture decisions for this repository itself go to `adr/` (create on first use) in the format described in [Workflow — Planning and Execution Plans](standards/workflow.md#planning-and-execution-plans).
