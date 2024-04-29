import { ResourceType, RouteMatcherOptions, StringMatcher } from "cypress/types/net-stubbing";

import { waitTill } from "./wait";

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             *
             * @param routeMatcher
             * @returns
             */
            howManyTimesHasBeenRequestCalled: (routeMatcher?: IRouteMatcher) => Chainable<number>;
            /**
             *
             * @returns
             */
            interceptor: () => Chainable<Interceptor>;
            /**
             *
             * @param routeMatcher
             * @returns
             */
            interceptorLastRequest: (
                routeMatcher?: IRouteMatcher
            ) => Chainable<CallStack | undefined>;
            /**
             *
             * @param routeMatcher
             * @returns
             */
            interceptorStats: (routeMatcher?: IRouteMatcher) => Chainable<CallStack[]>;
            /**
             *
             * @param urlMatcher
             * @param mock
             * @param options
             */
            mockResponse(
                urlMatcher: IRouteMatcher,
                mock: IMockResponse,
                options?: IMockResponseOptions
            ): Chainable<number>;
            /**
             *
             * @returns
             */
            resetInterceptorWatch: () => void;
            /**
             *
             * @param options
             * @returns
             */
            setInterceptorOptions: (options: InterceptorOptions) => void;
            /**
             * Start time measuring
             *
             * @returns Time when the code was executed in ms
             */
            startTiming: () => Chainable<number>;
            /**
             * Stop time measuring
             *
             * @returns If cy.startTiming has been called, it returns the time difference
             * since startTiming call to this point in ms, otherwise it returns undefined
             */
            stopTiming: () => Chainable<number | undefined>;
            /**
             *
             * @param urlMatcher
             * @param delay
             * @param options
             */
            throttleRequest(
                urlMatcher: IRouteMatcher,
                delay: number,
                options?: IThrottleRequestOptions
            ): Chainable<number>;
            /**
             *
             * @param routeMatcher
             * @returns
             */
            waitUntilRequestIsDone: (
                routeMatcher?: StringMatcher | WaitUntilRequestOptions,
                errorTitle?: string
            ) => Chainable<Interceptor>;
        }
    }
}

type CommonObject<T> = {
    [K in keyof T]?: T[K];
};

export interface CallStack {
    /**
     * If the request is cross domain, it will be true
     */
    crossDomain: boolean;
    /**
     * A delay of the request
     */
    delay?: number;
    /**
     * Total duration of the request in ms
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
     * URL of the request
     */
    url: string;
    /**
     * URL of the request with query string
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
     * By default the web browser is caching the requests. The caching can be disabled by Cypress.env
     * `INTERCEPTOR_DISABLE_CACHE` or by this option. This option has the highest priority, if it is
     * set to false, the cache is always enabled
     */
    disableCache?: boolean;
    /**
     * When it is true, calling `getDebugInfo()` will return an array with all requests and their info
     */
    debug?: boolean;
    /**
     * Ignore request outside this domain, default: true
     */
    ingoreCrossDomain?: boolean;
    /**
     * Which resource types should be included, default: ['document', 'fetch', 'script', 'xhr', 'websocket']
     */
    resourceTypes?: ResourceType | ResourceType[] | "all";
}

export interface IDebug {
    queueId: number;
    method: string;
    resourceType?: string;
    time: Date;
    type: "logged" | "logged-done" | "skipped" | "skipped-done" | "start";
    url: string;
}

export type IHeaders = { [key: string]: string | string[] };
export type IHeadersSimple = { [key: string]: string };

export interface IMockResponse {
    /**
     * A response body, it can be anything
     */
    body?: unknown;
    /**
     * The headers of the HTTP message.
     */
    headers?: IHeadersSimple;
    /**
     * Response status code
     */
    statusCode?: number;
}

export interface IMockResponseOptions {
    /**
     * How many times the response should be mocked, by default it is set to 1, set to 0 to
     * mock the response infinitely
     */
    times?: number;
}

export interface IRequest {
    /**
     * Request body, it can be anything, object or text
     */
    body: unknown;
    /**
     * The headers of the request
     */
    headers: IHeaders;
    /**
     * Request HTTP method (GET, POST, ...).
     */
    method: string;
    /**
     * URL query string as object
     */
    query: Record<string, string | number>;
    /**
     * When the request started
     */
    timeStart: Date;
}

