import { ResourceType, RouteMatcherOptions, StringMatcher } from "cypress/types/net-stubbing";

import { waitTill } from "./wait";

declare global {
    namespace Cypress {
        interface Chainable {
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
             * @returns If cy.startTiming was been called, returns the time difference
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
        }
    }
}

type CommonObject<T> = {
    [K in keyof T]?: T[K];
};

export interface CallStack {
    /**
     * Cross domain requests will have this property set to true
     */
    crossDomain: boolean;
    /**
     * A throttle delay of the request set by calling `throttleRequest` or `cy.throttleInterceptorRequest`
     */
    delay?: number;
    /**
     * The real total duration of the request in ms (not including delay)
     */
    duration?: number;
    /**
     * true if the request is still in progress
     */
    isPending: boolean;
    /**
     * Resource type
     */
    resourceType: ResourceType;
    /**
     * Request info
     */
    request: IRequest;
    /**
     * Response info
     */
    response?: IResponse;
    /**
     * URL of the request without query string
     */
    url: string;
    /**
     * The full URL of the request with query string
     */
    urlQuery: string;
}

export type RequestMethod =
    | "CONNECT"
    | "DELETE"
    | "GET"
    | "HEAD"
    | "OPTIONS"
    | "PATCH"
    | "POST"
    | "PUT"
    | "TRACE";

export interface InterceptorOptions {
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
     * Which resource types should be processed, default: ["document", "fetch", "script", "xhr", "websocket"],
     *
     * Provide "all" for processing all requests no matter to the resource type
     */
    resourceTypes?: ResourceType | ResourceType[] | "all";
}

export interface IDebug {
    /**
     * An id for the queued item. Important to track down the sequence of the same requests
     */
    queueId: number;
    /**
     * Request method (GET, POST, ...)
     */
    method: string;
    /**
     * Resource type
     */
    resourceType?: string;
    /**
     * Time when this entry is created
     */
    time: Date;
    /**
     * Type of the entry, sort by the sequence:
     *
     * start        = the very beggining of the request
     * skipped      = the request is skipped and will not be processed due to
     *                not matching the resource types or cross domain option
     * skipped-done = the skipped request is finished
     * logged       = the request is logged and will be processed
     * logged-done  = the logged request is finished
     */
    type: "logged" | "logged-done" | "skipped" | "skipped-done" | "start";
    /**
     * A full URL of the request with query string
     */
    url: string;
}

export type IHeaders = { [key: string]: string | string[] };
export type IHeadersNormalized = { [key: string]: string };

