# Testing

Adopt a comprehensive, automated testing strategy, including unit, integration, and end-to-end tests, as appropriate for each project. Automation enhances reliability, consistency, and speed across the development lifecycle.

## Test Types

| Test Type              | Description                                                                                       | Recommended Tools                                     | Requirement                      |
| ---------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| Unit Tests             | Validate individual units of code in isolation. TDD is recommended for better code quality.       | xUnit (C#), Jest/Vitest + Testing Library (JS)        | Mandatory for all projects       |
| UI Tests               | Test the graphical user interface of an application.                                              | Playwright                                            | Optional                         |
| Integration Tests      | Ensure that components or services work together as expected.                                     | Testcontainers (C#, Python), Testcontainers + Playwright (JS) | Optional at Level 1; mandatory for persistence/API changes at Level 2+ |
| End-to-End Tests       | Validate complete workflows from start to finish.                                                 | Playwright                                            | Optional                         |
| Performance/Load Tests | Assess the system's behavior under various conditions, including heavy load and stress scenarios. | gatling, k6, wrk, locust                              | Optional                         |
| Acceptance Tests       | Verify the system meets external stakeholders' requirements and specifications.                   | Playwright, or tool appropriate to project scope      | Optional (for external projects) |

## Additional Notes

- **Unit Tests**: Adopting Test-Driven Development (TDD) ensures higher quality and maintainability, so stick to whenever it's possible.
- Coverage policy: coverage is collected and published on every CI run at every level. Thresholds (typical baseline ≥ 80% overall, ≥ 90% for critical modules) are enforced as CI gates at Level 3 and above; small and educational projects watch the trend without a gate.
- Mocking/assertions: .NET — xUnit + NSubstitute (one mocking library per repository; do not mix Moq and NSubstitute) + Shouldly or plain `Assert`. JS — Vitest built-ins + Testing Library. Python — pytest fixtures and fakes; no live model-provider calls in unit tests.
- Integration tests are tagged (`[Trait("Category","Integration")]`, `@pytest.mark.integration`) so pipelines can run them separately on agents that have Docker; do not let a missing Docker daemon silently skip them — the pipeline step reports "not run".
- **Performance Testing**: Tools like [Gatling](https://gatling.io/) and k6 provide actionable insights into bottlenecks.
- **End-to-End Testing**: Utilize Playwright for comprehensive coverage across browsers and devices.
- Coverage tooling and publishing: .NET — collect with the built-in "XPlat Code Coverage" data collector (which uses Coverlet under the hood) and publish Cobertura reports in Azure DevOps; optionally generate local HTML with ReportGenerator. JS — use lcov/coverage reporters. Always publish test results and coverage summaries in Azure DevOps.
- Flaky tests policy: mark tests as flaky and quarantine; file an issue, track, and prioritize fixes. Avoid silently ignoring failing tests.
- Test naming and structure: colocate tests next to code or under `tests/`; use clear names following `MethodName_Scenario_ExpectedResult` or `Given_When_Then` conventions; use consistent suffixes (`*Tests.cs` for C#, `*.test.ts` / `*.spec.ts` for TS).

## Resources

- [xUnit Documentation](https://xunit.net/)
- [Playwright Testing](https://playwright.dev/)
- [Gatling Load Testing](https://gatling.io/)
- [Testcontainers for JavaScript](https://github.com/testcontainers/testcontainers-js)

---

