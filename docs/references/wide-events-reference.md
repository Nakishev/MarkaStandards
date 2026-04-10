# Wide Events Reference

Canonical reference for request telemetry, wide-event context, and observability field usage in Marka projects.

---

## Overview

Marka projects adopting the wide event pattern capture rich observability data for each request. Instead of emitting many log lines, context is accumulated throughout request processing and attached to the Application Insights `RequestTelemetry` as custom dimensions and metrics.

This approach enables powerful queries like:

- "All failures for `accountId=123` in last 24h, grouped by error code"
- "All requests touching `ticker=AAPL` where cache was missed"
- "Slow requests for portfolio endpoints, split by cache hit"

---

## Architecture

### Components

| Component | Location | Responsibility |
|---|---|---|
| `WideEventKeys` | `<Project>.Application/Abstractions/Observability/` | Centralized schema constants for all allowed keys. Prevents typos and makes refactoring easy. |
| `IWideEventContext` | `<Project>.Application/Abstractions/Observability/` | Interface for accumulating properties and metrics. Vendor-agnostic (no dependency on Application Insights SDK). |
| `IWideEventContextAccessor` | `<Project>.Application/Abstractions/Observability/` | Ambient access to the current request's context. Similar to `IHttpContextAccessor` but for observability. |
| `WideEventContext` | `<Project>.Infrastructure.*/Observability/` | Thread-safe implementation using `ConcurrentDictionary`. |
| `WideEventContextAccessor` | `<Project>.Infrastructure.*/Observability/` | Uses `AsyncLocal<T>` to flow context across async boundaries during request processing. |
| `WideEventMiddleware` | `<Project>.Infrastructure.*/Observability/` | Creates context scope per request, seeds request-level fields, finalizes outcome. |
| `WideEventTelemetryInitializer` | `<Project>.Infrastructure.*/Observability/` | `ITelemetryInitializer` that attaches context to `RequestTelemetry`, `ExceptionTelemetry`, and `DependencyTelemetry`. |

### How Context Flows

```
Request arrives
    ↓
WideEventMiddleware creates WideEventContext
    ↓
Stores in: 1) AsyncLocal (for service access)  2) HttpContext.Items (for telemetry)
    ↓
Application services enrich context via IWideEventContextAccessor
    ↓
Request completes, middleware sets outcome
    ↓
AsyncLocal cleared, but HttpContext.Items persists
    ↓
Application Insights sends RequestTelemetry
    ↓
WideEventTelemetryInitializer reads from HttpContext.Items
    ↓
Custom dimensions attached to telemetry
```

**Why two storage mechanisms?**

- `AsyncLocal<T>` — flows across async boundaries during request processing, allowing services to access context.
- `HttpContext.Items` — persists until the HTTP request fully completes, ensuring the telemetry initializer can read the context when Application Insights sends telemetry (which happens *after* middleware cleanup).

---

## How to Use (Application Services)

### 1. Inject the accessor

```csharp
public class MyService : IMyService
{
    private readonly IWideEventContextAccessor _wideEventContextAccessor;

    public MyService(IWideEventContextAccessor wideEventContextAccessor)
    {
        _wideEventContextAccessor = wideEventContextAccessor;
    }
}
```

### 2. Enrich context with business identifiers

```csharp
public async Task<List<PositionDto>> GetPortfolioPositions(int? accountId)
{
    var wideContext = _wideEventContextAccessor.Context;

    if (accountId.HasValue)
        wideContext?.Add(WideEventKeys.AccountId, accountId.Value);

    wideContext?.Add(WideEventKeys.CacheKeyPrefix, "portfolio_positions");

    // ... business logic ...

    wideContext?.AddMetric(WideEventKeys.MetricItemsCount, results.Count);
    wideContext?.Add(WideEventKeys.CacheHit, wasFromCache);

    return results;
}
```

### 3. Use schema constants only

Always use constants from `WideEventKeys`:

```csharp
// ✅ Correct
wideContext?.Add(WideEventKeys.StockTicker, ticker);
wideContext?.Add(WideEventKeys.TradeId, tradeId);

// ❌ Wrong — typo risk, no schema governance
wideContext?.Add("ticker", ticker);
wideContext?.Add("trade_id", tradeId);
```

---

## Schema Reference

### Core Keys

| Key | Type | Description |
|---|---|---|
| `we.schema_version` | string | Schema version (`"1"`) |
| `we.request.route` | string | Route template (e.g., `api/positions`) |
| `we.request.method` | string | HTTP method |
| `we.request.path` | string | Full request path |
| `we.request.query_present` | bool | Whether a query string is present |
| `we.request.content_length` | int | Request body size in bytes |