export interface IMockResponse {
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

export interface IMockResponseOptions {
    /**
     * How many times the response should be mocked, by default it is set to 1.
     * Set to 0 to mock the response infinitely
     */
    times?: number;
}

export interface IRequest {
    /**
     * The request body, it can be anything
     */
    body: unknown;
    /**
     * The request headers
     */
    headers: IHeaders;
    /**
     * Request method (GET, POST, ...)
     */
    method: string;
    /**
     * URL query string as object
     */
    query: Record<string, string | number>;
    /**
     * Time when the request started
     */
    timeStart: Date;
}

export interface IResponse {
    /**
     * The response body, it can be anything (replaced by mock if provided)
     */
    body: unknown;
    /**
     * The origin response body (not including mock)
     */
    body_origin: unknown;
    /**
     * Headers of the response (with mock if provided)
     */
    headers: IHeadersNormalized;
    /**
     * The response status code (replaced by mock if provided)
     */
    statusCode: number;
    /**
     * The origin response status code (not including mock)
     */
    statusCode_origin: number;
    /**
     * The HTTP status message
     */
    statusMessage: string;
    /**
     * Time when the request ended (it does not include a delay when the request
     * is throttled, it contains the real time when the request finished in cy.intercept)
     */
    timeEnd: Date;
}

/**
 * String comparison is case insensitive. Provide RegExp without case sensitive flag if needed.
 */
export type IRouteMatcher = StringMatcher | IRouteMatcherObject;

export type IRouteMatcherObject = {
    /**
     * A matcher for request body
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

export interface IThrottleRequestOptions {
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

export interface WaitUntilRequestOptions extends IRouteMatcherObject {
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

const DEFAULT_INTERVAL = 500;
const DEFAULT_RESOURCE_TYPES: ResourceType[] = ["document", "fetch", "script", "xhr", "websocket"];
const DEFAULT_TIMEOUT = 10000;

const defaultOptions: Required<InterceptorOptions> = {
    disableCache: undefined!,
    debug: false,
    ingoreCrossDomain: true,
    resourceTypes: DEFAULT_RESOURCE_TYPES
};

export class Interceptor {
    private _callStack: CallStack[] = [];
    private _disableCacheByEnv = false;
    private _debugByEnv = false;
    private _debugInfo: IDebug[] = [];
    private _mock: {
        id: number;
        mock: IMockResponse;
        options?: IMockResponseOptions;
        routeMatcher: IRouteMatcher;
    }[] = [];
    private _mockId = 0;
    private _options: Required<InterceptorOptions> = {
        ...defaultOptions
    };
    private _skip = 0;
    private _throttle: {
        delay: number;
        id: number;
        options?: IThrottleRequestOptions;
        routeMatcher: IRouteMatcher;
    }[] = [];
    private _throttleId = 0;

    constructor() {
        this._disableCacheByEnv = !!Cypress.env("INTERCEPTOR_DISABLE_CACHE");
        this._debugByEnv = !!Cypress.env("INTERCEPTOR_DEBUG");

        let queueCounter = 0;

        cy.intercept("**", (req) => {
            const queueId = ++queueCounter;
            const crossDomain = req.headers["host"] !== document.location.host;

            if (this.debugIsEnabled) {
                this._debugInfo.push({
                    queueId,
                    method: req.method,
                    resourceType: req.resourceType,
                    time: new Date(),
                    type: "start",
                    url: req.url
                });
            }

            if (
                !req.resourceType ||
                (Array.isArray(this._options.resourceTypes)
                    ? !this._options.resourceTypes.includes(req.resourceType)
                    : this._options.resourceTypes !== "all" &&
                      this._options.resourceTypes !== req.resourceType) ||
                (this._options.ingoreCrossDomain && crossDomain)
            ) {
                if (this.debugIsEnabled) {
                    this._debugInfo.push({
                        queueId,
                        method: req.method,
                        resourceType: req.resourceType,
                        time: new Date(),
                        type: "skipped",
                        url: req.url
                    });
                }

                req.continue((res) => {
                    if (this.debugIsEnabled) {
                        this._debugInfo.push({
                            queueId,
                            method: req.method,
                            resourceType: req.resourceType,
                            time: new Date(),
                            type: "skipped-done",
                            url: req.url
                        });
                    }
                    this.disableCacheInResponse(res.headers);
                    res.send();
                });

                return;
            }

            const startTime = performance.now();

            if (this.debugIsEnabled) {
                this._debugInfo.push({
                    queueId,
                    method: req.method,
                    resourceType: req.resourceType,
                    time: new Date(),
                    type: "logged",
                    url: req.url
                });
            }

            const item: CallStack = {
                crossDomain,
                isPending: true,
                request: {
                    body: req.body,
                    headers: req.headers,
                    method: req.method,
                    query: req.query,
                    timeStart: new Date()
                },
                resourceType: req.resourceType,
                url: req.url.replace(/\?(.*)/, ""),
                urlQuery: req.url
            };

            this._callStack.push(item);

            return req.continue((res) => {
                if (this.debugIsEnabled) {
                    this._debugInfo.push({
                        queueId,
                        method: req.method,
                        resourceType: req.resourceType,
                        time: new Date(),
                        type: "logged-done",
                        url: req.url
                    });
                }

                item.duration = performance.now() - startTime;

                const _mock = this.getMock(item);
                const throttle = this.getThrottle(item);

                const mock = _mock ?? throttle.mockResponse;

                const body = mock?.generateBody?.(res.body) ?? mock?.body ?? res.body;

                const headers = {
                    ...this.normalizeHeaders(res.headers),
                    ...mock?.headers
                };

                const statusCode = mock?.statusCode ?? res.statusCode;

                item.response = {
                    body,
                    body_origin: res.body,
                    headers,
                    statusCode,
                    statusCode_origin: res.statusCode,
                    statusMessage: res.statusMessage,
                    timeEnd: new Date()
                };

                item.delay = throttle?.delay;

                if (item.delay) {
                    res.setDelay(item.delay);
                }

                this.disableCacheInResponse(headers);
                res.send(statusCode, body, headers);

                /**
                 * Set the request as finished with a delay. It is crucial for the browser to let the response process,
                 * it takes aprox. 40ms from here to the consumer's response function.
                 *
                 * NOTE: if you throttle the network in Chrome, it will not work because the delay/throttle is controlled
                 * by Chrome after this line. So it means that the request takes usual time, but from here to the consumer's
                 * response function it can last several seconds (depends on your throttling settings in the browser)
                 */
                setTimeout(
                    () => {
                        item.isPending = false;
                    },
                    (item.delay ?? 0) + DEFAULT_INTERVAL
                );
            });
        });
    }

    /**
     * Return a copy of all logged requests since the Interceptor has been created
     * (the Interceptor is created in `beforeEach`)
     */
    public get callStack() {
        return this.deepCopy(this._callStack);
    }

    /**
     * Returns true if debug is enabled by Interceptor options or Cypress environment
     * variable `INTERCEPTOR_DEBUG`. The Interceptor `debug` option has the highest
     * priority so if the option is undefined (by default), it returns `Cypress.env("INTERCEPTOR_DEBUG")`
     */
    public get debugIsEnabled() {
        return this._options.debug ?? this._debugByEnv;
    }

    private deepCopy<T>(value: T) {
        if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value) &&
            Object.keys(value).length
        ) {
            const copy = {} as typeof value;

            for (const key in value) {
                copy[key] = this.deepCopy(value[key]);
            }

            return copy;
        } else if (Array.isArray(value)) {
            const copy = [] as typeof value;

            for (const key in value) {
                copy[key] = this.deepCopy(value[key]);
            }

            return copy;
        } else {
            return value;
        }
    }

    private disableCacheInResponse(headers: IHeaders) {
        if (
            (this._disableCacheByEnv && this._options.disableCache !== false) ||
            this._options.disableCache
        ) {
            headers["cache-control"] = "no-store";
        }
    }

    private filterItemsByMatcher(routeMatcher?: IRouteMatcher) {
        return (item: CallStack) => {
            if (!routeMatcher) {
                return true;
            }

            if (routeMatcher instanceof RegExp || typeof routeMatcher === "string") {
                return this.testUrlMatch(routeMatcher, item.url);
            }

            let matches = 0;
            let mustMatch = 0;

            if (routeMatcher.headersMatcher) {
                mustMatch++;

                matches += routeMatcher.headersMatcher(this.normalizeHeaders(item.request.headers))
                    ? 1
                    : 0;
            }

            if (routeMatcher.bodyMatcher !== undefined) {
                mustMatch++;

                matches += routeMatcher.bodyMatcher(item.request.body) ? 1 : 0;
            }

            if (routeMatcher.crossDomain !== undefined) {
                mustMatch++;

                matches +=
                    (routeMatcher.crossDomain && item.crossDomain) ||
                    (!routeMatcher.crossDomain && !item.crossDomain)
                        ? 1
                        : 0;
            }

            if (routeMatcher.https !== undefined) {
                mustMatch++;

                matches +=
                    (routeMatcher.https && item.url.match(/^https:/i)) ||
                    (!routeMatcher.https && item.url.match(/^http:/i))
                        ? 1
                        : 0;
            }

            if (routeMatcher.method) {
                mustMatch++;

                matches += item.request.method === routeMatcher.method ? 1 : 0;
            }

            if (routeMatcher.queryMatcher !== undefined) {
                mustMatch++;

                matches += routeMatcher.queryMatcher(item.request.query) ? 1 : 0;
            }

            if (routeMatcher.resourceType && routeMatcher.resourceType !== "all") {
                mustMatch++;

                matches += (
                    Array.isArray(routeMatcher.resourceType)
                        ? routeMatcher.resourceType.includes(item.resourceType)
                        : item.resourceType === routeMatcher.resourceType
                )
                    ? 1
                    : 0;
            }

            if (routeMatcher.url) {
                mustMatch++;

                matches += this.testUrlMatch(routeMatcher.url, item.url) ? 1 : 0;
            }

            return matches === mustMatch;
        };
    }

    /**
     * Get an array with all logged/skiped calls to track down a possible issue.
     * All requests not matching the global resource types or cross domain option are skipped
     *
     * @returns An array with debug information
     */
    public getDebugInfo() {
        return this.deepCopy(this._debugInfo);
    }

    private getMock(item: CallStack) {
        const mockItem = [...this._mock]
            .reverse()
            .find((entry) => this.filterItemsByMatcher(entry.routeMatcher)(item));

        if (mockItem && (mockItem.options?.times === undefined || mockItem.options.times === 1)) {
            this._mock.splice(this._mock.indexOf(mockItem), 1);
        } else if (
            mockItem &&
            mockItem.options?.times !== undefined &&
            mockItem.options.times > 1
        ) {
            mockItem.options.times--;
        }

        return mockItem?.mock;
    }

    /**
     * Get the last call matching the provided route matcher
     *
     * @param routeMatcher A route matcher
     * @returns The last call information or undefined if none match
     */
    public getLastRequest(routeMatcher?: IRouteMatcher) {
        const items = this._callStack.filter(this.filterItemsByMatcher(routeMatcher));

        return items.length ? this.deepCopy(items[items.length - 1]) : undefined;
    }

    /**
     * Get statistics for all requests matching the provided route matcher since the beginning
     * of the current test
     *
     * @param routeMatcher A route matcher
     * @returns All requests matching the provided route matcher with detailed information,
     *          if none match, returns an empty array
     */
    public getStats(routeMatcher?: IRouteMatcher) {
        return this.deepCopy(this._callStack.filter(this.filterItemsByMatcher(routeMatcher)));
    }

    private getThrottle(item: CallStack) {
        const throttleItem = [...this._throttle]
            .reverse()
            .find((entry) => this.filterItemsByMatcher(entry.routeMatcher)(item));
        const delay = throttleItem?.delay;
        const mockResponse = throttleItem?.options?.mockResponse;

        if (
            throttleItem &&
            (throttleItem.options?.times === undefined || throttleItem.options.times === 1)
        ) {
            this._throttle.splice(this._throttle.indexOf(throttleItem), 1);
        } else if (
            throttleItem &&
            throttleItem.options?.times !== undefined &&
            throttleItem.options.times > 1
        ) {
            throttleItem.options.times--;
        }

        return { delay, mockResponse };
    }

    /**
     * Get a number of requests matching the provided route matcher
     *
     * @param routeMatcher A route matcher
     * @returns A number of requests matching the provided route matcher since the current test started
     */
    public requestCalls(routeMatcher?: IRouteMatcher) {
        return this._callStack.filter(this.filterItemsByMatcher(routeMatcher)).length;
    }

    private isThereRequestPending(routeMatcher?: IRouteMatcher, enforceCheck = true) {
        const items = this._callStack
            .slice(this._skip)
            .filter(this.filterItemsByMatcher(routeMatcher));

        // there must be at least one match, otherwise we need to wait for the request
        return enforceCheck
            ? !items.length || items.some((item) => item.isPending)
            : items.some((item) => item.isPending);
    }

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
    public mockResponse(
        routeMatcher: IRouteMatcher,
        mock: IMockResponse,
        options?: IMockResponseOptions
    ) {
        const mockEntry = { id: ++this._mockId, mock, options, routeMatcher };
        this._mock.push(mockEntry);

        return mockEntry.id;
    }

    private normalizeHeaders(headers: IHeaders): IHeadersNormalized {
        const normalized: IHeadersNormalized = {};

        for (const key in headers) {
            const entry = headers[key];
            normalized[key] = Array.isArray(entry) ? entry.join(",") : entry;
        }

        return normalized;
    }

    /**
     * Remove a mock entry by id
     *
     * @param id A unique id received from `mockResponse` or `cy.mockInterceptorResponse`
     */
    public removeMock(id: number) {
        if (this._mock.find((entry) => entry.id === id)) {
            this._mock = this._mock.filter((entry) => entry.id !== id);

            return true;
        }

        return false;
    }

    /**
     * Remove a throttle entry by id
     *
     * @param id A unique id received from `throttleRequest` or `cy.throttleInterceptorRequest`
     */
    public removeThrottle(id: number) {
        if (this._throttle.find((entry) => entry.id === id)) {
            this._throttle = this._throttle.filter((entry) => entry.id !== id);

            return true;
        }

        return false;
    }

    private removeUndefinedFromObject<T, K extends keyof T>(object: CommonObject<T>) {
        Object.keys(object).forEach(
            (key) => object[key as K] === undefined && delete object[key as K]
        );

        return object;
    }

    /**
     * Reset the watch of Interceptor. It sets the pointer to the last call. It is
     * needed to reset the pointer when you want to wait for certain requests.
     *
     * Example: on a site there are multiple requests to `api/getUser`, but we want
     * to wait for the specific one which occur after clicking on a button. We can not
     * know which one of the `api/getUser` calls we want to wait for. By calling this
     * method we set the exact point we want to check the next requests from.
     */
    public resetWatch() {
        this._skip = this._callStack.length;
    }

    /**
     * Set Interceptor options,
     * must be called befor a request/s occur
     *
     * @param options Options
     * @returns Current Interceptor options
     */
    public setOptions(options: InterceptorOptions = this._options): InterceptorOptions {
        this._options = {
            ...this._options,
            ...this.removeUndefinedFromObject(options)
        };

        return this.deepCopy(this._options);
    }

    private testUrlMatch(urlMatcher: StringMatcher, url: string) {
        if (typeof urlMatcher === "string") {
            urlMatcher = new RegExp(`^${urlMatcher.replace(/(\*)+/gi, "(.*)")}$`);
        }

        return urlMatcher.test(url);
    }

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
    public throttleRequest(
        routeMatcher: IRouteMatcher,
        delay: number,
        options?: IThrottleRequestOptions
    ) {
        const throttleEntry = { delay, id: ++this._throttleId, options, routeMatcher };
        this._throttle.push(throttleEntry);

        return throttleEntry.id;
    }

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
    public waitUntilRequestIsDone(
        stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
        errorMessage?: string
    ) {
        return this.waitUntilRequestIsDone_withWait(
            stringMatcherOrOptions,
            performance.now(),
            errorMessage
        );
    }

    private waitUntilRequestIsDone_withWait(
        stringMatcherOrOptions: StringMatcher | WaitUntilRequestOptions = {},
        startTime: number,
        errorMessage?: string
    ): Cypress.Chainable<this> {
        if (
            typeof stringMatcherOrOptions === "string" ||
            stringMatcherOrOptions instanceof RegExp ||
            typeof stringMatcherOrOptions !== "object"
        ) {
            stringMatcherOrOptions = { url: stringMatcherOrOptions };
        }

        const timeout =
            (stringMatcherOrOptions?.waitTimeout ??
                Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT") ??
                DEFAULT_TIMEOUT) -
            (performance.now() - startTime);

        return waitTill(
            () =>
                this.isThereRequestPending(
                    stringMatcherOrOptions,
                    stringMatcherOrOptions?.enforceCheck
                ),
            {
                errorMessage,
                interval: DEFAULT_INTERVAL,
                timeout
            }
        ).then(() => {
            // check out with a delay if there is an another request after the last one
            return cy
                .wait(stringMatcherOrOptions?.waitForNextRequest ?? DEFAULT_INTERVAL, {
                    log: false
                })
                .then(() =>
                    this.isThereRequestPending(
                        stringMatcherOrOptions,
                        stringMatcherOrOptions?.enforceCheck
                    )
                        ? this.waitUntilRequestIsDone_withWait(stringMatcherOrOptions, startTime)
                        : cy.wrap(this)
                );
        });
    }

    // DEBUG TOOLS

    getFileNameFromCurrentTest = (currentTest: Mocha.Test | undefined) => {
        return currentTest
            ? this.getParentNameFromCurrentTest(currentTest?.parent, currentTest.title)
            : "unknown";
    };

    getParentNameFromCurrentTest = (parent: Mocha.Suite | undefined, title: string): string => {
        title = `${parent?.title ? `${parent.title} - ` : ""}${title}`;

        if (parent?.parent) {
            return this.getParentNameFromCurrentTest(parent.parent, title);
        }

        return title;
    };

    getFilePath = (currentTest: Mocha.Test | string | undefined, outputDir: string, type: string) =>
        `${outputDir}${outputDir.endsWith("/") ? "" : "/"}${typeof currentTest === "string" ? currentTest : this.getFileNameFromCurrentTest(currentTest)}.${type}.log`;

    replacer = (_key: string, value: unknown) => (typeof value === "undefined" ? null : value);

    /**
     * Write the debug information to a file (debug must be enabled),
     * example: in `afterEach`
     *      => interceptor.writeDebugToLog(this.currentTest, "./out") => example output will be "./out/Description - It.debug.log"
     *      => interceptor.writeDebugToLog("file_name", "./out") => example output will be "./out/file_name.debug.log"
     *
     * @param currentTest Current test instance for generating a name of the file, or the name of the file
     * @param outputDir A path for the output directory
     */
    public writeDebugToLog(currentTest: Mocha.Test | string | undefined, outputDir: string) {
        cy.writeFile(
            this.getFilePath(currentTest, outputDir, "debug"),
            this.getDebugInfo()
                .map((entry) => JSON.stringify(entry, this.replacer))
                .join("\n")
        );
    }

    /**
     * Write the logged requests' information to a file,
     * example: in `afterEach`
     *      => interceptor.writeStatsToLog(this.currentTest, "./out") => example output will be "./out/Description - It.stats.log"
     *      => interceptor.writeStatsToLog("file_name", "./out") => example output will be "./out/file_name.stats.log"
     *
     * @param currentTest Current test instance for generating a name of the file, or the name of the file
     * @param outputDir A path for the output directory
     */
    public writeStatsToLog(currentTest: Mocha.Test | string | undefined, outputDir: string) {
        cy.writeFile(
            this.getFilePath(currentTest, outputDir, "stats"),
            this._callStack.map((entry) => JSON.stringify(entry, this.replacer)).join("\n")
        );
    }
}
