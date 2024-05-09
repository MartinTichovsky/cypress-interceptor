[![NPM](https://img.shields.io/npm/v/cypress-interceptor.svg)](https://www.npmjs.com/package/cypress-interceptor)
[![Build Status](https://github.com/MartinTichovsky/cypress-interceptor/workflows/CI/badge.svg)](https://github.com/MartinTichovsky/cypress-interceptor/actions?workflow=CI)
[![Coverage Status](https://coveralls.io/repos/github/MartinTichovsky/cypress-interceptor/badge.svg?branch=main)](https://coveralls.io/github/MartinTichovsky/cypress-interceptor?branch=main)

# Cypress Interceptor

### About

Cypress Interceptor is a global substitute for `cy.intercept`. It is a crucial helper for your tests based on HTTP/HTTPS requests. The main reason why this package was created is the function `waitUntilRequestIsDone`. This function waits until one or more requests are finished using the provided arguments. More information below.

## Getting started

It is very simple, just install the package using `yarn` or `npm` and import the package in your `cypress/support/e2e.js` or `cypress/support/e2e.ts`:

```js
import "cypress-interceptor";
```

## Interceptor Cypress commands

```ts
/**
 * Get an instance of Interceptor
 *
 * @returns An instance of Interceptor
 */
interceptor: () => Chainable<Interceptor>;
/**
 * Get the last call matching the provided route matcher
 *
 * @param routeMatcher A route matcher
 * @returns The last call information or undefined if none match
 */
interceptorLastRequest: (
    routeMatcher?: IRouteMatcher
) => Chainable<CallStack | undefined>;
/**
 * Set Interceptor options,
 * must be called before a request/s occur
 *
 * @param options Options
 * @returns Current Interceptor options
 */
interceptorOptions: (options?: InterceptorOptions) => Chainable<InterceptorOptions>;
/**
 * Get a number of requests matching the provided route matcher
 *
 * @param routeMatcher A route matcher
 * @returns A number of requests matching the provided route matcher since the current test started
 */
interceptorRequestCalls: (routeMatcher?: IRouteMatcher) => Chainable<number>;
/**
 * Get statistics for all requests matching the provided route matcher since the beginning
 * of the current test
 *
 * @param routeMatcher A route matcher
 * @returns All requests matching the provided route matcher with detailed information,
 *          if none match, returns an empty array
 */
interceptorStats: (routeMatcher?: IRouteMatcher) => Chainable<CallStack[]>;
/**
 * Mock the response of requests matching the provided route matcher. By default it mocks
 * the first matching request, then the mock is removed. Set `times` in options
 * to change how many times should be the matching requests mocked.
 *
 * @param routeMatcher A route matcher
 * @param mock Response mocks
 * @param options Mock options
 * @returns An id of the created mock. It is needed if you want to remove
 *          the mock manually
 */
mockInterceptorResponse(
    routeMatcher: IRouteMatcher,
    mock: IMockResponse,
    options?: IMockResponseOptions
): Chainable<number>;
/**
 * Reset the watch of Interceptor. It sets the pointer to the last call. It is
 * needed to reset the pointer when you want to wait for certain requests.
 *
 * Example: on a site there are multiple requests to `api/getUser`, but we want
 * to wait for the specific one which occur after clicking on a button. We can not
 * know which one of the `api/getUser` calls we want to wait for. By calling this
 * method we set the exact point we want to check the next requests from.
 */
resetInterceptorWatch: () => void;
/**
 * Start time measuring (a helper function)
 *
 * @returns performance.now() when the code is executed
 */
startTiming: () => Chainable<number>;
/**
 * Stop time measuring (a helper function)
 *
 * @returns If cy.startTiming was called, returns the time difference
 *          since startTiming was called (in ms), otherwise it returns undefined
 */
stopTiming: () => Chainable<number | undefined>;
/**
 * Throttle requests matching the provided route matcher by setting a delay. By default it
 * throttles the first matching request, then the throttle is removed. Set `times`
 * in options to change how many times should be the matching requests throttled.
 *
 * @param urlMatcher A route matcher
 * @param delay A delay in ms
 * @param options Throttle options (it can include mocking the response)
 * @returns An id of the created throttle. It is needed if you want to remove
 *          the throttle manually
 */
throttleInterceptorRequest(
    routeMatcher: IRouteMatcher,
    delay: number,
    options?: IThrottleRequestOptions
): Chainable<number>;
/**
 * The method will wait until all requests matching the provided route
 * matcher finish or the maximum time of waiting is reached (`waitTimeout` in options).
 *
 * By default there must be at least one match. Otherwise it waits until
 * there is a request matching the provided route matcher OR the maximum time of waiting
 * is reached. This behaviour can be changed by setting `enforceCheck` to false in options.
 *
 * @param stringMatcherOrOptions A string matcher OR options with a route matcher
 * @param errorMessage An error message when the maximum time of waiting is reached
 * @returns An instance of Interceptor
 */
waitUntilRequestIsDone: (
    stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
    errorMessage?: string
) => Chainable<Interceptor>;
```

# Cypress environment variables

You can provide Cypress environment variables to set some Interceptor options globally:

```ts
e2e: {
    env: {
        INTERCEPTOR_DEBUG: boolean; // default false
        INTERCEPTOR_DISABLE_CACHE: boolean; // default false
        INTERCEPTOR_REQUEST_TIMEOUT: number; // default 10000
    }
}
```

__`INTERCEPTOR_DEBUG`__ - enables logging of all requests. More in [`getDebugInfo`](#getdebuginfo)

__`INTERCEPTOR_DISABLE_CACHE`__ - when set to true, all requests will contain an additional header `"cache-control": "no-store"`

__`INTERCEPTOR_REQUEST_TIMEOUT`__ - value (in ms) of how long Cypress will be waiting for pending requests

# Documentation and examples

__You should not be using `cy.intercept` together with Interceptor. Interceptor is using `cy.intercept` to catch all requests and if you rewrite the global rule, you can destroy the logic for catching requests and Interceptor may not work.__

By default only requests with resource type in ["document", "fetch", "script", "xhr"] are logged. If you want to log another types like images, CSS, etc., set `resourceTypes` of [cy.interceptorOptions](#cyinterceptoroptions).

In almost all methods is a route matcher ([`IRouteMatcher`](#iroutematcher)) which can be string or RegExp ([`StringMatcher`](#stringmatcher)) or an object with multiple matching options. For more information about matching options explore [`IRouteMatcherObject`](#iroutematcherobject). 

## __!IMPORTANT ABOUT CACHING!__

By default all web requests have set some caching options (depends on the server). That means when you run Cypress tests, it starts the browser fresh without any caches. And when you will be running your tests, some of the requests (like CSS, JavaScript, images, etc.) will be cached during Cypress run (even though Cypress claims to clear everything before each test, these remains in the web browser until the next run). The very important thing is that when a request is cached, it will never hit `cy.intercept` and will be never catched by Interceptor. Therefore if you are waiting in your first test for JavaScript to load - it is ok. But in your second test the request will never happen.

Example:

```ts
it("First test", () => {
    cy.visit("https://my-page.org");

    cy.waitUntilRequestIsDone("https://my-page.org/source/my-script.js");

    // will pass
})

it("Second test", () => {
    cy.visit("https://my-page.org");

    cy.waitUntilRequestIsDone("https://my-page.org/source/my-script.js");

    // will fail because https://my-page.org/source/my-script.js has been cached in the first test
    // and now it never hits cy.intercept which is Interceptor using to catch and process all requests
})
```

## Recommendation for caching

You can disable cache by setting Cypress environment variable `INTERCEPTOR_DISABLE_CACHE` to true, or by `cy.interceptorOptions({ disableCache: true }}`. 

__MY PERSONAL RECOMMENDATION IS TO LEAVE THE CACHE ENABLED and work with fetch/XHR requests only. If you want to wait for JavaScript to be loaded, you can use `enforceCheck` option like this:__

```ts
it("Second test", () => {
    cy.visit("https://my-page.org");

    cy.waitUntilRequestIsDone({
        enforceCheck: false,
        url: "https://my-page.org/source/my-script.js"
    });
})
```

If there is a request to `https://my-page.org/source/my-script.js` it waits until it finishes otherwise it continues without fail.

## cy.interceptor

```ts
interceptor: () => Chainable<Interceptor>;
```

Get an instance of Interceptor

### Example

```ts
cy.interceptor().then(interceptor => {
    interceptor.resetWatch();
    interceptor.removeMock(1);
    interceptor.removeThrottle(1);

    if (interceptor.debugIsEnabled) {
        //
    }
});
```

## cy.interceptorLastRequest

```ts
interceptorLastRequest: (routeMatcher?: IRouteMatcher) => Chainable<CallStack | undefined>;
```

Get the last call matching the provided route matcher. Similar to [`cy.interceptorStats`](#cyinterceptorstats).

### Example

```ts
// get the last fetch request
cy.interceptorLastRequest({ resourceType: "fetch" }).then((stats) => {
    // stats can be undefined
});
```

## cy.interceptorOptions

```ts
interceptorOptions: (options?: InterceptorOptions) => Chainable<InterceptorOptions>;
```

_References:_
  - [`InterceptorOptions`](#interceptoroptions)

Set Interceptor options. Best to call at the beggining of the test, in `before` or `beforeEach`. The default options are:

```ts
disableCache: undefined,
debug: false,
ingoreCrossDomain: true,
resourceTypes: ["document", "fetch", "script", "xhr"]
```

### Example

```ts
// catch and process all resource types and cross domain requests
cy.interceptorOptions({
    ingoreCrossDomain: false,
    resourceTypes: "all"
});
```

## cy.interceptorRequestCalls

```ts
interceptorRequestCalls: (routeMatcher?: IRouteMatcher) => Chainable<number>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)

Get a number of requests matching the provided route matcher.

```ts
// there should be logged only one call to a URL ending with /api/getOrder
cy.interceptorRequestCalls("**/api/getOrder").should("eq", 1);
// there should be only 4 fetch + script requests
cy.interceptorRequestCalls({ resourceType: ["fetch", "script"] }).should("eq", 4);
```

## cy.interceptorStats

```ts
interceptorStats: (routeMatcher?: IRouteMatcher) => Chainable<CallStack[]>;
```

_References:_
  - [`IRouteMatcher`](#iroutematcher)

Get statistics for all requests matching the provided route matcher since the beginning of the current test.

### Example

_Note:_ It just serves as an example, but I do not recommend testing any of it except request/response query and body - in some cases. It should basically serve for logging/debugging.

```ts
cy.interceptorStats("**/getUser").then((stats) => {
    expect(stats.length).to.eq(1);
    expect(stats[0].crossDomain).to.be.false;
    expect(stats[0].delay).to.be.undefined;
    expect(stats[0].duration).to.be.lt(1500);
    expect(stats[0].isPending).to.be.false;
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
    expect(stats[0].url.endsWith("/getUser")).to.be.true;
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

Mock the response of requests matching the provided route matcher. By default it mocks the first matching request, then the mock is removed. Set `times` in options to change how many times should be the matching requests mocked.

### Examples

```ts
// return status 400 to all fetch requests, infinitely
cy.mockInterceptorResponse(
    { resourceType: "fetch" },
    { statusCode: 400 },
    { times: 0 }
);
// return a custom body to a request ending with /api/getUser, default once
cy.mockInterceptorResponse(
    { url: "**/api/getUser" },
    { 
        body: {
            userName: "LordVoldemort"
        }
     }
);
// return a custom header to all POST requests, infinitely
cy.mockInterceptorResponse(
    { method: "POST" },
    { 
        header: {
            "custom-header": "value"
        }
     },
     { times: 0 }
);
// return a custom body to any fetch request, twice
cy.mockInterceptorResponse(
    { resourceType: "fetch" },
    { 
        generateBody: (body) => {
            if (body && "userName" in body) {
                body.userName = "LordVoldemort";
            }

            return body;
        }
     },
     { times: 2 }
);
// mock a request having query string `page` = 5, once
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
// mock a request having body and body.page, default once
cy.mockInterceptorResponse(
    {
        bodyMatcher: (body) => body && "page" in body
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

Reset the watch of Interceptor. It sets the pointer to the last call. It is needed to reset the pointer when you want to wait for certain requests.

### Example

 On a site there are multiple requests to `api/getUser`, but we want to wait for the specific one which occur after clicking on a button. We can not know which one of the `api/getUser` calls we want to wait for. By calling this method we set the exact point we want to check the next requests from.

```ts
// this page contains multiple requests to api/getUser when visit
cy.visit("https://www.my-page.org");

// reset the watch, so all the previous requests will be ignored in the next `waitUntilRequestIsDone`
cy.resetInterceptorWatch();

// this click should trigger a request to /api/getUser
cy.get("button#user-info").click();

// this method will not continue until the request to /api/getUser is finished
waitUntilRequestIsDone("**/api/getUser");
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

Throttle requests matching the provided route matcher by setting a delay. By default it throttles the first matching request, then the throttle is removed. Set `times` in options to change how many times should be the matching requests throttled.

### Example

```ts
// make the request to /api/getUser last for 5 seconds
cy.throttleInterceptorRequest("**/api/getUser", 5000);
// throttle a request which has URL query string containing key `page` = 5
cy.throttleInterceptorRequest({ queryMatcher: (query) => query?.page === 5}, 5000);
// throtlle all requests for 5 seconds
cy.throttleInterceptorRequest({ resourceType: "all" }, 5000, { times: 0 });
cy.throttleInterceptorRequest("*", 5000, { times: 0 });
// throttle a request having body and body.userName
cy.throttleInterceptorRequest({ bodyMatcher: (body) => body && "userName" in body }, 5000);
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

The method will wait until all requests matching the provided route matcher finish or the maximum time of waiting is reached (`waitTimeout` in options). By default `waitTimeout` is set to 10 seconds. This option can be set globally by Cypress environment variable [`INTERCEPTOR_REQUEST_TIMEOUT`](#cypress-environment-variables).

`waitTimeout` condition inside `waitUntilRequestIsDone`:

```ts
const DEFAULT_TIMEOUT = 10000;
const waitTimeout = option?.waitTimeout ?? Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT") ?? DEFAULT_TIMEOUT;
```

By default there must be at least one match. Otherwise it waits until there is a request matching the provided route matcher OR the maximum time of waiting is reached. This behaviour can be changed by setting `enforceCheck` to false in options.

### Examples

```ts
// will wait until all requests are finished
cy.waitUntilRequestIsDone();
// wait for requests ending with /api/getUser
cy.waitUntilRequestIsDone("**/api/getUser");
cy.waitUntilRequestIsDone(new RegExp("api\/getUser$", "i"));
// wait for requests containing /api/
cy.waitUntilRequestIsDone("**/api/**");
cy.waitUntilRequestIsDone(new RegExp("(.*)\/api\/(.*)", "i"));
// wait until this script is loaded
cy.waitUntilRequestIsDone("http://my-page.org/source/script.js");
// wait until this request is finished
cy.waitUntilRequestIsDone("http://my-page.org/api/getUser");
// providing a custom error message when maximum time of waiting is reached
cy.waitUntilRequestIsDone("http://my-page.org/api/getUser", "Request never happened");
// wait until all fetch requests are finished
cy.waitUntilRequestIsDone({ resourceType: "fetch" });
// wait until this script is loaded and if there is no such request, continue
cy.waitUntilRequestIsDone({ enforceCheck: false, url: "http://my-page.org/source/script.js" });
// wait maximum 200s for this fetch to finish
cy.waitUntilRequestIsDone({ url: "http://my-page.org/api/getUser", waitTimeout: 200000 });
// wait 2s then check out if there is an another request after this one is finished
cy.waitUntilRequestIsDone({ url: "http://my-page.org/api/getUser", waitForNextRequest: 2000 });
// wait until all cross domain requests are finished but do not fail if there is no one
cy.waitUntilRequestIsDone({ crossDomain: true, enforceCheck: false });
```

# Interceptor public methods

## callStack

```ts
get callStack();
```

Return a copy of all logged requests since the Interceptor has been created (the Interceptor is created in `beforeEach`).

## debugIsEnabled

```ts
get debugIsEnabled();
```

Returns true if debug is enabled by Interceptor options or Cypress environment variable `INTERCEPTOR_DEBUG`. The Interceptor `debug` option has the highest priority so if the option is undefined (by default), it returns `Cypress.env("INTERCEPTOR_DEBUG")`.

### Implementation

```ts
return this._options.debug ?? !!Cypress.env("INTERCEPTOR_DEBUG");
```

## getDebugInfo

```ts
getDebugInfo();
```

Get an array with all logged/skiped calls to track down a possible issue. All requests not matching the global resource types or cross domain option are skipped.

## getLastRequest

Same as [`cy.interceptorLastRequest`](#cyinterceptorlastrequest).

## getStats

Same as [`cy.interceptorStats`](#cyinterceptorstats).

## requestCalls

Same as [`cy.interceptorRequestCalls`](#cyinterceptorrequestcalls).

## mockResponse

Same as [`cy.mockInterceptorResponse`](#cymockinterceptorresponse).

## removeMock

```ts
removeMock(id: number);
```

Remove a mock entry by id.

## removeThrottle

```ts
removeThrottle(id: number);
```

Remove a throttle entry by id.

## resetWatch

Same as [`cy.resetInterceptorWatch`](#cyresetinterceptorwatch).

## setOptions

Same as [`cy.interceptorOptions`](#cyinterceptoroptions).

## throttleRequest

Same as [`cy.throttleInterceptorRequest`](#cythrottleinterceptorrequest).

## waitUntilRequestIsDone

Same as [`cy.waitUntilRequestIsDone`](#cywaituntilrequestisdone).

## writeDebugToLog

```ts
writeDebugToLog(outputDir: string, fileName?: string);
```

Write the debug information to a file (debug must be enabled). The file will contain JSON.stringify of [`getDebugInfo`](#getdebuginfo).

### Example

```ts
afterAll(() => {
    cy.interceptor().then(interceptor => {
        // example output will be "./out/test.cy.ts (Description - It).debug.log" (the name of the file `test.cy.ts (Description - It)` will be composed from the running test)
        interceptor.writeDebugToLog("./out");
        // example output will be "./out/file_name.debug.log"
        interceptor.writeDebugToLog("./out", "file_name");
    });
});
```

## writeStatsToLog

```ts
public writeStatsToLog(outputDir: string, fileName?: string);
```

Write the logged requests' information to a file. The file will contain JSON.stringify of [`callStack`](#callstack).

### Example

```ts
afterAll(() => {
    cy.interceptor().then(interceptor => {
        // example output will be "./out/test.cy.ts (Description - It).stats.json" (the name of the file `test.cy.ts (Description - It)` will be composed from the running test)
        interceptor.writeStatsToLog("./out");
        // example output will be "./out/file_name.stats.log"
        interceptor.writeStatsToLog("./out", "file_name");
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
     * By default the web browser is caching the requests. Caching can be disabled by Cypress.env
     * `INTERCEPTOR_DISABLE_CACHE` or by this option. This option has the highest priority. If it is
     * set to false, the cache is always enabled no matter to value of Cypress.env("INTERCEPTOR_DISABLE_CACHE")
     */
    disableCache?: boolean;
    /**
     * When it is true, calling `getDebugInfo()` will return an array with all catched requests
     */
    debug?: boolean;
    /**
     * Ignore request outside the domain, default: true
     */
    ingoreCrossDomain?: boolean;
    /**
     * Which resource types should be processed, default: ["document", "fetch", "script", "xhr"],
     *
     * Provide "all" for processing all requests no matter to the resource type
     */
    resourceTypes?: ResourceType | ResourceType[] | "all";
}
```

### IMockResponse

```ts
interface IMockResponse {
    /**
     * A response body, it can be anything
     */
    body?: unknown;
    /**
     * Generate a body with the original response body, this option is preferred before option `body`
     *
     * @param originalBody The original response body
     * @returns A response body, it can be anything
     */
    generateBody?: (originalBody: unknown) => unknown;
    /**
     * If provided, will be added to the original response headers
     */
    headers?: IHeadersNormalized;
    /**
     * Response status code
     */
    statusCode?: number;
}
```

### IMockResponseOptions

```ts
interface IMockResponseOptions {
    /**
     * How many times the response should be mocked, by default it is set to 1.
     * Set to 0 to mock the response infinitely
     */
    times?: number;
}
```

### IRouteMatcher

```ts
/**
 * String comparison is case insensitive. Provide RegExp without case sensitive flag if needed.
 */
type IRouteMatcher = StringMatcher | IRouteMatcherObject;
```

### IRouteMatcherObject

```ts
type IRouteMatcherObject = {
    /**
     * A matcher for the request body
     *
     * @param body The request body
     * @returns True if matches
     */
    bodyMatcher?: (body: unknown) => boolean;
    /**
     * If true, only cross domain requests match
     */
    crossDomain?: boolean;
    /**
     * A matcher for headers
     *
     * @param headers The request headers
     * @returns True if matches
     */
    headersMatcher?: (headers: IHeadersNormalized) => boolean;
    /**
     * If true, only HTTPS requests match
     */
    https?: RouteMatcherOptions["https"];
    /**
     * Request method (GET, POST, ...)
     */
    method?: RequestMethod;
    /**
     * A matcher for query string
     *
     * @param query The URL query string
     * @returns True if matches
     */
    queryMatcher?: (query: Record<string, string | number>) => boolean;
    /**
     * Resource type (document, script, fetch, ....)
     */
    resourceType?: ResourceType | ResourceType[] | "all";
    /**
     * A URL matcher, use * or ** to match any word in string ("**\/api/call", "**\/script.js", ...)
     */
    url?: StringMatcher;
};
```

### IThrottleRequestOptions

```ts
interface IThrottleRequestOptions {
    /**
     * Mock a response for the provided route matcher. If provided together with
     * `mockResponse` or `cy.mockInterceptorResponse` it has lesser priority
     */
    mockResponse?: IMockResponse;
    /**
     * How many times the request should be throttled, by default it is set to 1.
     * Set to 0 to throttle the request infinitely
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
     * True by default. If true, a request matching the provided route matcher must be logged by Interceptor,
     * otherwise it waits until the url is logged and finished or it fails if the time of waiting runs out. If
     * set to false, it checks if there is a request matching the provided route matcher. If yes, it waits until
     * the request is done. If no, it does not fail and end successfully.
     */
    enforceCheck?: boolean;
    /**
     * Time to wait in ms. Default set to 500
     *
     * There is needed to wait if there is a possible following request after the last one (because of the JS code
     * and subsequent requests)
     */
    waitForNextRequest?: number;
    /**
     * Time of how long Cypress will be waiting for the pending requests.
     * Default set to 10000 or environment variable `INTERCEPTOR_REQUEST_TIMEOUT` if set
     */
    waitTimeout?: number;
}
```