# Observability

## Low-scale solutions (demo, training, etc. projects)

Use Azure AppInsights as the primary monitoring tool for low-scale projects.
Use standard severity levels (INFO, WARN, ERROR) for logging and alerting.
Use the platform's structured logger (`ILogger<T>` in .NET, `logging`/Loguru in Python) with message templates; the logger category (class name) identifies the service and component, so do not add a manual `[Solution.Service.Method]` prefix to the message. Include the method name as a structured property when it matters.

Example (.NET):

```csharp
_logger.LogInformation("Found {Count} transactions to add", transactions.Count);
// Category: StockMate.Application.TransactionService
```

Every deployed service exposes a health endpoint (`/health/live`, `/health/ready`) and has an availability test or an Uptime Kuma monitor pointed at it.

> **Note:** Avoid logging long lists of IDs or raw collections in log messages. Log the count only; if individual IDs are needed for debugging, emit them at DEBUG level or use the Wide Events pattern to record aggregated counts as queryable metrics.

## High-scale solutions for production

### Logs

Use OpenTelemetry compatible logging tools (OpenTelemetry/Azure AppInsights). Prefer standard OpenTelemetry Protocol (OTLP) exporters for maximum compatibility and standardization.

#### Semantic Conventions

Stick to the OpenTelemetry's Logs Data Model ([Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)) when developing log properties and formats.

Preferred list of log attributes:

