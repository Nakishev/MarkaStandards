# Wide Events Adoption

Design proposal preserved as a durable design document for Marka observability decisions and rollout sequencing.

Many backend services emit per-method / per-loop log lines and rely on message text or prefixes for debugging. This makes production debugging slower (many log rows per request, hard to query by business identifiers) and increases noise and cost.

The "wide event" model from [loggingsucks.com](https://loggingsucks.com/) suggests emitting one context-rich event per request per service, built up during request handling and emitted once at completion.

---

## Goals

Make production debugging and ad-hoc analytics fast by:

- Capturing high-cardinality business identifiers (e.g., `accountId`, `portfolioId`, `ticker`, `tradeId`) as first-class queryable fields.
- Emitting one authoritative "request summary" event per service hop (WebAPI request, Function invocation, Next.js server request), instead of many scattered trace lines.
- Keeping application / business layers free of Application Insights-specific types.
- Preserving correlation (trace/operation ids) already provided by Application Insights.

## Non-Goals

- Replacing Application Insights, Prometheus, or Grafana right now.
- Logging full request / response bodies (PII + size risk).
- Perfect tail-sampling across multiple telemetry types (requires collector-level solutions).

---

## Key Constraints (Application Insights)

- Custom dimensions/properties have size limits per key/value and telemetry item size limits, so "wide" must still be curated (avoid huge lists / raw payloads).
- Querying works best with flat key/value properties (nested objects are possible but become JSON-in-string and harder to query).
- Correlation should use W3C trace-context (`traceparent`) where possible.

---

## Proposed Target Design

### 1) What "wide event" means in a Marka project

Adopt a pragmatic version of wide events:

- **Backend**: The canonical wide event is the existing Application Insights `RequestTelemetry` for each incoming request, enriched with a curated set of custom dimensions and metrics.
- **Additional business wide events** are `EventTelemetry` items for key domain actions (e.g., `TradeCreated`, `ImportCompleted`) that are not strictly tied to a single HTTP request or are worth searching independently.
- **Avoid** emitting lots of `TraceTelemetry` as the primary debugging artifact; keep traces for:
  - Unexpected errors/exceptions (with stack)
  - Rare, intentionally-placed "breadcrumb" diagnostics
  - Temporary targeted debug (feature-flagged)

### 2) Wide event schema (flat, prefixed keys)

Create a stable schema with versioning and consistent prefixes. Recommended key groups:

| Group | Keys |
|---|---|
| Schema | `we.schema_version` |
| Request identity | `we.request.route`, `we.request.method`, `we.request.path`, `we.request.query_present`, `we.request.content_length` |
| Auth / user | `we.user.id`, `we.user.account_id`, `we.auth.provider` |
| Business context | `we.account.id`, `we.portfolio.id`, `we.trade.id`, `we.stock.ticker`, `we.period.year`, `we.cache.strategy`, `we.feature.*` |
| Outcome | `we.outcome`, `we.error.type`, `we.error.code`, `we.error.is_retriable` |
| Dependency summary | `we.dep.http.count`, `we.dep.http.fail_count`, `we.dep.http.rate_limited`, `we.dep.http.provider` |
| Caching | `we.cache.hit`, `we.cache.key_prefix` |
| Metrics | `we.request.duration_ms`, `we.items.count`, `we.items.created`, `we.items.skipped`, `we.duration.db_ms`, `we.duration.external_ms`, `we.duration.cache_ms` |

**Rules:**

- Keep values small and query-friendly. Prefer IDs, codes, counts, booleans.
- Do not store secrets, auth headers, tokens, or raw payloads.
- Prefer "prefix + template" over "full string dumps" (avoid `string.Join` of many entities).
- All keys **must** be defined in a `WideEventKeys` constants class in the project.

### 3) How context is accumulated (vendor-agnostic)

Introduce an application-level "wide event context" abstraction:

- `IWideEventContext` — exposes `Add(string key, string|bool|int|decimal)` and `AddMetric(string name, double value)`.
- `IWideEventContextAccessor` — provides access to the "current" context (ambient scope), implemented using `AsyncLocal<T>`.

**Where it lives:**

- Interfaces in `<Project>.Application/Abstractions/Observability/`.
- Implementations in `<Project>.Infrastructure.*/Observability/` so the Application layer does not reference Application Insights SDK.

### 4) Backend emission strategy (WebAPI)

Use middleware + Application Insights enrichment:

1. **Middleware** (early in the pipeline):
   - Creates a new `WideEventContext` scope for the request.
   - Seeds it with request basics (method, path, route template).
   - Captures start time.
   - In `finally`, sets outcome / status / duration.
   - Stores context in both `AsyncLocal` (for in-request service access) and `HttpContext.Items` (for telemetry initializer access after pipeline completes).

2. **Telemetry initializer** (`ITelemetryInitializer`):
   - Enriches `RequestTelemetry` (canonical wide event) by copying context properties/metrics into `RequestTelemetry.Properties` and `RequestTelemetry.Metrics`.
   - Optionally enriches `ExceptionTelemetry` and `DependencyTelemetry` with a small shared subset (e.g., `we.user.id`, `we.request.route`) for easier joins.

**Why enrich `RequestTelemetry` instead of emitting a separate trace log line:**
You already get one request item per request, with correlation id/trace id, status code, duration. You turn the existing "row" into the canonical wide event.

### 5) Instrumentation at each layer

#### WebAPI layer (HTTP boundary)

- Seed request-level fields.
- Add route template and action name.
- Add auth/user identity (if present) and sanitize/normalize it.
- Map exceptions to stable `we.error.*` fields.
- Avoid per-controller `LogInformation` spam; prefer adding context fields.

#### Application layer (business logic)

- Enrich the current wide event context with business identifiers and outcomes.
- Use structured logs only for:
  - Warnings that indicate data issues.
  - Unexpected states that need attention.
  - Exceptions (logged once, not repeatedly).
- Replace "method start/finish" logs with `IWideEventContext.Add(...)`.
- Replace per-entity loop logging with aggregated counts and limited samples (e.g., first N items).

#### Infrastructure layer (dependencies)

- Record dependency metadata (provider name, response code category, retries) into the wide context.
- Keep detailed dependency failures as `ExceptionTelemetry` / `DependencyTelemetry` (already auto-collected in many cases).

### 6) Sampling strategy (cost control with correctness bias)

Goal: keep "important" wide events (errors, slow requests) while sampling boring traffic.

- Add a custom telemetry processor that:
  - Keeps 100% of failed requests.
  - Keeps 100% of slow requests (above threshold, e.g. p99 target).
  - Keeps 100% of requests marked for debug (e.g., header `X-Debug-Telemetry: true` for admin use).
  - Samples the rest at a small percentage (e.g., 5%).
- If moving to OpenTelemetry Collector later, implement true tail-sampling rules in the collector and export to Azure Monitor.

---

## Migration Plan (Phased)

### Phase 0: Decisions and guardrails

- Decide the initial schema version and the top 20–30 fields that must exist for most requests.
- Decide the identity model: which user/account identifiers are safe to store and which must be hashed.
- Decide the initial sampling policy and what constitutes "slow".

### Phase 1: Add wide context plumbing (backend)

- Implement `IWideEventContext` + accessor in Application layer (interfaces only).
- Implement WebAPI middleware to create and populate request scope.
- Implement telemetry initializer to enrich `RequestTelemetry`.
- Add minimal unit tests to ensure:
  - Context values flow through async calls.
  - Telemetry enrichment attaches expected keys.

### Phase 2: Instrument 3–5 critical endpoints end-to-end

- For each picked endpoint:
  - Add business identifiers into the context in application services.
  - Remove/avoid redundant info-level trace logs.
  - Add error mapping: stable `we.error.code` for known failure categories.

### Phase 3: Instrument key dependencies and caching

- Add enrichers for: cache hit/miss summaries, external provider calls, DB query counts/timing (optional).

### Phase 4: Sampling + retention tuning

- Implement and validate the sampling processor rules.
- Create KQL snippets and dashboards that rely on the wide fields.
- Verify that errors and slow requests are retained at 100%.

### Phase 5: Reduce legacy log noise

- Update high-noise services to prefer wide context over per-step trace lines.
- Convert remaining string-interpolated logs to structured templates where logs remain.

---

## Open Questions

- Which user identity exists in the project and where is it available on the backend?
- Do you want wide events for every request in dev, but sampled in prod?
- Do you want to migrate from classic AI SDK to Azure Monitor OpenTelemetry Distro later (collector-based tail sampling, vendor portability)?

---

## References

- Wide events philosophy: [loggingsucks.com](https://loggingsucks.com/)
- Application Insights custom dimensions: [Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics)
- OpenTelemetry future migration: Consider [Azure Monitor OpenTelemetry Distro](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable) for collector-based tail sampling
- Reference implementation: `StockMate` repository (`docs/design-docs/wide-events-adoption.md`)
