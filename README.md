[![NPM](https://img.shields.io/npm/v/cypress-interceptor.svg)](https://www.npmjs.com/package/cypress-interceptor)
[![Build Status](https://github.com/MartinTichovsky/cypress-interceptor/workflows/CI/badge.svg)](https://github.com/MartinTichovsky/cypress-interceptor/actions?workflow=CI)
[![Coverage Status](https://coveralls.io/repos/github/MartinTichovsky/cypress-interceptor/badge.svg?branch=main)](https://coveralls.io/github/MartinTichovsky/cypress-interceptor?branch=main)

# Cypress Interceptor

## About

Cypress Interceptor is a substitute for `cy.intercept`. Its main purpose is to log all fetch or XHR requests, which can be analyzed in case of failure. It provides extended ways to log these statistics, including the ability to mock or throttle requests easily. Cypress Interceptor is better than `cy.intercept` because it can avoid issues, especially when using global request catch.

There is also a possibility to work with websocket. For more details, refer to the [websocket section](#websocket-interceptor).

## What's new
- Complete rework, exclude `cy.intercept` as the main tool of logging, stabilizing runs, support all fetch and XHR body types
- Added [watchTheConsole](#watchtheconsole) as the way of how to log console output and unhandled JavaScript errors
- Added a possibility to filter and map stats when a test fails
- Added a possibility to bypass the response
- Work with canceled and aborted requests
- Work with XHR requests
- Add support for Websockets

## Table of contents

- Cypress Interceptor
    - [Getting started](#getting-started)
    - [Would you just log all requests to a file on fail?](#would-you-just-log-all-requests-to-a-file-on-fail)
    - [Would you like to wait until a request or requests are done?](#would-you-like-to-wait-until-a-request-or-requests-are-done)
    - [Interceptor Cypress commands](#interceptor-cypress-commands)
    - [Cypress environment variables](#cypress-environment-variables)
    - [Documentation and examples](#documentation-and-examples)
        - [cy.interceptor](#cyinterceptor)
        - [cy.interceptorLastRequest](#cyinterceptorlastrequest)
        - [cy.interceptorOptions](#cyinterceptoroptions)
        - [cy.interceptorRequestCalls](#cyinterceptorrequestcalls)
        - [cy.interceptorStats](#cyinterceptorstats)
        - [cy.mockInterceptorResponse](#cymockinterceptorresponse)
        - [cy.resetInterceptorWatch](#cyresetinterceptorwatch)
        - [cy.throttleInterceptorRequest](#cythrottleinterceptorrequest)
        - [cy.waitUntilRequestIsDone](#cywaituntilrequestisdone)
    - [Interceptor public methods](#interceptor-public-methods)
        - [callStack](#callstack)
        - [onRequestError](#onrequesterror)
        - [removeMock](#removemock)
        - [removeThrottle](#removethrottle)
        - [writeStatsToLog](#writestatstolog)
    - [Interfaces](#interfaces)
    - [Useful tips](#useful-tips)
        - [Log on fail](#log-on-fail)
        - [Clean the videos for successful tests](#clean-the-videos-for-successful-tests)
- [Websocket Interceptor](#websocket-interceptor)
    - [Getting started](#getting-started-1)
    - [Websocket Interceptor Cypress commands](#websocket-interceptor-cypress-commands)
    - [Cypress environment variables](#cypress-environment-variables-1)
    - [Documentation and examples](#documentation-and-examples-1)
        - [cy.wsInterceptor](#cywsinterceptor)
        - [cy.wsInterceptorLastRequest](#cywsinterceptorlastrequest)
        - [cy.wsInterceptorStats](#cywsinterceptorstats)
        - [cy.wsResetInterceptorWatch](#cywsresetinterceptorwatch)
        - [cy.waitUntilWebsocketAction](#cywaituntilwebsocketaction)
    - [Websocket Interceptor public methods](#websocket-interceptor-public-methods)
        - [callStack](#callstack-1)
        - [writeStatsToLog](#writestatstolog-1)
    - [Interfaces](#interfaces-1)
- [Watch The Console](#watch-the-console)
    - [Implementation](#implementation)
    - [Log on fail](#log-on-fail-1)
    - [Log on failure with type filtering](#log-on-failure-with-type-filtering)
    - [Custom log](#custom-log)
    - [Combination](#combination)

## Getting started

It is very simple, just install the package using `yarn` or `npm` and import the package in your `cypress/support/e2e.js` or `cypress/support/e2e.ts`:

```js
import "cypress-interceptor";
```

## Would you just log all requests to a file on fail?

[Take a look at this example](#log-on-fail).

## Would you like to wait until a request or requests are done?

[Refer to this section](#cywaituntilrequestisdone)

## The Cypress Interceptor commands

```ts
/**
 * Get an instance of Interceptor
 *
 * @returns An instance of Interceptor
 */
interceptor: () => Chainable<Interceptor>;
/**
 * Get the last call matching the provided route matcher.
 *
 * @param routeMatcher A route matcher
 * @returns The last call information or `undefined` if none matches.
 */
interceptorLastRequest: (
    routeMatcher?: IRouteMatcher
) => Chainable<CallStack | undefined>;
/**
 * Set the Interceptor options. This must be called before a request occurs.
 *
 * @param options Options
 * @returns The current Interceptor options
 */
interceptorOptions: (options?: InterceptorOptions) => Chainable<InterceptorOptions>;
/**
 * Get the number of requests matching the provided route matcher.
 *
 * @param routeMatcher A route matcher
 * @returns The number of requests matching the provided route matcher since the current test started.
 */
interceptorRequestCalls: (routeMatcher?: IRouteMatcher) => Chainable<number>;
/**
 * Get the statistics for all requests matching the provided route matcher since the beginning
 * of the current test.
 *
 * @param routeMatcher A route matcher
 * @returns It returns all requests matching the provided route matcher with detailed information.
 * If none match, it returns an empty array.
 */
interceptorStats: (routeMatcher?: IRouteMatcher) => Chainable<CallStack[]>;
/**
 * Mock the response of requests matching the provided route matcher. By default, it mocks the
 * first matching request, and then the mock is removed. Set `times` in the options to change
 * how many times the matching requests should be mocked.
 *
 * @param routeMatcher A route matcher
 * @param mock The response mock
 * @param options The mock options
 * @returns The ID of the created mock. This is needed if you want to remove the mock manually.
 */
mockInterceptorResponse(
    routeMatcher: IRouteMatcher,
    mock: IMockResponse,
    options?: IMockResponseOptions
): Chainable<number>;
/**
 * Reset the Interceptor's watch. It sets the pointer to the last call. Resetting the pointer
 * is necessary when you want to wait for certain requests.
 *
 * Example: On a site, there are multiple requests to api/getUser, but we want to wait for the
 * specific one that occurs after clicking a button. Since we cannot know which api/getUser call
 * to wait for, calling this method sets the exact point from which we want to check the next requests.
 */
resetInterceptorWatch: VoidFunction;
/**
 * Start the time measurement (a helper function)
 *
 * @returns performance.now() when the code is executed
 */
startTiming: () => Chainable<number>;
/**
 * Stop the time measurement (a helper function)
 *
 * @returns If `cy.startTiming` was called, it returns the time difference since startTiming was
 * called (in ms); otherwise, it returns `undefined`.
 */
stopTiming: () => Chainable<number | undefined>;
/**
 * Throttle requests matching the provided route matcher by setting a delay. By default, it throttles
 * the first matching request, and then the throttle is removed. Set times in the options to change
 * how many times the matching requests should be throttled.
 *
 * @param routeMatcher A route matcher
 * @param delay The delay in ms
 * @param options The throttle options (which can include mocking the response).
 * @returns The ID of the created throttle. This is needed if you want to remove the throttle manually.
 */
throttleInterceptorRequest(
    routeMatcher: IRouteMatcher,
    delay: number,
    options?: IThrottleRequestOptions
): Chainable<number>;
/**
 * The method will wait until all requests matching the provided route matcher are finished or until
 * the maximum waiting time (`timeout` in options) is reached.
 *
 * By default, there must be at least one match. Otherwise, it waits until a request matches the
 * provided route matcher or until the maximum waiting time is reached. This behavior can be changed
 * by setting `enforceCheck` to `false` in the options.
 *
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 * @returns An instance of the Interceptor
 */
waitUntilRequestIsDone: (
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
) => Chainable<Interceptor>;
```

# Cypress environment variables

You can provide Cypress environment variables to set certain Interceptor options globally:

```ts
e2e: {
    env: {
        INTERCEPTOR_REQUEST_TIMEOUT: number; // default 10000
    }
}
```

__`INTERCEPTOR_REQUEST_TIMEOUT`__ - the value (in ms) that defines how long the Interceptor will wait for pending requests when call `cy.waitUntilRequestIsDone()`

# Documentation and examples

In almost all methods, there is a route matcher ([`IRouteMatcher`](#iroutematcher)) that can be a string, a RegExp ([`StringMatcher`](#stringmatcher)), or an object with multiple matching options. For more information about matching options, explore [`IRouteMatcherObject`](#iroutematcherobject).

## cy.interceptor

```ts
interceptor: () => Chainable<Interceptor>;
```

Get an instance of the Interceptor

### Example

```ts
cy.interceptor().then(interceptor => {
    interceptor.resetWatch();
    interceptor.removeMock(1);
    interceptor.removeThrottle(1);
});
```

## cy.interceptorLastRequest

```ts
interceptorLastRequest: (routeMatcher?: IRouteMatcher) => Chainable<CallStack | undefined>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)

Get the last call matching the provided route matcher. Similar to [`cy.interceptorStats`](#cyinterceptorstats).

### Example

```ts
// get the last fetch request
cy.interceptorLastRequest({ resourceType: "fetch" }).then((stats) => {
    // stats can be `undefined`
});
```

## cy.interceptorOptions

```ts
interceptorOptions: (options?: InterceptorOptions) => Chainable<InterceptorOptions>;
```

_References:_
  - [`InterceptorOptions`](#interceptoroptions)

Set the Interceptor options. It's best to call this at the beginning of the test, in `before` or `beforeEach`. The default options are:

```ts
ignoreCrossDomain: false
```

### Example

```ts
// ignore the cross-domain requests
cy.interceptorOptions({
    ignoreCrossDomain: true
});
```

## cy.interceptorRequestCalls

```ts
interceptorRequestCalls: (routeMatcher?: IRouteMatcher) => Chainable<number>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)

Get the number of requests matching the provided route matcher.

```ts
// There should be only one call logged to a URL ending with `/api/getOrder`
cy.interceptorRequestCalls("**/api/getOrder").should("eq", 1);
// there should be only 4 fetch requests
cy.interceptorRequestCalls({ resourceType: ["fetch"] }).should("eq", 4);
```

## cy.interceptorStats

```ts
interceptorStats: (routeMatcher?: IRouteMatcher) => Chainable<CallStack[]>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)

Get the statistics for all requests matching the provided route matcher since the beginning of the current test.

### Example

_Note:_ It just serves as an example, but I do not recommend testing any of it except for the request/response query and body—in some cases. It should basically serve for logging/debugging.

```ts
cy.interceptorStats("**/getUser").then((stats) => {
    expect(stats.length).to.eq(1);
    expect(stats[0].crossDomain).to.be.false;
    expect(stats[0].duration).to.be.lt(1500);
    expect(stats[0].request.body).to.deep.eq({ id: 5 });
    expect(stats[0].request.headers["host"]).to.eq("my-page.org");
    expect(stats[0].request.query).to.deep.eq({
        ref: 987
    });
    expect(stats[0].request.method).to.eq("POST");
    expect(stats[0].resourceType).to.eq("fetch");
    expect(stats[0].response?.body).to.deep.eq({ userName: "HarryPotter" });
    expect(stats[0].response?.statusCode).to.eq(200);
    expect(stats[0].response?.statusMessage).to.eq("OK");
    expect(stats[0].url.pathname.endsWith("/getUser")).to.be.true;
});
```

## cy.mockInterceptorResponse

```ts
mockInterceptorResponse(
    routeMatcher: IRouteMatcher,
    mock: IMockResponse,
    options?: IMockResponseOptions
): Chainable<number>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)
  - [`IMockResponse`](#imockresponse)
  - [`IMockResponseOptions`](#imockresponseoptions)

Mock the response of requests matching the provided route matcher. By default, it mocks the first matching request, and then the mock is removed. Set `times` in the options to change how many times the matching requests should be mocked.

### Examples

```ts
// return status 400 to all fetch requests, indefinitely
cy.mockInterceptorResponse(
    { resourceType: "fetch" },
    { statusCode: 400 },
    { times: Number.POSITIVE_INFINITY }
);
// return a custom body to a request ending with `/api/getUser`, default once
cy.mockInterceptorResponse(
    { url: "**/api/getUser" },
    { 
        body: {
            userName: "LordVoldemort"
        }
     }
);
// return a custom header to all POST requests, indefinitely
cy.mockInterceptorResponse(
    { method: "POST" },
    { 
        header: {
            "custom-header": "value"
        }
     },
     { times: Number.POSITIVE_INFINITY }
);
// return a custom body to any fetch request, twice
cy.mockInterceptorResponse(
    { resourceType: "fetch" },
    { 
        generateBody: (request) => {
            return {
                userName: "LordVoldemort"
            };
        }
     },
     { times: 2 }
);
// mock the request having query string `page` = 5, once
cy.mockInterceptorResponse(
    {
        queryMatcher: (query) => query?.page === 5
    },
    { 
        body: {
            userName: "LordVoldemort"
        }
    },
    {
        times: 1 // this is the default value, no need to set
    }
);
// mock the request having `page` in the request body, default once
cy.mockInterceptorResponse(
    {
        bodyMatcher: (bodyString) => {
            try {
                const body = JSON.parse(bodyString);

                return isObject(body) && "page" in body;
            } catch {
                return false;
            }
        }
    },
    { 
        body: {
            userName: "LordVoldemort"
        }
    }
);
```

## cy.resetInterceptorWatch

```ts
resetInterceptorWatch: () => void;
```

Reset the Interceptor's watch. It sets the pointer to the last call. Resetting the pointer is necessary when you want to wait for certain requests.

### Example

On a site, there are multiple requests to api/getUser, but we want to wait for the specific one that occurs after clicking a button. Since we cannot know which api/getUser call to wait for, calling this method sets the exact point from which we want to check the next requests.

```ts
// this page contains multiple requests to `api/getUser` when visit
cy.visit("https://www.my-page.org");

// reset the watch, so all the previous (or pending) requests will be ignored in the next `waitUntilRequestIsDone`
cy.resetInterceptorWatch();

// this click should trigger a request to `/api/getUser`
cy.get("button#user-info").click();

// the test will not continue until the request to `/api/getUser` is finished
cy.waitUntilRequestIsDone("**/api/getUser");
```

## cy.throttleInterceptorRequest

```ts
throttleInterceptorRequest(
    routeMatcher: IRouteMatcher,
    delay: number,
    options?: IThrottleRequestOptions
): Chainable<number>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)
  - [`IThrottleRequestOptions`](#ithrottlerequestoptions)

Throttle requests matching the provided route matcher by setting a delay. By default, it throttles the first matching request, and then the throttle is removed. Set times in the options to change how many times the matching requests should be throttled.

### Example

```ts
// make the request to `/api/getUser` last for 5 seconds
cy.throttleInterceptorRequest("**/api/getUser", 5000);
// throttle a request which has the URL query string containing key `page` equal to 5
cy.throttleInterceptorRequest({ queryMatcher: (query) => query?.page === 5}, 5000);
// throtlle all requests for 5 seconds
cy.throttleInterceptorRequest({ resourceType: "all" }, 5000, { times: Number.POSITIVE_INFINITY });
cy.throttleInterceptorRequest("*", 5000, { times: Number.POSITIVE_INFINITY });
// throttle the request having `userName` in the request body
cy.throttleInterceptorRequest(
    {
        bodyMatcher:  (bodyString) => {
            try {
                const body = JSON.parse(bodyString);

                return isObject(body) && "userName" in body;
            } catch {
                return false;
            }
        }
    },
    5000
);
```

## cy.waitUntilRequestIsDone

```ts
waitUntilRequestIsDone: (
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
) => Chainable<Interceptor>;
```

_References:_
  - [`StringMatcher`](#stringmatcher)
  - [`WaitUntilRequestOptions`](#waituntilrequestoptions)

The method will wait until all requests matching the provided route matcher are finished or until the maximum waiting time (`timeout` in options) is reached.

The `timeout` option is set to 10 seconds by default. This option can be set globally by Cypress environment variable [`INTERCEPTOR_REQUEST_TIMEOUT`](#cypress-environment-variables).

The `timeout` priority resolution.

```ts
const DEFAULT_TIMEOUT = 10000;
const timeout = option?.timeout ?? Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT") ?? DEFAULT_TIMEOUT;
```

By default, there must be at least one match. Otherwise, it waits until a request matches the provided route matcher or until the maximum waiting time is reached. This behavior can be changed by setting `enforceCheck` to `false` in the options.

### Examples

```ts
// will wait until all requests are finished
cy.waitUntilRequestIsDone();
// wait for requests ending with `/api/getUser`
cy.waitUntilRequestIsDone("**/api/getUser");
cy.waitUntilRequestIsDone(new RegExp("api\/getUser$", "i"));
// wait for requests containing `/api/`
cy.waitUntilRequestIsDone("**/api/**");
cy.waitUntilRequestIsDone(new RegExp("(.*)\/api\/(.*)", "i"));
// wait until this request is finished
cy.waitUntilRequestIsDone("http://my-page.org/api/getUser");
// providing a custom error message when maximum time of waiting is reached
cy.waitUntilRequestIsDone("http://my-page.org/api/getUser", "Request never happened");
// wait until all fetch requests are finished
cy.waitUntilRequestIsDone({ resourceType: "fetch" });
// wait maximum 200s for this fetch to finish
cy.waitUntilRequestIsDone({ url: "http://my-page.org/api/getUser", timeout: 200000 });
// wait 2s after the request to `api/getUser` finishes to check if there is an another request
cy.waitUntilRequestIsDone({ url: "http://my-page.org/api/getUser", waitForNextRequest: 2000 });
// wait until all cross-domain requests are finished but do not fail if there is none
cy.waitUntilRequestIsDone({ crossDomain: true, enforceCheck: false });
```

# Interceptor public methods

## callStack

```ts
get callStack(): CallStack[];
```

Return a copy of all logged requests since the Interceptor has been created (the Interceptor is created in `beforeEach`).

## getLastRequest

Same as [`cy.interceptorLastRequest`](#cyinterceptorlastrequest).

## getStats

Same as [`cy.interceptorStats`](#cyinterceptorstats).

## requestCalls

Same as [`cy.interceptorRequestCalls`](#cyinterceptorrequestcalls).

## mockResponse

Same as [`cy.mockInterceptorResponse`](#cymockinterceptorresponse).

## onRequestError

Function called when a request is cancelled, aborted or fails.

```ts
onRequestError(func: OnRequestError);
```

## removeMock

```ts
removeMock(id: number): boolean;
```

Remove the mock entry by ID.

## removeThrottle

```ts
removeThrottle(id: number): boolean;
```

Remove the throttle entry by ID.

## resetWatch

Same as [`cy.resetInterceptorWatch`](#cyresetinterceptorwatch).

## setOptions

Same as [`cy.interceptorOptions`](#cyinterceptoroptions).

## throttleRequest

Same as [`cy.throttleInterceptorRequest`](#cythrottleinterceptorrequest).

## waitUntilRequestIsDone

Same as [`cy.waitUntilRequestIsDone`](#cywaituntilrequestisdone).

## writeStatsToLog

```ts
public writeStatsToLog(outputDir: string, options?: WriteStatsOptions): void;
```

_References:_
  - [`WriteStatsOptions`](#writestatsoptions)

Write the logged requests' information (or those filtered by the provided route matcher) to a file. The file will contain the JSON.stringify of [`callStack`](#callstack).

### Example

```ts
afterAll(() => {
    cy.interceptor().then(interceptor => {
        // the output file will be "./out/test.cy.ts (Description - It).stats.json" (the name of the file `test.cy.ts (Description - It)` will be generated from the running test)
        interceptor.writeStatsToLog("./out");
        // the output file will be "./out/file_name.stats.json"
        interceptor.writeStatsToLog("./out", { fileName: "file_name" });
        // write only "fetch" requests to the output file
        interceptor.writeStatsToLog("./out", { routeMatcher: { resourceType: "fetch" }});
        // write only "POST" requests to the output file
        interceptor.writeStatsToLog("./out", { filter: (entry) => entry.method === "POST" });
        // map the output that will be written to the output file
        interceptor.writeStatsToLog("./out", { mapper: (entry) => ({ url: entry.url }) });
    });
});
```

# Interfaces

### IHeadersNormalized

```ts
type IHeadersNormalized = { [key: string]: string };
```

### InterceptorOptions

```ts
interface InterceptorOptions {
    /**
     * Ignore requests outside the domain (default: `false`)
     */
    ignoreCrossDomain?: boolean;
}
```

### IMockResponse

```ts
interface IMockResponse {
    /**
     * The response body, it can be anything
     */
    body?: unknown;
    /**
     * Generate a body with the original response body. This option has higher priority
     * than the `body` option.
     *
     * @param request An object with the request data (body, query, method, ...)
     * @returns The response body, it can be anything
     */
    generateBody?: (request: IRequest) => unknown;
    /**
     * If provided, this will be added to the original response headers.
     */
    headers?: IHeadersNormalized;
    /**
     * The response status code
     */
    statusCode?: number;
    /**
     * The response status text
     */
}
```

### IMockResponseOptions

```ts
interface IMockResponseOptions {
    /**
     * The number of times the response should be mocked. By default, it is set to 1.
     * Set it to Number.POSITIVE_INFINITY to mock the response indefinitely.
     */
    times?: number;
}
```

### IRouteMatcher

```ts
/**
 * String comparison is case-insensitive. Provide a RegExp without the case-sensitive flag if needed.
 */
type IRouteMatcher = StringMatcher | IRouteMatcherObject;
```

### IRouteMatcherObject

```ts
type IRouteMatcherObject = {
    /**
     * A matcher for the request body
     *
     * @param requestBody The request body in string format
     * @returns `true` if matches
     */
    bodyMatcher?: (requestBody: string) => boolean;
    /**
     * If set to `true`, only cross-domain requests will match
     */
    crossDomain?: boolean;
    /**
     * A matcher for the request headers
     *
     * @param requestHeaders The request headers
     * @returns `true` if matches
     */
    headersMatcher?: (requestHeaders: IHeaders) => boolean;
    /**
     * If set to `true`, only HTTPS requests will match
     */
    https?: RouteMatcherOptions["https"];
    /**
     * The request method (GET, POST, ...)
     */
    method?: RequestMethod;
    /**
     * A matcher for the query string (URL search params)
     *
     * @param query The URL qearch params as an object
     * @returns `true` if matches
     */
    queryMatcher?: (query: Record<string, string | number>) => boolean;
    /**
     * The resource type
     */
    resourceType?: IResourceType | IResourceType[] | "all";
    /**
     * A URL matcher, use * or ** to match any word in string
     *
     * @example "**\/api/call" will match "http://any.com/api/call", "http://any.com/test/api/call", "http://any.com/test/api/call?page=99", ...
     * @example "*\api\*" will match "http://any.com/api/call", "http://any.com/api/list", "http://any.com/api/call-2?page=99&filter=1",
     * @example "**" will match any URL
     */
    url?: StringMatcher;
};
```

### IThrottleRequestOptions

```ts
interface IThrottleRequestOptions {
    /**
     * Mock a response for the provided route matcher. If used together with `mockResponse`
     * or `cy.mockInterceptorResponse`, it has lower priority.
     */
    mockResponse?: IMockResponse;
    /**
     * The number of times the request should be throttled. By default, it is set to 1.
     * Set it to Number.POSITIVE_INFINITY to throttle the request indefinitely.
     */
    times?: number;
}
```

### StringMatcher

```ts
type StringMatcher = string | RegExp;
```

### WaitUntilRequestOptions

```ts
interface WaitUntilRequestOptions extends IRouteMatcherObject {
    /**
     * The value is `true` by default. If set to `true`, a request matching the provided
     * route matcher must be logged by the Interceptor; otherwise, it waits until the
     * URL is logged and finished or fails if the waiting time runs out. If set to `false`,
     * it checks for a request matching the provided route matcher. If one exists, it
     * waits until the request is complete. If not, it does not fail and ends successfully.
     */
    enforceCheck?: boolean;
    /**
     * The duration Interceptor will wait for pending requests. The default is set to 10,000
     * or the value of the `INTERCEPTOR_REQUEST_TIMEOUT` environment variable if specified.
     */
    timeout?: number;
    /**
     * Time to wait in milliseconds. The default is set to 750.
     *
     * It is necessary to wait if there might be a following request after the last one
     * (due to JavaScript code and subsequent requests). Set it to 0 to skip repeated
     * checking for requests.
     */
    waitForNextRequest?: number;
}
```

### WriteStatsOptions

```ts
interface WriteStatsOptions {
    /**
     * The name of the file. If `undefined`, it will be generated from the running test.
     */
    fileName?: string;
    /**
     * An option to filter the logged items
     *
     * @param callStack Call information stored in the stack
     * @returns `false` if the item should be skipped
     */
    filter?: (callStack: CallStack) => boolean;
    /**
     * An option to map the logged items
     *
     * @param callStack Call information stored in the stack
     * @returns Any object you want to log
     */
    mapper?: (callStack: CallStack) => unknown;
    /**
     * When set to `true`, the output JSON will be formatted with tabs
     */
    prettyOutput?: boolean;
    /**
     * A route matcher
     */
    routeMatcher?: IRouteMatcher;
}
```

# Useful tips

## Log on fail

Just use this code in your `cypress/support/e2e.ts` or `cypress/support/e2e.js`:

```ts
import "cypress-interceptor";

afterEach(function () {
    if (this.currentTest?.state === "failed") {
        cy.interceptor().then(interceptor => {
            interceptor.writeStatsToLog("./mochawesome-report/_interceptor");
        });
    }
});
```

The code above will write all requests to the output file. However, you can use a route matcher to filter only the requests you want. For example:

```ts
// the output will contain only ajax requests
interceptor.writeStatsToLog("./mochawesome-report/_interceptor", { url: "**/my-api" });
```

See the method you can use: [`writeStatsToLog`](#writestatstolog).

## Clean the videos for successful tests

If you have a reporter and send the report somewhere, you may want videos only for failed tests. If so, you can do it like this in your `cypress/support/e2e.ts` or `cypress/support/e2e.js`:

```ts
import { defineConfig } from 'cypress';
import * as fs from 'fs';

export default defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // clean videos for successful tests
            on('after:run', results => {
                if (!('runs' in results)) {
                    return;
                }

                for (const run of results.runs) {
                    if (run.stats.failures === 0 && run.video && fs.existsSync(run.video)) {
                        fs.unlinkSync(run.video);
                    }
                }
            });
        }
    }
});
```

# Websocket Interceptor

## Getting started

It is very simple, just install the package using `yarn` or `npm` and import the package in your `cypress/support/e2e.js` or `cypress/support/e2e.ts`:

```js
import "cypress-interceptor/lib/websocket";
```

## The Cypress Websocket Interceptor commands

```ts
/**
 * Get an instance of the Websocket Interceptor
 *
 * @returns An instance of the Websocket Interceptor
 */
wsInterceptor: () => Chainable<WebsocketInterceptor>;
/**
 * Get the last call matching the provided route matcher.
 *
 * @param matcher A matcher
 * @returns The last call information or `undefined` if none matches.
 */
wsInterceptorLastRequest: (
    matcher?: IWSMatcher
) => Chainable<CallStackWebsocket | undefined>;
/**
 * Get the statistics for all requests matching the provided matcher since the beginning
 * of the current test.
 *
 * @param matcher A matcher
 * @returns It returns all requests matching the provided matcher with detailed information.
 * If none match, it returns an empty array.
 */
wsInterceptorStats: (matcher?: IWSMatcher) => Chainable<CallStackWebsocket[]>;
/**
 * Reset the the Websocket Interceptor's watch
 */
wsResetInterceptorWatch: VoidFunction;
/**
 * Wait until a websocket action occurs
 *
 * @param options Action options
 * @param errorMessage An error message when the maximum waiting time is reached
 */
waitUntilWebsocketAction(
    options?: WaitUntilActionOptions,
    errorMessage?: string
): Cypress.Chainable<WebsocketInterceptor>;
/**
 * Wait until a websocket action occurs
 *
 * @param matcher A matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 */
waitUntilWebsocketAction(
    matcher?: IWSMatcher | IWSMatcher[],
    errorMessage?: string
): Cypress.Chainable<WebsocketInterceptor>;
/**
 * Wait until a websocket action occurs
 *
 * @param matcher A matcher
 * @param options Action options
 * @param errorMessage An error message when the maximum waiting time is reached
 */
waitUntilWebsocketAction(
    matcher?: IWSMatcher | IWSMatcher[],
    options?: WaitUntilActionOptions,
    errorMessage?: string
): Cypress.Chainable<WebsocketInterceptor>;
waitUntilWebsocketAction(
    matcherOrOptions?: IWSMatcher | IWSMatcher[] | WaitUntilActionOptions,
    errorMessageOrOptions?: string | WaitUntilActionOptions,
    errorMessage?: string
): Cypress.Chainable<WebsocketInterceptor>;
```

## Cypress environment variables

Same as [Cypress environment variables](#cypress-environment-variables).

# Documentation and examples

## cy.wsInterceptor

```ts
wsInterceptor: () => Chainable<WebsocketInterceptor>;
```

Get an instance of the Websocket Interceptor

### Example

```ts
cy.wsInterceptor().then(interceptor => {
    interceptor.resetWatch();

    intereptor.writeStatsToLog("_logs", { protocols: "soap" }, "stats");
});
```

## cy.wsInterceptorLastRequest

Get the last call matching the provided route matcher.

```ts
wsInterceptorLastRequest: (matcher?: IWSMatcher) => Chainable<CallStackWebsocket | undefined>;
```

### Example

```ts
cy.wsInterceptorLastRequest({ url: "some-url" }).should("not.be.undefined");

 cy.wsInterceptorLastRequest({ type: "close" }).then((entry) => {
    expect(entry).not.to.be.undefined;
    expect(entry!.data).to.haveOwnProperty("code", code);
    expect(entry!.data).to.haveOwnProperty("reason", reason);
    expect(entry!.url.toString().endsWith("some-url")).to.be.true;
});
```

## cy.wsInterceptorStats

Get the statistics for all requests matching the provided matcher since the beginning of the current test.

```ts
wsInterceptorStats: (matcher?: IWSMatcher) => Chainable<CallStackWebsocket[]>;
```

### Example

```ts
cy.wsInterceptorStats({ type: "send" }).then((stats) => {
    expect(stats.length).to.eq(2);
    expect(stats[0].data).not.to.be.empty;
    expect(stats[1].data).not.to.be.empty;
});

cy.wsInterceptorStats({ type: "onmessage" }).then((stats) => {
    expect(stats.length).to.eq(2);
    expect(stats[0].data).to.haveOwnProperty("data", "some response 1");
    expect(stats[1].data).to.haveOwnProperty("data", "some response 2");
});
```

## cy.wsResetInterceptorWatch

Reset the the Websocket Interceptor's watch

```ts
wsResetInterceptorWatch: () => void;
```

## cy.waitUntilWebsocketAction

Wait until a websocket action occur

```ts
waitUntilWebsocketAction(
    options?: WaitUntilActionOptions,
    errorMessage?: string
): Cypress.Chainable<WebsocketInterceptor>;
waitUntilWebsocketAction(
    matcher?: IWSMatcher | IWSMatcher[],
    errorMessage?: string
): Cypress.Chainable<WebsocketInterceptor>;
waitUntilWebsocketAction(
    matcher?: IWSMatcher | IWSMatcher[],
    options?: WaitUntilActionOptions,
    errorMessage?: string
): Cypress.Chainable<WebsocketInterceptor>;
```

### Example

```ts
// wait for the specific response
cy.waitUntilWebsocketAction({
    data: "some response",
    type: "onmessage"
});
// wait for the specific send
cy.waitUntilWebsocketAction({
    data: "some data",
    type: "send"
});
// wait for two sends
cy.waitUntilWebsocketAction(
    {
        type: "send"
    },
    { countMatch: 2 }
);
// wait for multiple actions
cy.waitUntilWebsocketAction([
    {
        data: "onmessage data",
        type: "onmessage",
        url: "**/path-1"
    },
    {
        data: "send data",
        type: "send",
        url: "**/path-2"
    },
    {
        data: "onmessage data",
        protocols: "xmpp",
        type: "onmessage",
        url: "**/path-3"
    }
]);
// wait for an action having a url filtered by RegExp
cy.waitUntilWebsocketAction({
    data: responseData12,
    type: "onmessage",
    url: new RegExp(`some-path$`, "i")
});
// wait for a specific close action with the code and reason equal to a specified value
cy.waitUntilWebsocketAction([
    {
        code: 1000,
        reason: "some reason",
        type: "close"
    }
]);
```

## Websocket Interceptor public methods

### callStack

Returns a copy of all logged requests since the WebSocket Interceptor was created (the Websocket Interceptor is created in `beforeEach`).

```ts
get callStack(): CallStackWebsocket[];
```

## getLastRequest

Same as [`cy.wsInterceptorLastRequest`](#cywsinterceptorlastrequest).

## getStats

Same as [`cy.wsInterceptorStats](#cywsinterceptorstats).

## resetWatch

Same as [`cy.wsResetInterceptorWatch](#cywsresetinterceptorwatch).

## setOptions

Same as [`wsInterceptorOptions`](#cywsinterceptoroptions).

## waitUntilWebsocketAction

Same as [`cy.waitUntilWebsocketAction`](#cywaituntilwebsocketaction).

## writeStatsToLog

```ts
writeStatsToLog(outputDir: string, options?: WriteStatsOptions): void;
```

_References:_
  - [`WriteStatsOptions`](#writestatsoptions-1)

Write the logged requests' information (or those filtered by the provided matcher) to a file. The file will contain the JSON.stringify of [`callStack`](#callstack-1).

### Example

```ts
afterAll(() => {
    cy.wsInterceptor().then(interceptor => {
        // the output file will be "./out/test.cy.ts (Description - It).stats.json" (the name of the file `test.cy.ts (Description - It)` will be generated from the running test)
        interceptor.writeStatsToLog("./out");
        // the output file will be "./out/file_name.stats.json"
        interceptor.writeStatsToLog("./out", { fileName: "file_name" });
        // write only stats for a specific URL to the output file
        interceptor.writeStatsToLog("./out", { matcher: { url: "**/some-url" } });
         // write only "onmessage" actions to the output file
        interceptor.writeStatsToLog("./out", { filter: (entry) => entry.type === "onmessage" });
        // map the output that will be written to the output file
        interceptor.writeStatsToLog("./out", { mapper: (entry) => ({ type: entry.type, url: entry.url }) });
    });
});
```

# Interfaces

## IWSMatcher

```ts
type IWSMatcher = {
    /**
     * A matcher for the query string (URL search params)
     *
     * @param query The URL qearch params as an object
     * @returns `true` if matches
     */
    queryMatcher?: (query: Record<string, string | number>) => boolean;
    /**
     * Websocket protocols
     */
    protocols?: string | string[];
    /**
     * A URL matcher, use * or ** to match any word in string
     *
     * @example "**\/api/call" will match "http://any.com/api/call", "http://any.com/test/api/call", "http://any.com/test/api/call?page=99", ...
     * @example "*\api\*" will match "http://any.com/api/call", "http://any.com/api/list", "http://any.com/api/call-2?page=99&filter=1",
     * @example "**" will match any URL
     */
    url?: StringMatcher;
} & (
    | {
          types?: ("create" | "close" | "onclose" | "onerror" | "onopen" | "onmessage" | "send")[];
      }
    | {
          type?: "create" | "onerror" | "onopen";
      }
    | {
          code?: number;
          reason?: string;
          type?: "close";
      }
    | {
          code?: number;
          reason?: string;
          type: "onclose";
      }
    | {
          data?: string;
          type: "onmessage";
      }
    | {
          data?: string;
          type: "send";
      }
);
```

## WriteStatsOptions

```ts
interface WriteStatsOptions {
    /**
     * The name of the file. If `undefined`, it will be generated from the running test.
     */
    fileName?: string;
    /**
     * An option to filter the logged items
     *
     * @param callStack Call information stored in the stack
     * @returns `false` if the item should be skipped
     */
    filter?: (callStack: CallStackWebsocket) => boolean;
    /**
     * An option to map the logged items
     *
     * @param callStack Call information stored in the stack
     * @returns Any object you want to log
     */
    mapper?: (callStack: CallStackWebsocket) => unknown;
    /**
     * A matcher
     */
    matcher?: IWSMatcher;
    /**
     * When set to `true`, the output JSON will be formatted with tabs
     */
    prettyOutput?: boolean;
}
```

# Watch The Console

Watch The Console is a helper function for logging the browser's console to a file. After a test fails, it creates a file in the output folder with all console entries. You can also use custom options to customize the output and create output files independently of test failures.

## Using

In your `cypress/support/e2e.js` or `cypress/support/e2e.ts`:

```ts
import { watchTheConsole } from "cypress-interceptor/lib/console";

// catch all console entries such as log, info, warn, error, JavaScript error, and log them to a JSON file in the output folder
watchTheConsole("output_dir");
```

## Implementation

```ts
/**
 * @param outputDir The output directory where the console logs will be saved
 * @param logOnlyType Log only specific types of console output. If not provided, it logs all console entries.
 */
function watchTheConsole(outputDir: string, logOnlyType?: ConsoleLogType[]): void;
/**
 * @param options Log options
 */
function watchTheConsole(options: CustomLog | CustomLog[]): void;
```

## Examples

```ts
import { ConsoleLogType, watchTheConsole } from "cypress-interceptor/lib/console";
```

### Log on fail

```ts
// the log will be created in the following folder only for failed tests and will contain all console log types and unhandled JavaScript errors
watchTheConsole("output_dir");
```

### Log on failure with type filtering

```ts
// the log will be created in the following folder only for failed tests and will contain only console error logs and unhandled JavaScript errors
watchTheConsole("output_dir", [ConsoleLogType.ConsoleError, ConsoleLogType.Error]);
```

### Custom log

```ts
// log all console errors and unhandled JavaScript errors to the `_error_log` folder for all tests. If the test does not contain the type, it will not create the log file.
watchTheConsole({
    outputDir: "_error_log",
    types: [ConsoleLogType.ConsoleError, ConsoleLogType.Error]
});
// or you can combine multiple rules
watchTheConsole([
    {
        outputDir: "_error_log",
        types: [ConsoleLogType.ConsoleError, ConsoleLogType.Error]
    }, {
        outputDir: "_warning_log",
        types: [ConsoleLogType.ConsoleWarn]
    }
]);
```

### Combination

You can call `watchTheConsole` multiple times for custom logs, including those for failing tests.

```ts
// log all console output and unhandled JavaScript errors to the `_fail_log` folder when a test fails
watchTheConsole("_fail_log");
// log all console errors and unhandled JavaScript errors to the `_error_log` folder for all tests
watchTheConsole({
    outputDir: "_error_log",
    types: [ConsoleLogType.ConsoleError, ConsoleLogType.Error]
});
```