export interface IResponse {
    /**
     * Response body, it can be anything, object or text
     */
    body: unknown;
    /**
     * The headers of the response.
     */
    headers: IHeadersSimple;
    /**
     * The HTTP status code of the response.
     */
    statusCode: number;
    /**
     * The HTTP status message.
     */
    statusMessage: string;
    /**
     * When the request ended (it not includes when the request is throttled, it contains real time of the request)
     */
    timeEnd: Date;
}

/**
 * String comparison is case insensitive.
 * Keys of `headers` and `query` are case sensitive to compare
 */
export type IRouteMatcher = StringMatcher | IRouteMatcherObject;

export type IRouteMatcherObject = {
    /**
     *
     * @param body
     * @returns
     */
    bodyMatcher?: (body: unknown) => boolean;
    /**
     * If true, only cross domain requests match
     */
    crossDomain?: boolean;
    /**
     * All keys in headers must be in the headers of the request,
     * but the request headers can contain extra keys
     */
    headers?: RouteMatcherOptions["headers"];
    /**
     * If true, only HTTPS requests match
     */
    https?: RouteMatcherOptions["https"];
    /**
     * Request method (GET, POST, ...)
     */
    method?: RequestMethod;
    /**
     * All keys in the query must be in the URL search params, but
     * the URL search params can contain extra keys
     */
    query?: RouteMatcherOptions["query"];
    /**
     * When true, the URL search params must fully match the query
     */
    queryStrictMatch?: boolean;
    /**
     * Resource type (document, script, fetch, ....)
     */
    resourceType?: ResourceType | ResourceType[];
    /**
     * URL matcher, use * or ** to match any word in string (**\/api/call, **\/script.js, ...),
     * the matcher can be string or RegExp
     */
    url?: RouteMatcherOptions["url"];
};

export interface IThrottleRequestOptions {
    /**
     * Possibility to mock the response
     */
    mockResponse?: IMockResponse;
    /**
     * How many times the request should be throttled, by default it is set to 1, set to 0 to
     * throttle a request/requests infinitely
     */
    times?: number;
}

export interface WaitUntilRequestOptions extends IRouteMatcherObject {
    /**
     * If true, the matcher must be logged. That means if you call `waitUntilRequestIsDone(url)`,
     * the url must be logged by Tnterceptor, otherwise it will wait until the url is logged and finished
     * or it fails if waiting time runs out
     */
    enforceCheck?: boolean;
    /**
     * Time to wait in ms. Default set to DEFAULT_INTERVAL
     *
     * There is needed to wait if there is an another request after the last one (because of the JS code
     * and subsequent requests).
     */
    waitBetweenRequests?: number;
    /**
     * Time of for how long the Cypress will be waiting for pending requests,
     * default is environment variable `INTERCEPTOR_REQUEST_TIMEOUT`
     */
    waitTimeout?: number;
}

const DEFAULT_INTERVAL = 500;

