[![NPM](https://img.shields.io/npm/v/cypress-interceptor.svg)](https://www.npmjs.com/package/cypress-interceptor)
[![Build Status](https://github.com/MartinTichovsky/cypress-interceptor/workflows/CI/badge.svg)](https://github.com/MartinTichovsky/cypress-interceptor/actions?workflow=CI)
[![Coverage Status](https://coveralls.io/repos/github/MartinTichovsky/cypress-interceptor/badge.svg?branch=main)](https://coveralls.io/github/MartinTichovsky/cypress-interceptor?branch=main)

# Cypress Interceptor

![Example of using](https://github.com/MartinTichovsky/__sources__/raw/master/ezgif-3-82de2705f1.gif)

## About

Cypress Interceptor is a substitute for `cy.intercept`. Its main purpose is to log all fetch or XHR requests, which can be analyzed in case of failure. It provides extended ways to log these statistics, including the ability to mock or throttle requests easily. Cypress Interceptor is better than `cy.intercept` because it can avoid issues, especially when using global request catching.

There is also an option to monitor the web browser console output and log it to a file or work with WebSockets. For more details, refer to the [Watch The Console](#watch-the-console) or [WebSocket section](#websocket-interceptor).

For detailed information about generating beautiful HTML reports with network analysis, see the [Network Report Generation documentation](./README.report.md).

## Motivation

This diagnostic tool is born out of extensive firsthand experience tracking down elusive, seemingly random Cypress test failures. These issues often weren't tied to Cypress itself, but rather to the behavior of the underlying web application—especially in headless runs on build servers where no manual interaction is possible. By offering robust logging for both API requests and the web console, the tool provides greater transparency and insight into the root causes of failures, ultimately helping developers streamline their debugging process and ensure more reliable test outcomes.

Beyond logging, Cypress Interceptor now includes [**Network Report Generation**](./README.report.md) that transforms raw network data into beautiful, interactive HTML reports. These reports feature performance charts, detailed request/response tables, and comprehensive statistics, making it easier than ever to analyze and understand your application's network behavior. [See an example report here](https://martintichovsky.github.io/cypress-interceptor/report-example/report.html) to experience the visual power of network analysis.

## What's new
- Added [**Network Report Generation**](./README.report.md) feature that creates beautiful HTML reports with interactive charts and detailed network analysis
- Added [`cy.destroyInterceptor`](#cydestroyinterceptor) and [`cy.recreateInterceptor`](#cyrecreateinterceptor) commands for better control over interceptor lifecycle
- Fixed navigation issue with XMLHttpRequest where relative paths were incorrectly resolved in Cypress iframe context
- Added [`test.unit`](#testunit) as a helper for testing.
- Improved the use of Interceptor in `before` hooks and added the ability to pass a function to `cy.waitUntilRequestIsDone`
- [Watch The Console](#watch-the-console) has been reworked and its logic completely changed
- The improved [Watch The Console](#watch-the-console) now safely logs objects and functions, with an added filtering option
- Added [`cy.writeInterceptorStatsToLog`](#cywriteinterceptorstatstolog) and [`cy.wsInterceptorStatsToLog`](#cywsinterceptorstatstolog)
- Complete rework, exclude `cy.intercept` as the main tool of logging, stabilizing runs, support all fetch and XHR body types
- Work with cancelled and aborted requests
- Add support for WebSockets

## Table of contents

- Cypress Interceptor
    - [Getting started](#getting-started)
    - [Would you just log all requests to a file on fail?](#would-you-just-log-all-requests-to-a-file-on-fail)
    - [Would you like to wait until a request or requests are done?](#would-you-like-to-wait-until-a-request-or-requests-are-done)
    - [Interceptor Cypress commands](#the-cypress-interceptor-commands)
    - [Cypress environment variables](#cypress-environment-variables)
    - [Documentation and examples](#documentation-and-examples)
        - [cy.destroyInterceptor](#cydestroyinterceptor)
        - [cy.interceptor](#cyinterceptor)
        - [cy.interceptorLastRequest](#cyinterceptorlastrequest)
        - [cy.interceptorOptions](#cyinterceptoroptions)
        - [cy.interceptorRequestCalls](#cyinterceptorrequestcalls)
        - [cy.interceptorStats](#cyinterceptorstats)
        - [cy.mockInterceptorResponse](#cymockinterceptorresponse)
        - [cy.recreateInterceptor](#cyrecreateinterceptor)
        - [cy.resetInterceptorWatch](#cyresetinterceptorwatch)
        - [cy.throttleInterceptorRequest](#cythrottleinterceptorrequest)
        - [cy.waitUntilRequestIsDone](#cywaituntilrequestisdone)
        - [cy.writeInterceptorStatsToLog](#cywriteinterceptorstatstolog)
    - [Interceptor public methods](#interceptor-public-methods)
        - [callStack](#callstack)
        - [onRequestError](#onrequesterror)
        - [removeMock](#removemock)
        - [removeThrottle](#removethrottle)
    - [Interfaces](#interfaces)
    - [Useful tips](#useful-tips)
        - [Log on fail](#log-on-fail)
        - [Clean the videos for successful tests](#clean-the-videos-for-successful-tests)
- [Watch The Console](#watch-the-console)
    - [Getting started](#getting-started-1)
    - [WatchTheConsole Cypress commands](#the-cypress-watchtheconsole-commands)
    - [Documentation and examples](#documentation-and-examples-1)
        - [cy.watchTheConsole](#cywatchtheconsole)
        - [cy.watchTheConsoleOptions](#cywatchtheconsoleoptions)
        - [cy.writeConsoleLogToFile](#cywriteconsolelogtofile)
    - [WatchTheConsole public methods](#watchtheconsole-public-methods)
        - [log](#log)
    - [Interfaces](#interfaces-1)
- [Websocket Interceptor](#websocket-interceptor)
    - [Getting started](#getting-started-2)
    - [Websocket Interceptor Cypress commands](#the-cypress-websocket-interceptor-commands)
    - [Cypress environment variables](#cypress-environment-variables-1)
    - [Documentation and examples](#documentation-and-examples-2)
        - [cy.wsInterceptor](#cywsinterceptor)
        - [cy.wsInterceptorLastRequest](#cywsinterceptorlastrequest)
        - [cy.wsInterceptorStats](#cywsinterceptorstats)
        - [cy.wsInterceptorStatsToLog](#cywsinterceptorstatstolog)
        - [cy.wsResetInterceptorWatch](#cywsresetinterceptorwatch)
        - [cy.waitUntilWebsocketAction](#cywaituntilwebsocketaction)
    - [Websocket Interceptor public methods](#websocket-interceptor-public-methods)
        - [callStack](#callstack-1)
    - [Interfaces](#interfaces-2)
- [`test.unit`](#testunit)
    - [How to use](#how-to-use)
    - [`test.unit` Cypress commands](#testunit-cypress-commands)
    - [Documentation and examples](#documentation-and-examples-3)
        - [cy.callLine](#cycallline)
        - [cy.callLineClean](#cycalllineclean)
        - [cy.callLineCurrent](#cycalllinecurrent)
        - [cy.callLineDisable](#cycalllinedisable)
        - [cy.callLineEnable](#cycalllineenable)
        - [cy.callLineLength](#cycalllinelength)
        - [cy.callLineNext](#cycalllinenext)
        - [cy.callLineReset](#cycalllinereset)
        - [cy.callLineToFile](#cycalllinetofile)
    - [The main functions intended to be used on the front-end](#the-main-functions-intended-to-be-used-on-the-front-end)
        - [lineCalled](#linecalled)
        - [lineCalledWithClone](#linecalledwithclone)
    - [Interfaces](#interfaces-3)
- [Network Report Generation](./README.report.md)
- [Other commands](#other-commands)
    - [cy.startTiming](#cystarttiming)
    - [cy.stopTiming](#cystoptiming)


## Getting started

It is very simple, just install the package using `yarn` or `npm` and import the package in your `cypress/support/e2e.js`, `cypress/support/e2e.ts`, or in any of your test files:

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
 * Destroy the interceptor by restoring the original fetch and
 * XMLHttpRequest implementations. This command removes all proxy
 * functionality and restores the browser's native implementations.
 */
destroyInterceptor(): Chainable<void>;
/**
 * Get an instance of the Interceptor
 *
 * @returns An instance of the Interceptor
 */
interceptor(): Chainable<Interceptor>;
/**
 * Get the last call matching the provided route matcher.
 *
 * @param routeMatcher A route matcher
 * @returns The last call information or `undefined` if none matches.
 */
interceptorLastRequest(routeMatcher?: IRouteMatcher): Chainable<CallStack | undefined>;
/**
 * Set the Interceptor options. This must be called before a request occurs.
 *
 * @param options Options
 * @returns The current Interceptor options
 */
interceptorOptions(options?: InterceptorOptions): Chainable<InterceptorOptions>;
/**
 * Get the number of requests matching the provided route matcher.
 *
 * @param routeMatcher A route matcher
 * @returns The number of requests matching the provided route matcher since the current test started.
 */
interceptorRequestCalls(routeMatcher?: IRouteMatcher): Chainable<number>;
/**
 * Get the statistics for all requests matching the provided route matcher since the beginning
 * of the current test.
 *
 * @param routeMatcher A route matcher
 * @returns It returns all requests matching the provided route matcher with detailed information.
 * If none match, it returns an empty array.
 */
interceptorStats(routeMatcher?: IRouteMatcher): Chainable<CallStack[]>;
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
 * Recreate the Interceptor instance.
 */
recreateInterceptor(): Chainable<void>;
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
startTiming(): Chainable<number>;
/**
 * Stop the time measurement (a helper function)
 *
 * @returns If `cy.startTiming` was called, it returns the time difference since startTiming was
 * called (in ms); otherwise, it returns `undefined`.
 */
stopTiming(): Chainable<number | undefined>;
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
 * @param action An action which should trigger a request
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 * @returns The result from the action
 */
waitUntilRequestIsDone<T>(
    action: () => Cypress.Chainable<T>,
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
): Chainable<T>;
/**
 * @param action An action which should trigger a request
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 * @returns The result from the action
 */
waitUntilRequestIsDone<T>(
    action: () => T,
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
): Chainable<T>;
/**
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 * @returns An instance of the Interceptor
 */
waitUntilRequestIsDone(
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
): Chainable<Interceptor>;
/**
 * Write the logged requests' information (or those filtered by the provided route matcher) to a file
 *
 * @example cy.writeInterceptorStatsToLog("./out") => the output file will be "./out/[Description] It.stats.json"
 * @example cy.writeInterceptorStatsToLog("./out", { fileName:  "file_name" }) =>  the output file will be "./out/file_name. stats.json"
 * @example cy.writeInterceptorStatsToLog("./out", {  routeMatcher: { method: "GET" } }) => write only "GET" requests  to the output file
 * @example cy.writeInterceptorStatsToLog("./out", { mapper:  (callStack) => ({ type: callStack.type, url: callStack.url }) })  => map the output that will be written to the output file
 *
 * @param outputDir The path for the output folder
 * @param options Options
 */
writeInterceptorStatsToLog(
    outputDir: string,
    options?: WriteStatsOptions &
        Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
): Chainable<null>;
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

__`INTERCEPTOR_REQUEST_TIMEOUT`__ - the value (in ms) that defines how long the Interceptor will wait for pending requests when calling `cy.waitUntilRequestIsDone()`

# Documentation and examples

In almost all methods, there is a route matcher ([`IRouteMatcher`](#iroutematcher)) that can be a string, a RegExp ([`StringMatcher`](#stringmatcher)), or an object with multiple matching options. For more information about matching options, explore [`IRouteMatcherObject`](#iroutematcherobject).

## cy.destroyInterceptor

```ts
destroyInterceptor: () => Chainable<void>;
```

Destroy the interceptor by restoring the original fetch and XMLHttpRequest implementations. This command removes all proxy functionality and restores the browser's native implementations.

### Example

```ts
// Destroy the interceptor to restore native behavior
cy.destroyInterceptor();
```

## cy.interceptor

```ts
/**
 * @returns An instance of Interceptor
 */
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
/**
 * @param routeMatcher A route matcher
 * @returns The last call information or `undefined` if none matches.
 */
interceptorLastRequest: (
    routeMatcher?: IRouteMatcher
) => Chainable<CallStack | undefined>;
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
/**
 * @param options Options
 * @returns The current Interceptor options
 */
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
/**
 * @param routeMatcher A route matcher
 * @returns The number of requests matching the provided route matcher since the current test started.
 */
interceptorRequestCalls: (routeMatcher?: IRouteMatcher) => Chainable<number>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)

Get the number of requests matching the provided route matcher.

### Example

```ts
// There should be only one call logged to a URL ending with `/api/getOrder`
cy.interceptorRequestCalls("**/api/getOrder").should("eq", 1);
```

```ts
// there should be only 4 fetch requests
cy.interceptorRequestCalls({ resourceType: ["fetch"] }).should("eq", 4);
```

## cy.interceptorStats

```ts
/**
 * @param routeMatcher A route matcher
 * @returns It returns all requests matching the provided route matcher with detailed information.
 * If none match, it returns an empty array.
 */
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
/**
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
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)
  - [`IMockResponse`](#imockresponse)
  - [`IMockResponseOptions`](#imockresponseoptions)

Mock the response of requests matching the provided route matcher. By default, it mocks the first matching request, and then the mock is removed. Set `times` in the options to change how many times the matching requests should be mocked.

__Important__

By default, the mocked request does not reach the network layer. Set `allowHitTheNetwork` to `true` if you want the request to reach the network layer

### Examples

```ts
// return status 400 to all fetch requests, indefinitely
cy.mockInterceptorResponse(
    { resourceType: "fetch" },
    { statusCode: 400 },
    { times: Number.POSITIVE_INFINITY }
);
```

```ts
// return a custom body to a request ending with `/api/getUser`, default once
cy.mockInterceptorResponse(
    { url: "**/api/getUser" },
    { 
        body: {
            userName: "LordVoldemort"
        }
     }
);
```

```ts
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
```

```ts
// return a custom body to any fetch request, twice
cy.mockInterceptorResponse(
    { resourceType: "fetch" },
    { 
        generateBody: (request, getJsonRequestBody) => {
            return {
                userName: "LordVoldemort"
            };
        }
     },
     { times: 2 }
);
```

```ts
// generate the response dynamically
cy.mockInterceptorResponse(
    { resourceType: "fetch" },
    {
        generateBody: (_, getJsonRequestBody) =>
            "page" in getJsonRequestBody<{ page: number }>()
            ? ({ custom: "response 1" })
            : ({ custom: "response 2" })
    }
);
```


```ts
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
```

```ts
// mock the request having `page` in the request body, default once
cy.mockInterceptorResponse(
    {
        bodyMatcher: () => {
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

## cy.recreateInterceptor

```ts
recreateInterceptor: () => Chainable<null>;
```

Recreate the interceptor with a new instance. This command creates a fresh interceptor instance and reestablishes the proxy functionality.

### Example

```ts
// Recreate the interceptor to get a fresh instance or when it was destroyed
cy.recreateInterceptor();
```

## cy.resetInterceptorWatch

```ts
resetInterceptorWatch: VoidFunction;
```

Reset the Interceptor's watch. It sets the pointer to the last call. Resetting the pointer is necessary when you want to wait for certain requests.

### Example

On a site, there are multiple requests to api/getUser, but we want to wait for the specific one that occurs after clicking a button. Since we cannot know which api/getUser call to wait for, calling this method sets the exact point from which we want to check the next requests.

```ts
// this page contains multiple requests to `api/getUser` when visited
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
/**
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
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)
  - [`IThrottleRequestOptions`](#ithrottlerequestoptions)
  - [`IMockResponseOptions`](#imockresponseoptions)

Throttle requests matching the provided route matcher by setting a delay. By default, it throttles the first matching request, and then the throttle is removed. Set times in the options to change how many times the matching requests should be throttled.

In the options, the `mockResponse` property can accept the same mocking object as shown in [cy.mockInterceptorResponse](#cymockinterceptorresponse).

### Example

```ts
// make the request to `/api/getUser` last for 5 seconds
cy.throttleInterceptorRequest("**/api/getUser", 5000);
```

```ts
// throttle a request which has the URL query string containing key `page` equal to 5
cy.throttleInterceptorRequest({ queryMatcher: (query) => query?.page === 5}, 5000);
```

```ts
// throttle all requests for 5 seconds
cy.throttleInterceptorRequest({ resourceType: "all" }, 5000, { times: Number.POSITIVE_INFINITY });
cy.throttleInterceptorRequest("*", 5000, { times: Number.POSITIVE_INFINITY });
```

```ts
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

![Example of using](https://github.com/MartinTichovsky/__sources__/raw/master/ezgif-3-3992b366b5.gif)

```ts
/**
 * @param action An action which should trigger a request
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 * @returns The result from the action
 */
waitUntilRequestIsDone<T>(
    action: () => Cypress.Chainable<T>,
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
): Chainable<T>;
/**
 * @param action An action which should trigger a request
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 * @returns The result from the action
 */
waitUntilRequestIsDone<T>(
    action: () => T,
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
): Chainable<T>;
/**
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum waiting time is reached
 * @returns An instance of the Interceptor
 */
waitUntilRequestIsDone(
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
): Chainable<Interceptor>;
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

__Important__

It is crucial to call [`cy.resetInterceptorWatch()`](#cyresetinterceptorwatch) before an action that should trigger a request you want to wait for, or pass an action that should trigger the request as the first argument. The reason is that there may be a chain of requests preventing the one you want to wait for from being processed. More details below.

### Examples

```ts
// will wait until all requests in progress are finished
cy.waitUntilRequestIsDone();
```

```ts
// will wait until the login request is finished
// cy.resetInterceptorWatch is called automatically when you provide a function as the first argument
cy.waitUntilRequestIsDone(
    // the request which triggers the request
    () => cy.contains("button", "Log In").click(),
    "**/api/log-in"
);
```

```ts
// when you do not provide a function as the first argument it is needed to call cy.resetInterceptorWatch
// because the request you want to wait for could be called before and Interceptor will see it as done
cy.resetInterceptorWatch();
// any action that should trigger the request
cy.contains("button", "Log In").click();
// wait for requests ending with `/api/getUser`
cy.waitUntilRequestIsDone("**/api/getUser");
cy.waitUntilRequestIsDone(new RegExp("api\/getUser$", "i"));
```

```ts
cy.waitUntilRequestIsDone();
// any action that should trigger the request
action();
// wait for requests containing `/api/`
cy.waitUntilRequestIsDone("**/api/**");
cy.waitUntilRequestIsDone(new RegExp("(.*)\/api\/(.*)", "i"));
```

```ts
// wait until this request is finished
cy.waitUntilRequestIsDone("http://my-page.org/api/getUser");
```

```ts
// providing a custom error message when maximum time of waiting is reached
cy.waitUntilRequestIsDone("http://my-page.org/api/getUser", "Request never happened");
```

```ts
// wait until all fetch requests are finished
cy.waitUntilRequestIsDone({ resourceType: "fetch" });
```

```ts
// wait maximum 200s for this fetch to finish
cy.waitUntilRequestIsDone({ url: "http://my-page.org/api/getUser", timeout: 200000 });
```

```ts
// wait 2s after the request to `api/getUser` finishes to check if there is an another request
cy.waitUntilRequestIsDone({ url: "http://my-page.org/api/getUser", waitForNextRequest: 2000 });
```

```ts
// wait until all cross-domain requests are finished but do not fail if there is none
cy.waitUntilRequestIsDone({ crossDomain: true, enforceCheck: false });
```

```ts
// increase the timeout of `cy.writeFile` if you expect the stats to be large
cy.waitUntilRequestIsDone(outputDir, {
    timeout: 60000
});
```

## cy.writeInterceptorStatsToLog

```ts
/**
 * @param outputDir The path for the output folder
 * @param options Options
 */
writeInterceptorStatsToLog: (outputDir: string, options?: WriteStatsOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>) => Chainable<null>;
```

Write the logged requests' information (or those filtered by the provided route matcher) to a file

### Example

```ts
// the output file will be "./out/[Description] - It.stats.json"
cy.writeInterceptorStatsToLog("./out");
```

```ts
// the output file will be "./out/file_name.stats.json"
cy.writeInterceptorStatsToLog("./out", { fileName: "file_name" });
```

```ts
// write only "GET" requests to the output file
cy.writeInterceptorStatsToLog("./out", { routeMatcher: { method: "GET" } });
```

```ts
// map the output that will be written to the output file
cy.writeInterceptorStatsToLog("./out", { mapper: (callStack) => ({ type: callStack.type, url: callStack.url }) });
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

Same as [`cy.writeInterceptorStatsToLog`](#cywriteinterceptorstatstolog).

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
     * When this property is set to `true`, it allows the request to reach the network.
     * By default, the mocked request does not reach the network layer.
     */
    allowHitTheNetwork?: boolean;
    /**
     * The response body, it can be anything
     */
    body?: unknown;
    /**
     * Generate a body with the original response body. This option has higher priority
     * than the `body` option.
     *
     * @param request An object with the request data (body, query, method, ...)
     * @param getJsonRequestBody It will try to return a parsed request body
     * @returns The response body, it can be anything
     */
    generateBody?: (request: IRequest, getJsonRequestBody: <T = unknown>() => T) => unknown;
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
    statusText?: string;
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
     * @param query The URL search params as an object
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
        cy.writeInterceptorStatsToLog("./mochawesome-report/_interceptor");
    }
});
```

The code above will write all requests to the output file. However, you can use a route matcher to filter only the requests you want. For example:

```ts
// the output will contain only ajax requests
cy.writeInterceptorStatsToLog("./mochawesome-report/_interceptor", { url: "**/my-api" });
```

See the method you can use: [`cy.writeInterceptorStatsToLog`](#cywriteinterceptorstatstolog).

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

# Watch The Console

Watch The Console is a helper function for logging the browser's console to a file. It provides a class which observes the web browser console output. This output can be logged to a file.

## Getting started

In your `cypress/support/e2e.js`, `cypress/support/e2e.ts` or in any of your test files:

```ts
import "cypress-interceptor/console";
```

## The Cypress WatchTheConsole commands

```ts
 /**
 * Get an instance of the WatchTheConsole
 *
 * @returns An instance of the WatchTheConsole
 */
watchTheConsole: () => Chainable<WatchTheConsole>;
/**
 * Set the WatchTheConsole options. This must be called before a web page is visited.
 *
 * @param options Options
 * @returns The current WatchTheConsole options
 */
watchTheConsoleOptions: (
    options?: WatchTheConsoleOptions
) => Chainable<WatchTheConsoleOptions>;
/**
 * Write the logged console output to a file
 *
 * @example cy.writeConsoleLogToFile("./out") => the output file will be "./out/[Description] It.stats.json"
 * @example cy.writeConsoleLogToFile("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
 * @example cy.writeConsoleLogToFile("./out", { types: [ConsoleLogType.ConsoleError, ConsoleLogType.Error] }) => write only the
 * console errors and unhandled JavaScript errors to the output file
 * @example cy.writeConsoleLogToFile("./out", { filter: (type, ...args) => typeof args[0] === "string" && args[0].startsWith("Custom log:") }) =>
 * filter all console output to include only entries starting with "Custom log:"
 *
 * @param outputDir The path for the output folder
 * @param options Options
 */
writeConsoleLogToFile: (
    outputDir: string,
    options?: WriteLogOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
) => Chainable<null>;
```

# Documentation and examples

## cy.watchTheConsole

```ts
watchTheConsole: () => Chainable<WatchTheConsole>;
```

Get an instance of the WatchTheConsole

### Example

```ts
cy.watchTheConsole().then(watchTheConsole => {
    expect(
        watchTheConsole.log.filter((entry) => entry.type === ConsoleLogType.ConsoleError).length
    ).to.eq(0);
});
```

## cy.watchTheConsoleOptions

```ts
watchTheConsoleOptions: (
    options?: WatchTheConsoleOptions
) => Chainable<WatchTheConsoleOptions>;
```

_References:_
  - [`WatchTheConsoleOptions`](#watchtheconsoleoptions)

Set the WatchTheConsole options. This must be called before a web page is visited.

### Example

```ts
beforeEach(() => {
    /**
     * My application is using `redux-logger` and provides an extended log of the Redux store. Therefore,
     * it is necessary to remove circular dependencies and, most importantly, capture the object at the
     * moment it is logged to prevent changes in the store over time.
     */
    cy.watchTheConsoleOptions({ cloneConsoleArguments: true });
});
```

## cy.writeConsoleLogToFile

```ts
writeConsoleLogToFile: (
    outputDir: string,
    options?: WriteLogOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
) => Chainable<null>;
```

Write the logged console output to a file.

_References:_
  - [`WriteLogOptions`](#writelogoptions)

### Example

```ts
// when a test fails, log all console output to a file with formatted output
afterEach(function () {
    if (this.currentTest?.state === "failed") {
         cy.writeConsoleLogToFile("_console", { prettyOutput: true });
    }
});
```

```ts
// increase the timeout for `cy.writeFile` when you expect a big output
cy.writeConsoleLogToFile("_console", {
    timeout: 120000
});
```

```ts
// write only the console errors and unhandled JavaScript errors to the output file
cy.writeConsoleLogToFile("_console", {
    types: [ConsoleLogType.ConsoleError, ConsoleLogType.Error]
});
```

```ts
// filter all console output to include only entries starting with "Custom log:"
cy.writeConsoleLogToFile(outputDir, {
    filter: (type, ...args) => typeof args[0] === "string" && args[0].startsWith("Custom log:")
});
```

# WatchTheConsole public methods

## log

```ts
get log(): ConsoleLog[];
```

Return a copy of all logged console outputs.

## setOptions

Same as [`cy.watchTheConsoleOptions`](#cywatchTheConsoleOptions).

## writeLogToFile

Same as [`cy.writeConsoleLogToFile`](#cywriteConsoleLogToFile).

# Interfaces

### ConsoleLog

```ts
interface ConsoleLog {
    /**
     * The console output or the unhandled JavaScript error message and stack trace
     */
    args: unknown[];
    /**
     * The customized date and time in the format dd/MM/yyyy, hh:mm:ss.milliseconds. (for better visual checking)
     */
    currentTime: CurrentTime;
    /**
     * The getTime() of the Date when the console was logged (for future investigation)
     */
    dateTime: DateTime;
    /**
     * Console Type
     */
    type: ConsoleLogType;
}
```

### ConsoleLogType

```ts
enum ConsoleLogType {
    ConsoleInfo = "console.info",
    ConsoleError = "console.error",
    ConsoleLog = "console.log",
    ConsoleWarn = "console.warn",
    // this is equal to a unhandled JavaScript error
    Error = "error"
}
```

### WatchTheConsoleOptions

```ts
interface WatchTheConsoleOptions {
    /**
     * When the console output includes an object, it is highly recommended to set this option to `true`
     * because an object can change at runtime and may not match the object that was logged at that moment.
     * When set to `true`, it will deeply copy the object and remove any circular dependencies.
     */
    cloneConsoleArguments?: boolean;
}
```

### WriteLogOptions

```ts
interface WriteLogOptions {
    /**
     * The name of the file. If `undefined`, it will be generated from the running test.
     */
    fileName?: string;
    /**
     * An option to filter the logged items
     *
     * @param type The type of the console log
     * @param args The console log arguments
     * @returns `false` if the item should be skipped
     */
    filter?: (type: ConsoleLogType, ...args: unknown[]) => boolean;
    /**
     * When set to `true`, the output JSON will be formatted with tabs
     */
    prettyOutput?: boolean;
    /**
     * "If the type is not provided, it logs all console entries
     */
    types?: ConsoleLogType[];
}
```

# Websocket Interceptor

## Getting started

It is very simple, just install the package using `yarn` or `npm` and import the package in your `cypress/support/e2e.js`, `cypress/support/e2e.ts` or in any of your test files:

```js
import "cypress-interceptor/websocket";
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
 * Write the logged requests' information (or those filtered by the provided matcher) to a file
 *
 * @example cy.wsInterceptorStatsToLog("./out") => the output file will be "./out/[Description] It.stats.json"
 * @example cy.wsInterceptorStatsToLog("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
 * @example cy.wsInterceptorStatsToLog("./out", { matcher: { protocols: "soap" } }) => write only "soap" requests to the output file
 * @example cy.wsInterceptorStatsToLog("./out", { matcher: { url: "my-url" } }) => write only requests to my-url to the output file
 * @example cy.wsInterceptorStatsToLog("./out", { mapper: (entry) => ({ url: entry.url }) }) => map the output that will be written to the output file
 *
 * @param outputDir A path for the output directory
 * @param options Options
 */
wsInterceptorStatsToLog: (
    outputDir: string,
    options?: WriteStatsOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
) => Chainable<null>;
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

    interceptor.writeStatsToLog("_logs", { protocols: "soap" }, "stats");
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
```

```ts
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
```

```ts
cy.wsInterceptorStats({ type: "onmessage" }).then((stats) => {
    expect(stats.length).to.eq(2);
    expect(stats[0].data).to.haveOwnProperty("data", "some response 1");
    expect(stats[1].data).to.haveOwnProperty("data", "some response 2");
});
```

## cy.wsInterceptorStatsToLog


```ts
wsInterceptorStatsToLog: (outputDir: string,options?: WriteStatsOptions  & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>) => Chainable<null>;
```

_References:_
  - [`WriteStatsOptions`](#writestatsoptions-1)

Write the logged requests' information (or those filtered by the provided matcher) to a file. The file will contain the JSON.stringify of [`callStack`](#callstack-1).

### Example

```ts
afterAll(() => {
    // the output file will be "./out/test.cy.ts [Description] It).stats.json" (the name of the file `test.cy.ts [Description] It` will be generated from the running test)
    cy.wsInterceptorStatsToLog("./out");
    // increase the timeout for `cy.writeFile` when you expect a big output
    cy.wsInterceptorStatsToLog("./out", { timeout: 120000 });
    // the output file will be "./out/file_name.stats.json"
    cy.wsInterceptorStatsToLog("./out", { fileName: "file_name" });
    // write only stats for a specific URL to the output file
    cy.wsInterceptorStatsToLog("./out", { matcher: { url: "**/some-url" } });
        // write only "onmessage" actions to the output file
    cy.wsInterceptorStatsToLog("./out", { filter: (entry) => entry.type === "onmessage" });
    // map the output that will be written to the output file
    cy.wsInterceptorStatsToLog("./out", { mapper: (entry) => ({ type: entry.type, url: entry.url }) });
});
```

## cy.wsResetInterceptorWatch

Reset the Websocket Interceptor's watch

```ts
wsResetInterceptorWatch: () => void;
```

## cy.waitUntilWebsocketAction

Wait until a websocket action occurs

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
```

```ts
// wait for the specific send
cy.waitUntilWebsocketAction({
    data: "some data",
    type: "send"
});
```

```ts
// wait for two sends
cy.waitUntilWebsocketAction(
    {
        type: "send"
    },
    { countMatch: 2 }
);
```

```ts
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
```

```ts
// wait for an action having a url filtered by RegExp
cy.waitUntilWebsocketAction({
    data: responseData12,
    type: "onmessage",
    url: new RegExp(`some-path$`, "i")
});
```

```ts
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

Same as [`cy.wsInterceptorStats`](#cywsinterceptorstats).

## resetWatch

Same as [`cy.wsResetInterceptorWatch`](#cywsresetinterceptorwatch).

## setOptions

Same as [`cy.wsInterceptorOptions`](#cywsinterceptoroptions).

## waitUntilWebsocketAction

Same as [`cy.waitUntilWebsocketAction`](#cywaituntilwebsocketaction).

## writeStatsToLog

Same as [`cy.wsInterceptorStatsToLog`](#cywsinterceptorstatstolog).

# Interfaces

## IWSMatcher

```ts
type IWSMatcher = {
    /**
     * A matcher for the query string (URL search params)
     *
     * @param query The URL search params as an object
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

# `test.unit`

This is a simple helper designed to store arguments passed to [`lineCalled`](#linecalled) or [`lineCalledWithClone`](#linecalledwithclone) and then call them in your application for testing in Cypress. By default, the call line is not enabled — you must enable it first in your Cypress test. There's no need to worry; in the application, it does nothing and does not slow down performance.

## How to use

In your application, you can call [`lineCalled`](#linecalled) or [`lineCalledWithClone`](#linecalledwithclone) anywhere you need:

```ts
import { lineCalled, lineCalledWithClone } from "cypress-interceptor/test.unit";

// anywhere in your application
lineCalled("any argument, object, etc.");
// or with clone, this is important for objects they can change
lineCalledWithClone(yourObject);
```

Then, enable it in your Cypress test setup before running the test:

```ts
beforeEach(() => {
    cy.window().then((win) => {
        cy.callLineEnable(win);
    });
});
```

Globally in your `cypress/support/e2e.js` or `cypress/support/e2e.ts`:

```ts
Cypress.on("window:before:load", (win) => {
    cy.callLineEnable(win);
});
// or use `beforeEach` hook
```

And in your tests you will be able to use it as follows:

```ts
import "cypress-interceptor/test.unit.commands";

// check that call line is really enabled
cy.callLine().its('isEnabled').should('be.true');

cy.callLineLength().should("eq", 0);
// OR cy.callLine().invoke("length").should("eq", 0);

// do some action which should call `lineCalled` or `lineCalledWithClone`
cy.contains("button", "Add").click();

cy.callLineNext().should("eq", "Some value");
// OR cy.callLineNext().should("deep.eq", ["some Value", { } ]);
// OR cy.callLine().then(callLine => expect(callLine.next).to.eq("something"));

// or at the end you can log all the entries into a file
afterEach(() => {
    cy.callLineToFile("output_dir");
})
```

## `test.unit` Cypress commands

```ts
/**
 * Get a created instance of the CallLine class
 *
 * @returns An instance of the CallLine class
 */
callLine(): Chainable<CallLine>;
/**
 * Clean the CallLine array and start storing the values from the beginning
 */
callLineClean(): void;
/**
 * The last existing entry. It can be `undefined` if there is no entry at
 * the moment or `next` has not been called. Otherwise it always returns
 * the last entry invoked by `next`.
 */
callLineCurrent(): Chainable<unknown | unknown[] | undefined>;
/**
 * Disable the call line
 */
callLineDisable(): void;
/**
 * Enable the call line
 */
callLineEnable(): void;
/**
 * Get the number of all entries.
 */
callLineLength(): Chainable<number>;
/**
 * Get the next entry. If there is no next entry, it returns undefined.
 *
 * If the entry was added as a single argument like `lineCalled("something")`,
 * it will return the single value "something". But if it was added as multiple
 * arguments like `lineCalled("something", 1, true)`, it will return an array
 * `["something", 1, true]`.
 */
callLineNext(): Chainable<unknown | unknown[] | undefined>;
/**
 * Resets the counter and starts from the first entry on the next call to `cy.callLineNext`
 */
callLineReset(): void;
/**
 * Save CallLine entries to a file
 *
 * @param outputDir - The folder to save the call line
 * @param options - Options for the file
 */
callLineToFile(
    outputDir: string,
    options?: CallLineToFileOptions &
        Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
): Chainable<null>;
```

## Documentation and examples

## cy.callLine

```ts
/**
 * @returns An instance of the CallLine class
 */
callLine(): Chainable<CallLine>;
```

Get a created instance of the CallLine class

### Example

```ts
// check that call line is really enabled
cy.callLine().its('isEnabled').should('be.true');
```

## cy.callLineClean

```ts
callLineClean(): void;
```

Clean the CallLine array and start storing the values from the beginning

## cy.callLineCurrent

```ts
callLineCurrent(): Chainable<unknown | unknown[] | undefined>;
```

The last existing entry. It can be `undefined` if there is no entry at the moment or `next` has not been called. Otherwise it always returns the last entry invoked by `next`.

### Example

```ts
// wait for the next entry
cy.callLineNext().should("not.be.undefined");
// do some checking
cy.callLineCurrent().should("eq", "my custom string");
// do more checkings with the last entry
cy.callLineCurrent().should("eq", ...);
```

## cy.callLineDisable

```ts
callLineDisable(): void;
```

Disable the call line feature. After calling this, calls to `lineCalled` or `lineCalledWithClone` will not be recorded until re-enabled.

## cy.callLineEnable

```ts
callLineEnable(): void;
```

Enable the call line feature. This allows calls to `lineCalled` or `lineCalledWithClone` to be recorded.

### Example

```ts
beforeEach(() => {
    cy.callLineEnable();
})
```

## cy.callLineLength

```ts
callLineLength(): Chainable<number>;
```

Get the number of all entries.

### Example

```ts
// uses a Cypress query to check the total number of entries
cy.callLineLength().should("eq", 1);
```

## cy.callLineNext

```ts
callLineNext(): Chainable<unknown | unknown[] | undefined>;
```

Get the next entry. If there is no next entry, it returns undefined.

If the entry was added as a single argument like `lineCalled("something")`, it will return the single value "something". But if it was added as multiple arguments like `lineCalled("something", 1, true)`, it will return an array `["something", 1, true]`.

### Example

```ts
// uses a Cypress query to check if the next entry (different from undefined) is `123`
// in combination with `should` it tries to call `callLine.next` until it is not undefined
cy.callLineNext().should("eq", 123);
```

## cy.callLineReset

```ts
callLineReset(): void;
```

Resets the counter and starts from the first entry on the next call to `cy.callLineNext`.

## cy.callLineToFile

```ts
callLineToFile(
    outputDir: string,
    options?: CallLineToFileOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
): Chainable<null>;
```

_References:_
- [CallLineToFileOptions](#CallLineToFileOptions)

Save CallLine entries to a file. Arguments passed to `lineCalled` are stored as arrays.

### Example

```ts
// Save all call line entries to a file
cy.callLineToFile("_callLine");

// Save only entries where the first argument is "abc", with pretty output
cy.callLineToFile("_callLine", {
    filter: (entry) => entry.args[0] === "abc",
    prettyOutput: true
});
```

## The main functions intended to be used on the front-end

## lineCalled

```ts
/**
 * @param args Anything that you want to store
 */
lineCalled(...args: unknown[]): void;
```

This function is intended to be used in the application code to store any information that you want to store and read in Cypress tests.

If the call line is not enabled, it does nothing. [Enable it](#cycalllineenable) in Cypress tests in `beforeEach` hook.

## lineCalledWithClone

```ts
lineCalledWithClone(...args: unknown[]): void;
```

This function is the same as [`lineCalled`](#linecalled) but it clones the arguments before storing them.

# Interfaces

## CallLineToFileOptions

```ts
interface CallLineToFileOptions {
    /**
     * The name of the file. If `undefined`, it will be generated from the running test.
     */
    fileName?: string;

    /**
     * Filter the entries to save
     */
    filter?: (callLine: CallLineStack) => boolean;

    /**
     * When set to `true`, the output JSON will be formatted with tabs
     */
    prettyOutput?: boolean;
}
```

# Other commands

## cy.startTiming

```ts
/**
 * @returns The value of `performance.now()` at the time the command is executed.
 */
startTiming: () => Chainable<number>;
```

Start the time measurement (a helper function).

### Example

```ts
cy.startTiming();
```

## cy.stopTiming

```ts
/**
 * @returns If `cy.startTiming` was called, it returns the time difference since startTiming was
 * called (in ms); otherwise, it returns `undefined`.
 */
stopTiming: () => Chainable<number | undefined>;
```

Stop the time measurement (a helper function).

### Example

```ts
cy.startTiming();
// do some action
cy.stopTiming().then((duration) => {
    /**
     * here you have the duration since `cy.startTiming` has been called. You
     * can generate reports or put some warning, etc.
     */
});
```