- `ServiceName`: Name of the service generating the log
- `Timestamp`: Time when the event occurred (UTC)
- `ObservedTimestamp`: Time when the event was observed by the logging system (UTC)
- `SeverityText`: Text representation of severity level (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
- `SeverityNumber`: Numeric representation of severity (1-24 as per OTel spec)
- `Body`: The primary message content
- `Resource`: Information about the entity producing the log (service, k8s pod, etc.)
- `Attributes`: Additional contextual information as key-value pairs
- `TraceId`: Unique identifier for the trace (for distributed tracing)
- `SpanId`: Unique identifier for the span within the trace
- `TraceFlags`: Trace option flags (e.g., sampling decision)

#### Best Practices to follow

1. Structured Logging

   - Always use structured logging format (JSON)
   - Avoid free-form text in attributes
   - Use semantic conventions for attribute naming

2. Context Propagation

   - Always propagate trace context
   - Include correlation IDs
   - Maintain baggage items where relevant

3. Sampling

   - Implement appropriate sampling strategies
   - Consider head-based sampling for services
   - Use tail-based sampling for error cases

4. Performance

   - Use batching for log exports
   - Implement appropriate buffer sizes
   - Handle backpressure properly

5. Privacy and Compliance

   - Never log secrets or credentials; mask or hash PII and sensitive fields
   - Use redaction filters/middleware where available

6. Cardinality

   - Avoid high-cardinality labels/attributes in metrics; prefer bounded values
   - Limit unique values in logs/traces to control storage and costs

7. Retention

   - Set appropriate data retention periods per environment and customer policy

### Metrics

Implement standard OpenTelemetry metrics for consistent monitoring across services.

#### Required Metrics

1. Service Health

   - Uptime
   - Memory usage
   - CPU usage
   - Active connections

2. Business Metrics
   - Request rates
   - Error rates
   - Response times
   - Business-specific KPIs

#### Metric Types

Use appropriate OpenTelemetry metric instruments:

1. Counter

   - For values that only increase
   - Example: request_count, error_count

2. Gauge

   - For values that can go up and down
   - Example: memory_usage, active_connections

3. Histogram
   - For distributions of values
   - Example: request_duration, payload_size

### Distributed Tracing

Implement distributed tracing using OpenTelemetry trace semantics.

#### Trace Requirements

1. Span Naming

   - Use clear, descriptive names
   - Follow the format: `<operation_name>.<context>`
   - Example: `payment.process`, `auth.validate`

2. Required Span Attributes

   - `service.name`
   - `service.version`
   - `deployment.environment`
   - HTTP attributes for web requests
   - Database attributes for queries

3. Error Handling
   - Always mark failed spans with error status
   - Include error details in span attributes
   - Link related logs to spans

#### Sampling Strategy

1. Production Environment

   - Use tail-based sampling
   - Sample 100% of error spans
   - Sample 10% of normal traffic

2. Non-Production Environments
   - Sample 100% of all spans
   - Enable debug spans when needed

## Wide Events

> Applies to all scales as a useful pattern, but is especially valuable in high-scale and production environments where wide events replace noisy per-method logging with rich, queryable request telemetry. For internal or low-scale projects, adopt this pattern incrementally when operational debugging needs justify the added plumbing.

The wide event pattern replaces scattered per-method log lines with a single context-rich event per request, built up during request handling and emitted once at completion. This dramatically reduces log noise and enables powerful ad-hoc analytics by making business identifiers first-class queryable fields.

**Core principle:** the existing Application Insights `RequestTelemetry` for each incoming request becomes the canonical wide event, enriched with curated custom dimensions and metrics via an `ITelemetryInitializer`.

### Implementation Components

Marka .NET Web API projects that adopt the full wide-events pattern should implement the following components. Teams may phase these in endpoint-by-endpoint; see the adoption document for rollout sequencing.

| Component | Layer | Description |
|---|---|---|
| `WideEventKeys` | Application/Abstractions | Static class with `const string` keys, all prefixed `we.*`. The only allowed source of key names. |
| `IWideEventContext` | Application/Abstractions | Vendor-agnostic interface: `Add(key, value)` overloads + `AddMetric(name, value)`. |
| `IWideEventContextAccessor` | Application/Abstractions | Ambient accessor (`IWideEventContext? Context { get; }`). |
| `WideEventContext` | Infrastructure | Thread-safe implementation using `ConcurrentDictionary`. |
| `WideEventContextAccessor` | Infrastructure | `AsyncLocal<T>` implementation so context flows across `await` boundaries. |
| `WideEventMiddleware` | Infrastructure | Seeds request fields, captures duration, sets outcome. Stores context in both `AsyncLocal` and `HttpContext.Items`. |
| `WideEventTelemetryInitializer` | Infrastructure | `ITelemetryInitializer` that copies context to `RequestTelemetry.Properties/.Metrics` and a minimal subset to `ExceptionTelemetry` and `DependencyTelemetry`. |

### Key Schema Rules

- All keys **must** be defined as constants in `WideEventKeys` — never use ad-hoc strings.
- All keys must be prefixed with `we.` to namespace them in Application Insights.
- Values must be small and queryable: IDs, codes, counts, booleans. Never raw payloads, PII, or tokens.
- Required keys for every request: `we.schema_version`, `we.request.method`, `we.request.path`, `we.request.route`, `we.outcome`.

See [Wide Events Reference](../references/wide-events-reference.md) for the full schema and query examples, and [Wide Events Adoption](../design-docs/wide-events-adoption.md) for the design rationale and phased migration plan.

### Usage in Application Services

```csharp
public class MyService : IMyService
{
    private readonly IWideEventContextAccessor _wideEventContextAccessor;

    public MyService(IWideEventContextAccessor wideEventContextAccessor)
    {
        _wideEventContextAccessor = wideEventContextAccessor;
    }

    public async Task<List<ItemDto>> GetItemsAsync(int accountId)
    {
        var ctx = _wideEventContextAccessor.Context;
        ctx?.Add(WideEventKeys.AccountId, accountId);
        ctx?.Add(WideEventKeys.CacheKeyPrefix, "items");

        var items = await _repository.GetItemsAsync(accountId);

        ctx?.Add(WideEventKeys.CacheHit, false);
        ctx?.AddMetric(WideEventKeys.MetricItemsCount, items.Count);

        return items;
    }
}
```

### When to Use Traditional Logging vs Wide Events

| Scenario | Preferred approach |
|---|---|
| Request-level business context (IDs, flags, counts) | Wide event context (`IWideEventContext.Add`) |
| Per-request outcome and metrics | Wide event context (`AddMetric`, `we.outcome`) |
| Unexpected exceptions | `ILogger.LogError` / `LogWarning` |
| Data quality issues in external responses | `ILogger.LogWarning` |
| Temporary debug breadcrumbs | `ILogger` (feature-flagged, remove after use) |

## Alerting and Uptime Monitoring

- Use Uptime Kuma as a self-hosted, cloud-agnostic tool for synthetic checks (HTTP/TCP/etc.), uptime dashboards, and alerting (e.g., email, Teams/Mattermost, webhook).
- Prefer Uptime Kuma within Marka’s infrastructure when customer or project requirements favor self-hosted monitoring and alerting.

---