const defaultOptions: Required<InterceptorOptions> = {
    disableCache: undefined!,
    debug: false,
    ingoreCrossDomain: true,
    resourceTypes: ["document", "fetch", "script", "xhr", "websocket"]
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
        urlMatcher: IRouteMatcher;
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
        urlMatcher: IRouteMatcher;
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
                    this.disableCache(res.headers);
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

                const mock = this.getMock(item);
                const throttle = this.getThrottle(item);

                const body = throttle?.mockResponse?.body ?? mock?.body ?? res.body;
                const headers = {
                    ...this.normalizeHeaders(res.headers),
                    ...(throttle?.mockResponse?.headers ?? mock?.headers)
                };
                const statusCode =
                    throttle?.mockResponse?.statusCode ?? mock?.statusCode ?? res.statusCode;

                item.response = {
                    body,
                    headers,
                    statusCode,
                    statusMessage: res.statusMessage,
                    timeEnd: new Date()
                };

                item.delay = throttle?.delay;

                if (item.delay) {
                    res.setDelay(item.delay);
                }

                this.disableCache(headers);
                res.send(statusCode, body, headers);

                /**
                 * Set the request as finished with a delay, it is crutial for the browser to let the response process,
                 * it takes aprox. 40ms from here to the consumer's response function
                 *
                 * NOTE: if you throttle the network in Chrome, it will not work because the delay is controlled by Chrome
                 * after this line. So it means that the request takes usual time, but from here to the consumer's
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
     *
     */
    get callStack() {
        return this.deepCopy(this._callStack);
    }

    /**
     *
     */
    public get debugIsEnabled() {
        return this._options.debug || this._debugByEnv;
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

    private disableCache(headers: IHeaders) {
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

            const headers = routeMatcher.headers;

            if (headers) {
                mustMatch++;

                matches += Object.keys(headers).every(
                    (key) =>
                        key in item.request.headers && item.request.headers[key] === headers[key]
                )
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

            const query = routeMatcher.query;

            if (query) {
                mustMatch++;

                matches += Object.keys(query).every(
                    (key) => key in item.request.query && item.request.query[key] === query[key]
                )
                    ? routeMatcher.queryStrictMatch
                        ? Object.keys(item.request.query).every(
                              (key) => key in query && item.request.query[key] === query[key]
                          )
                            ? 1
                            : 0
                        : 1
                    : 0;
            }

            if (routeMatcher.resourceType) {
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
     *
     * @returns
     */
    public getDebugInfo() {
        return this.deepCopy(this._debugInfo);
    }

    private getMock(item: CallStack) {
        const mockItem = [...this._mock]
            .reverse()
            .find((entry) => this.filterItemsByMatcher(entry.urlMatcher)(item));

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
     *
     * @param routeMatcher
     * @returns
     */
    public getLastRequest(routeMatcher?: IRouteMatcher) {
        const items = this._callStack.filter(this.filterItemsByMatcher(routeMatcher));

        return items.length ? this.deepCopy(items[items.length - 1]) : undefined;
    }

    /**
     *
     * @param routeMatcher
     * @returns
     */
    public getStats(routeMatcher?: IRouteMatcher) {
        return this.deepCopy(this._callStack.filter(this.filterItemsByMatcher(routeMatcher)));
    }

    private getThrottle(item: CallStack) {
        const throttleItem = [...this._throttle]
            .reverse()
            .find((entry) => this.filterItemsByMatcher(entry.urlMatcher)(item));
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
     * Return a number of how many times has been a request/requests called
     *
     * @param routeMatcher A route matcher
     * @returns number of calls since the test case started
     */
    public howManyTimesHasBeenRequestCalled(routeMatcher?: IRouteMatcher) {
        return this._callStack.filter(this.filterItemsByMatcher(routeMatcher)).length;
    }

    private isThereRequestPending(routeMatcher?: IRouteMatcher, enforceCheck = false) {
        const items = this._callStack
            .slice(this._skip)
            .filter(this.filterItemsByMatcher(routeMatcher));

        // there must be at least one match, otherwise we need to wait for the request
        return enforceCheck
            ? !items.length || items.some((item) => item.isPending)
            : items.some((item) => item.isPending);
    }

    /**
     * Mock a request response
     *
     * @param urlMatcher URL matcher
     * @param mock Mocked response
     * @returns A unique id needed when want to remove the mock manually
     */
    public mockResponse(
        urlMatcher: IRouteMatcher,
        mock: IMockResponse,
        options?: IMockResponseOptions
    ) {
        const mockEntry = { id: ++this._mockId, mock, options, urlMatcher };
        this._mock.push(mockEntry);

        return mockEntry.id;
    }

    private normalizeHeaders(headers: IHeaders): IHeadersSimple {
        const normalized: IHeadersSimple = {};

        for (const key in headers) {
            const entry = headers[key];
            normalized[key] = Array.isArray(entry) ? entry.join(",") : entry;
        }

        return normalized;
    }

    /**
     * Remove a mock entry by id
     *
     * @param id A unique id received from `mockRequest` method
     */
    public removeMock(id: number) {
        this._mock = this._mock.filter((entry) => entry.id !== id);
    }

    /**
     * Remove a throttle entry by id
     *
     * @param id A unique id received from `throttleRequest` method
     */
    public removeThrottle(id: number) {
        this._throttle = this._throttle.filter((entry) => entry.id !== id);
    }

    private removeUndefinedFromObject<T, K extends keyof T>(object: CommonObject<T>) {
        Object.keys(object).forEach(
            (key) => object[key as K] === undefined && delete object[key as K]
        );

        return object;
    }

    /**
     * Must be called before an action triggering a request if we want to wait for it,
     *
     * for example: on a site there are multiple requests to `api/getUser`, but we want to wait
     * for the specific one which occur after clicking on some button. Therefore we can not know
     * which one of the `api/getUser` calls we want to wait for. By calling this method we set the
     * exact point we want to check the next requests from.
     */
    public resetWatch() {
        this._skip = this._callStack.length;
    }

    /**
     * Must be called before a request occur
     *
     * @param options Options, if undefined, the default options is set
     */
    public setOptions(options: InterceptorOptions = defaultOptions) {
        this._options = {
            ...this._options,
            ...this.removeUndefinedFromObject(options)
        };
    }

    private testUrlMatch(urlMatcher: StringMatcher, url: string) {
        if (typeof urlMatcher === "string") {
            urlMatcher = new RegExp(`^${urlMatcher.replace(/(\*)+/gi, "(.*)")}$`);
        }

        return urlMatcher.test(url);
    }

    /**
     * Throttle a request. By default is the request throttled only once,
     * the next request is not throttled. More in options
     *
     * @param urlMatcher URL matcher
     * @param delay A delay in ms
     * @param options Throttle options
     * @returns A unique id needed when want to remove the throttle manually
     */
    public throttleRequest(
        urlMatcher: IRouteMatcher,
        delay: number,
        options?: IThrottleRequestOptions
    ) {
        const throttleEntry = { delay, id: ++this._throttleId, options, urlMatcher };
        this._throttle.push(throttleEntry);

        return throttleEntry.id;
    }

    /**
     * Wait until a request/requests are finished
     *
     * @param matcherOrOptions A Matcher or wait options
     * @param errorTitle A title when the wait fails
     * @returns This interceptor instance
     */
    public waitUntilRequestIsDone(
        matcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
        errorTitle?: string
    ) {
        return this.waitUntilRequestIsDone_withWait(
            matcherOrOptions,
            performance.now(),
            errorTitle
        );
    }

    private waitUntilRequestIsDone_withWait(
        matcherOrOptions: StringMatcher | WaitUntilRequestOptions = {},
        startTime: number,
        errorTitle?: string
    ): Cypress.Chainable<this> {
        if (
            typeof matcherOrOptions === "string" ||
            matcherOrOptions instanceof RegExp ||
            typeof matcherOrOptions !== "object"
        ) {
            matcherOrOptions = { url: matcherOrOptions };
        }

        const timeout =
            (matcherOrOptions?.waitTimeout ?? Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT") ?? 0) -
            (performance.now() - startTime);

        return waitTill(
            () => this.isThereRequestPending(matcherOrOptions, matcherOrOptions?.enforceCheck),
            {
                errorTitle,
                interval: DEFAULT_INTERVAL,
                timeout
            }
        ).then(() => {
            // check out if there is an another request after the last one with a delay
            return cy
                .wait(matcherOrOptions?.waitBetweenRequests ?? DEFAULT_INTERVAL, { log: false })
                .then(() =>
                    this.isThereRequestPending(matcherOrOptions, matcherOrOptions?.enforceCheck)
                        ? this.waitUntilRequestIsDone_withWait(matcherOrOptions, startTime)
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
     * interceptor.writeDebugToLog(this.currentTest, "./debug")
     *
     * @param currentTest
     * @param outputDir
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
     *
     * @param currentTest
     * @param outputDir
     */
    public writeStatsToLog(currentTest: Mocha.Test | string | undefined, outputDir: string) {
        cy.writeFile(
            this.getFilePath(currentTest, outputDir, "stats"),
            this._callStack.map((entry) => JSON.stringify(entry, this.replacer)).join("\n")
        );
    }
}
