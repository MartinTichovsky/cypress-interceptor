[![NPM](https://img.shields.io/npm/v/cypress-interceptor.svg)](https://www.npmjs.com/package/cypress-interceptor)
[![Build Status](https://github.com/MartinTichovsky/cypress-interceptor/workflows/CI/badge.svg)](https://github.com/MartinTichovsky/cypress-interceptor/actions?workflow=CI)
[![Coverage Status](https://coveralls.io/repos/github/MartinTichovsky/cypress-interceptor/badge.svg?branch=main)](https://coveralls.io/github/MartinTichovsky/cypress-interceptor?branch=main)

# Cypress Interceptor - Quick Start Guide

**For Cypress developers who want better request handling and debugging.**

## What is it?

Cypress Interceptor replaces `cy.intercept` with a more powerful alternative that logs all network requests, provides detailed statistics, and makes debugging test failures easier.

## Why use it instead of `cy.intercept`?

| Feature | cy.intercept | Cypress Interceptor |
|---------|-------------|-------------------|
| Log all requests | ❌ | ✅ |
| Request statistics | ❌ | ✅ |
| Timing data | ❌ | ✅ |
| Wait for requests reliably | ⚠️ Flaky | ✅ Stable |
| Mock responses | ✅ | ✅ |
| Throttle requests | ❌ | ✅ |
| Export logs on failure | ❌ | ✅ |
| Works with global catching | ❌ | ✅ |
| WebSocket support | ❌ | ✅ |
| Console monitoring | ❌ | ✅ |

## Installation

```bash
npm install cypress-interceptor
```

Add to `cypress/support/e2e.ts`:

```typescript
import "cypress-interceptor";
```

## Common Use Cases

### 1. Wait for a request reliably

```typescript
// Instead of guessing with cy.intercept, wait for the actual request
cy.waitUntilRequestIsDone(
  () => cy.get("button").click(),
  "**/api/users"
);
```

### 2. Get request statistics

```typescript
cy.interceptorStats("**/api/users").then((stats) => {
  expect(stats[0].response?.statusCode).to.eq(200);
  expect(stats[0].duration).to.be.lt(1000); // took less than 1 second
  expect(stats[0].request.body).to.deep.eq({ id: 5 });
});
```

### 3. Mock a response

```typescript
// Mock the first matching request
cy.mockInterceptorResponse(
  "**/api/users",
  { body: { name: "John" }, statusCode: 200 }
);

// Mock indefinitely
cy.mockInterceptorResponse(
  { method: "POST" },
  { statusCode: 400 },
  { times: Number.POSITIVE_INFINITY }
);
```

### 4. Throttle a request

```typescript
// Simulate slow network
cy.throttleInterceptorRequest("**/api/users", 5000); // 5 second delay
```

### 5. Log all requests on test failure

```typescript
afterEach(() => {
  cy.writeInterceptorStatsToLog("./cypress/logs");
});
```

This creates a JSON file with all requests, responses, timing, and headers—perfect for debugging why tests fail.

### 6. Count requests

```typescript
cy.interceptorRequestCalls("**/api/users").should("eq", 1);
```

### 7. Get the last request

```typescript
cy.interceptorLastRequest("**/api/users").then((request) => {
  expect(request?.response?.body).to.include({ status: "active" });
});
```

### 8. Verify request performance

```typescript
// Ensure API calls complete within SLA
cy.interceptorStats("**/api/data").then((stats) => {
  stats.forEach((call) => {
    expect(call.duration).to.be.lt(2000); // Must complete in 2 seconds
  });
});
```

### 9. Mock dynamic responses based on request

```typescript
// Generate response based on what was requested
cy.mockInterceptorResponse(
  "**/api/users",
  {
    generateBody: (request, getJsonRequestBody) => {
      const body = getJsonRequestBody();
      return { id: body.id, name: "User " + body.id };
    },
    statusCode: 200
  }
);
```

### 10. Monitor WebSocket connections

```typescript
import "cypress-interceptor/websocket";

// Wait for WebSocket action
cy.waitUntilWebsocketAction({ url: "**/socket" });

// Get WebSocket stats
cy.wsInterceptorStats({ url: "**/socket" }).then((stats) => {
  expect(stats.length).to.be.greaterThan(0);
});
```

### 11. Monitor console errors

```typescript
import "cypress-interceptor/console";

// Capture console logs and errors
cy.watchTheConsole().then((console) => {
  expect(console.error).to.have.length(0);
  expect(console.jsError).to.have.length(0);
  expect(console.log).to.have.length.greaterThan(0);
});

// Export console logs on failure
afterEach(() => {
  cy.writeConsoleLogToFile("./cypress/logs");
});
```

## Advanced: Filter requests

```typescript
// Only GET requests
cy.interceptorStats({ method: "GET" });

// Only fetch (not XHR)
cy.interceptorStats({ resourceType: "fetch" });

// Custom matcher
cy.interceptorStats({
  queryMatcher: (query) => query?.page === 5
});

// Body matcher
cy.interceptorStats({
  bodyMatcher: (body) => body.includes("userId")
});
```

## Why it's powerful

**Complete visibility** - Every HTTP request, response, and timing is logged automatically. No more wondering if a request was made or what it contained.

**Performance tracking** - Get exact timing data for each request. Identify slow endpoints and catch performance regressions before production.

**WebSocket support** - Monitor real-time connections alongside HTTP requests with the same reliability.

**Console monitoring** - Capture console errors and warnings. Export them with network logs for complete debugging context.

**Reliable waits** - `waitUntilRequestIsDone` actually waits for completion, not just interception. Eliminates flaky tests.

**Export on failure** - Automatically save all network activity and console logs when tests fail. Perfect for CI/CD debugging.

## Real-world example

```typescript
describe("User Dashboard", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
  });

  it("should load user data and display it", () => {
    // Reset watch to ignore initial page load requests
    cy.resetInterceptorWatch();

    // Click button and wait for the specific request
    cy.waitUntilRequestIsDone(
      () => cy.get("button#refresh").click(),
      "**/api/user/profile"
    );

    // Verify the request was made correctly
    cy.interceptorStats("**/api/user/profile").then((stats) => {
      expect(stats[0].request.method).to.eq("GET");
      expect(stats[0].duration).to.be.lt(2000);
      expect(stats[0].response?.statusCode).to.eq(200);
    });

    // Verify UI updated
    cy.contains("Welcome, John").should("be.visible");
  });

  it("should handle API errors gracefully", () => {
    // Mock an error response
    cy.mockInterceptorResponse(
      "**/api/user/profile",
      { statusCode: 500, body: { error: "Server error" } }
    );

    cy.get("button#refresh").click();
    cy.contains("Error loading profile").should("be.visible");
  });
});
```

## Key Benefits

✅ **Reliable waits** - No more flaky tests waiting for requests  
✅ **Complete visibility** - See every request, response, and timing  
✅ **Easy debugging** - Export logs on failure to analyze what went wrong  
✅ **Better mocking** - Mock responses with full control  
✅ **Performance insights** - Track request duration and identify slow endpoints  
✅ **WebSocket & console monitoring** - Full application visibility  
✅ **Tested thoroughly** - 100+ tests, works with Cypress 13+  

## Documentation

- [Full API Reference](./README.full.md)
- [Network Report Generation](./README.report.md)

## Need help?

Check the [full README](./README.full.md) for advanced features like WebSocket interception, console monitoring, and HTML report generation.