### Auth / User

| Key | Type | Description |
|---|---|---|
| `we.user.id` | string | Application user identifier |
| `we.user.account_id` | string | Associated account identifier |
| `we.auth.provider` | string | Authentication provider name |

### Business Context (examples — extend per project)

| Key | Type | Description |
|---|---|---|
| `we.account.id` | int/string | Account identifier |
| `we.portfolio.id` | int/string | Portfolio identifier |
| `we.trade.id` | int/string | Trade identifier |
| `we.trade.type` | string | Trade type |
| `we.transaction.id` | int/string | Transaction identifier |
| `we.period.id` | int/string | Period identifier |
| `we.period.year` | int | Year filter |
| `we.period.month` | int | Month filter |
| `we.stock.ticker` | string | Stock symbol |
| `we.position.id` | int/string | Position identifier |
| `we.feature.*` | any | Feature flags / rollout identifiers |

### Caching

| Key | Type | Description |
|---|---|---|
| `we.cache.hit` | bool | Whether the operation was served from cache |
| `we.cache.key_prefix` | string | Cache key prefix (not full key) |
| `we.cache.strategy` | string | `redis` or `memory` |

### Outcome

| Key | Type | Description |
|---|---|---|
| `we.outcome` | string | `success` or `fail` |
| `we.error.type` | string | Exception type or domain error type |
| `we.error.code` | string | Domain error code |
| `we.error.is_retriable` | bool | Whether the error is retriable |

### Dependency Summary

| Key | Type | Description |
|---|---|---|
| `we.dep.http.count` | int | Total outbound HTTP dependencies |
| `we.dep.http.fail_count` | int | Failed outbound HTTP dependencies |
| `we.dep.http.provider` | string | HTTP provider name |
| `we.dep.http.rate_limited` | bool | Whether rate limiting was hit |

### Metrics

| Key | Type | Description |
|---|---|---|
| `we.request.duration_ms` | double | Total request duration (auto-captured by middleware) |
| `we.items.count` | double | Number of items returned |
| `we.items.created` | double | Number of items created |
| `we.items.skipped` | double | Number of items skipped |
| `we.duration.db_ms` | double | Database operation duration |
| `we.duration.external_ms` | double | External API duration |
| `we.duration.cache_ms` | double | Cache operation duration |

---

## Standard Patterns

### Read operations (cached)

- Stamp `we.cache.key_prefix`
- Stamp `we.account.id` and/or `we.period.year` when scoped
- Record `we.cache.hit`
- Record `we.items.count`

### Write operations

- Stamp `we.cache.key_prefix` when related caches are invalidated
- Stamp `we.account.id` when the request targets a single account
- Stamp `we.period.year` when all items belong to the same period
- Record `we.items.count` for requested items
- Record `we.items.created` for successfully persisted rows
- Record `we.outcome`
- On failure, record `we.error.type` and `we.error.code`

Stable error type values:

- `validation`
- `missing_entity`
- `missing_account`
- `db_update`

### One-off operational actions

- Stamp `we.cache.key_prefix` when related caches are invalidated
- Record `we.items.count` for scanned source rows
- Record `we.items.created`
- Record `we.items.skipped`
- Record `we.outcome`
- On failure, record `we.error.type` and `we.error.code`

### Workflow orchestration

- Stamp `we.period.year` at the workflow entry point
- Record `we.outcome` for the overall orchestration call
- On failure, stamp `we.error.type=workflow` plus the exception type as `we.error.code`

---

## Example: Full Instrumentation

### Service Layer

```csharp
public async Task<List<PositionDto>> GetPortfolioPositions(
    int? accountId = null,
    bool? isAggregated = false)
{
    var wideContext = _wideEventContextAccessor.Context;

    if (accountId.HasValue)
        wideContext?.Add(WideEventKeys.AccountId, accountId.Value);

    wideContext?.Add(WideEventKeys.CacheKeyPrefix, "portfolio_positions");

    var cacheHit = false;
    var positions = await _cacheService.GetAsync(cacheKey, async () =>
    {
        cacheHit = false;
        return await _repository.GetPositionsAsync(accountId);
    });

    wideContext?.Add(WideEventKeys.CacheHit, cacheHit);
    wideContext?.AddMetric(WideEventKeys.MetricItemsCount, positions.Count);

    return positions;
}
```

### Resulting Application Insights Telemetry

**Custom Dimensions:**

```json
{
  "we.schema_version": "1",
  "we.request.route": "api/positions",
  "we.request.method": "GET",
  "we.request.path": "/api/positions",
  "we.request.query_present": "true",
  "we.account.id": "123",
  "we.cache.key_prefix": "portfolio_positions",
  "we.cache.hit": "true",
  "we.outcome": "success"
}
```

**Measurements (Metrics):**

```json
{
  "we.request.duration_ms": 1247.5,
  "we.items.count": 42.0
}
```

---

## Querying in Application Insights (KQL)

### Find all requests for a specific account

```kql
requests
| where customDimensions['we.account.id'] == '123'
| where timestamp > ago(24h)
| project timestamp, name, resultCode, duration, customDimensions
```

### Group failures by error type

```kql
requests
| where customDimensions['we.outcome'] == 'fail'
| summarize count() by tostring(customDimensions['we.error.type'])
```

### Cache hit rate by endpoint

```kql
requests
| where customDimensions['we.request.route'] startswith 'api/'
| summarize
    Total = count(),
    CacheHits = countif(customDimensions['we.cache.hit'] == 'true'),
    CacheMisses = countif(customDimensions['we.cache.hit'] == 'false')
| extend HitRate = (CacheHits * 100.0) / Total
```

### Slow requests with business context

```kql
requests
| where measurements['we.request.duration_ms'] > 1000
| where timestamp > ago(24h)
| project timestamp,
    route = customDimensions['we.request.route'],
    account_id = customDimensions['we.account.id'],
    cache_hit = customDimensions['we.cache.hit'],
    duration_ms = measurements['we.request.duration_ms'],
    items_count = measurements['we.items.count']
| order by duration_ms desc
```

### P95 item count by route

```kql
requests
| where measurements['we.items.count'] > 0
| summarize p95_items = percentile(measurements['we.items.count'], 95) by tostring(customDimensions['we.request.route'])
```

---

## Guidelines

### DO ✅

- Always use `WideEventKeys` constants
- Add business identifiers (accountId, ticker, tradeId, etc.)
- Add outcome markers (cache hit, item count, error codes)
- Keep values **small and queryable** (IDs, codes, counts, booleans)
- Use null-safe accessor: `wideContext?.Add(...)`
- Add metrics for numeric measurements: `AddMetric(...)`

### DON'T ❌

- Add PII or secrets (auth tokens, passwords, raw headers)
- Add full request/response payloads
- Use ad-hoc string keys without adding them to `WideEventKeys`
- Store huge lists (e.g., `string.Join` of 1000 items)
- Add complex nested objects (Application Insights custom dimensions are flat key-value)
- Emit `LogInformation` for every method entry/exit if wide context captures the same info

### When to Use Traditional Logging

Use `ILogger.LogWarning()` / `LogError()` for:

- Unexpected exceptions (already captured by middleware, but add context if needed)
- Data quality issues (e.g., missing expected fields in external API response)
- Rare diagnostic breadcrumbs (temporary debug logs, feature-flagged)

Wide events replace most `LogInformation()` calls that just report "what happened."

---

## Testing

Unit-test the wide event pipeline at three levels:

1. **`WideEventContext`** — verify properties and metrics accumulate correctly.
2. **`WideEventContextAccessor`** — verify `AsyncLocal` flows across async boundaries.
3. **`WideEventMiddleware`** — verify context is created, seeded, outcome set, and duration captured.
4. **`WideEventTelemetryInitializer`** — verify properties are transferred to `RequestTelemetry`, `ExceptionTelemetry`, and `DependencyTelemetry`.

```csharp
[Fact]
public void WideEventContext_Add_StoresProperties()
{
    var context = new WideEventContext();
    context.Add(WideEventKeys.AccountId, 123);

    var properties = context.GetProperties();
    Assert.Equal("123", properties[WideEventKeys.AccountId]);
}
```

---

## Reference Implementation

See the `StockMate` repository for a complete reference implementation:

- `StockMate.Application/Abstractions/Observability/` — interfaces and keys
- `StockMate.Infrastructure.WebAPI/Observability/` — middleware, context, telemetry initializer
- `StockMate.Application.Tests/Observability/` and `StockMate.Infrastructure.WebAPI.Tests/Observability/` — tests

---

## References

- Wide events philosophy: [loggingsucks.com](https://loggingsucks.com/)
- Application Insights custom dimensions: [Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics)
- OpenTelemetry future migration: [Azure Monitor OpenTelemetry Distro](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable)
