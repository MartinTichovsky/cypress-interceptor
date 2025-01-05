import { StringMatcher } from "cypress/types/net-stubbing";

import {
    CallStack,
    IMockResponse,
    IMockResponseOptions,
    InterceptorOptions,
    IRouteMatcher,
    IThrottleRequestOptions,
    OnRequestError,
    WaitUntilRequestOptions,
    WriteStatsOptions
} from "./Interceptor.types";
import { RequestProxy } from "./RequestProxy";
import {
    convertToString,
    deepCopy,
    getFilePath,
    removeUndefinedFromObject,
    replacer,
    testUrlMatch
} from "./utils";
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
            resetInterceptorWatch: VoidFunction;
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
             * matcher finish or the maximum time of waiting is reached (`timeout` in options).
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

const DEFAULT_INTERVAL = 500;
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_WAIT_FOR_NEXT_REQUEST = 750;

const defaultOptions: Required<InterceptorOptions> = {
    ingoreCrossDomain: false
};

const parseResponseHeaders = (headersString: string) => {
    const headers: Record<string, string> = {};

    const headerLines = headersString.trim().split(/[\r\n]+/);

    headerLines.forEach((line) => {
        const [key, value] = line.split(": ", 2);
        if (key && value !== undefined) {
            headers[key.toLowerCase()] = value;
        }
    });

    return headers;
};

const wait = async (timeout: number) => new Promise((executor) => setTimeout(executor, timeout));

export class Interceptor {
    private _callStack: CallStack[] = [];
    private _mock: {
        id: number;
        mock: IMockResponse;
        options?: IMockResponseOptions;
        routeMatcher: IRouteMatcher;
    }[] = [];
    private _mockId = 0;
    private _onRequestError: OnRequestError | undefined;
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

    constructor(requestProxy: RequestProxy) {
        requestProxy.onCreate = () => {
            for (const request of this._callStack) {
                if (
                    request.isPending &&
                    (request.resourceType === "fetch" || request.resourceType === "xhr")
                ) {
                    request.isPending = false;
                    request.requestError = "Cancelled: window reloaded during the request";
                }
            }
        };

        requestProxy.requestProxyFunction = async (request, win, resourceType) => {
            const crossDomain = request.url.host !== document.location.host;
            const ignoreItem = this._options.ingoreCrossDomain && crossDomain;
            const query = Object.fromEntries(request.url.searchParams);

            const item: CallStack = {
                crossDomain,
                isPending: !ignoreItem,
                request: {
                    body: await convertToString(request.body, win),
                    headers: deepCopy(request.headers),
                    method: request.method,
                    query: deepCopy(query)
                },
                resourceType,
                timeStart: new Date(),
                url: request.url
            };

            this._callStack.push(item);

            const throttle = ignoreItem ? undefined : this.getThrottle(item);
            const mock = ignoreItem ? undefined : (this.getMock(item) ?? throttle?.mockResponse);
            const startTime = performance.now();

            item.delay = throttle?.delay;

            const onRequestDone = async (response: XMLHttpRequest | Response, isMock = false) => {
                try {
                    item.duration = performance.now() - startTime;

                    let body = "";

                    // store the response body for possible logging
                    if ("clone" in response) {
                        const responseClone = response.clone();

                        try {
                            body = await responseClone.text();
                        } catch {
                            //
                        }
                    } else if ("responseText" in response) {
                        body =
                            response.responseType === "json"
                                ? JSON.stringify(response.response)
                                : response.responseText;
                    }

                    item.response = {
                        body,
                        headers: Object.fromEntries(
                            new Headers(
                                response instanceof win.XMLHttpRequest
                                    ? parseResponseHeaders(response.getAllResponseHeaders())
                                    : (response.headers as HeadersInit)
                            ).entries()
                        ),
                        isMock,
                        statusCode: response.status,
                        statusText: response.statusText,
                        timeEnd: new Date()
                    };
                } catch (e) {
                    console.error(e);
                }
            };

            return {
                done: (response, resolve, isMock) => {
                    // to avoid multiple calls when using different response catch methods (in XMLHttpRequest)
                    void (async () => {
                        if (item.response === undefined) {
                            await onRequestDone(response, isMock);
                        }

                        if (throttle?.delay) {
                            await wait(throttle.delay);
                        }

                        resolve();

                        // set isPending with a delay to let JavaScript finish processing the reponse
                        setTimeout(() => {
                            item.isPending = false;
                        }, 100);
                    })();
                },
                error: (error) => {
                    item.isPending = false;
                    item.requestError = error;

                    if (this._onRequestError) {
                        this._onRequestError(request, error);
                    }
                },
                mock
            };
        };
    }

    get debugByEnv() {
        return !!Cypress.env("INTERCEPTOR_DEBUG");
    }

    get requestTimeoutByEnv() {
        return Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");
    }

    /**
     * Return a copy of all logged requests since the Interceptor has been created
     * (the Interceptor is created in `beforeEach`)
     */
    public get callStack() {
        return deepCopy(this._callStack);
    }

    private filterItemsByMatcher(routeMatcher?: IRouteMatcher) {
        return (item: CallStack) => {
            if (!routeMatcher) {
                return true;
            }

            if (routeMatcher instanceof RegExp || typeof routeMatcher === "string") {
                return testUrlMatch(routeMatcher, item.url.origin + item.url.pathname);
            }

            let matches = 0;
            let mustMatch = 0;

            if (routeMatcher.headersMatcher) {
                mustMatch++;

                matches += routeMatcher.headersMatcher(item.request.headers) ? 1 : 0;
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
                    (routeMatcher.https && item.url.protocol === "https:") ||
                    (!routeMatcher.https && item.url.protocol === "http:")
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

                matches += testUrlMatch(routeMatcher.url, item.url.origin + item.url.pathname)
                    ? 1
                    : 0;
            }

            return matches === mustMatch;
        };
    }

    // private getInfoFromArgs(args: FetchXHRArgs) {
    //     let method: string = "GET";
    //     let url: string | undefined;
    //     const [input, initOrMethod] = args;

    //     if (input instanceof URL) {
    //         url = input.toString();
    //     } else if (typeof input === "string") {
    //         url = input;
    //     } else if (typeof input === "object") {
    //         url = input.url;
    //     }

    //     if (typeof initOrMethod === "string") {
    //         method = initOrMethod;
    //     } else {
    //         method = initOrMethod?.method ?? "GET";
    //     }

    //     return { method, url };
    // }

    private getMock(item: CallStack) {
        const mockItem = [...this._mock]
            .reverse()
            .find((entry) => this.filterItemsByMatcher(entry.routeMatcher)(item));

        if (mockItem && (mockItem.options?.times === undefined || mockItem.options.times === 1)) {
            this._mock.splice(this._mock.indexOf(mockItem), 1);
        } else if (
            mockItem &&
            mockItem.options &&
            mockItem.options.times !== undefined &&
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

        return items.length ? deepCopy(items[items.length - 1]) : undefined;
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
        return deepCopy(this._callStack.filter(this.filterItemsByMatcher(routeMatcher)));
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
            throttleItem.options &&
            throttleItem.options.times !== undefined &&
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

    /**
     * Function called when a request is cancelled or fails
     *
     * @param func A function called on error/cancel
     */
    public onRequestError(func: OnRequestError) {
        this._onRequestError = func;
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
            ...removeUndefinedFromObject(options)
        };

        return deepCopy(this._options);
    }

    /**
     * Throttle requests matching the provided route matcher by setting a delay. By default it
     * throttles the first matching request, then the throttle is removed. Set `times`
     * in options to change how many times should be the matching requests throttled.
     *
     * @param routeMatcher A route matcher
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
     * matcher finish or the maximum time of waiting is reached (`timeout` in options).
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

        const totalTimeout =
            stringMatcherOrOptions.timeout ?? this.requestTimeoutByEnv ?? DEFAULT_TIMEOUT;

        const timeout = totalTimeout - (performance.now() - startTime);

        return waitTill(
            () =>
                this.isThereRequestPending(
                    stringMatcherOrOptions,
                    stringMatcherOrOptions.enforceCheck
                ),
            {
                errorMessage,
                interval: DEFAULT_INTERVAL,
                timeout,
                totalTimeout
            }
        ).then(() => {
            const waitForNextRequestTime =
                stringMatcherOrOptions.waitForNextRequest ?? DEFAULT_WAIT_FOR_NEXT_REQUEST;

            // check with a delay if there is an another request after the last one
            return waitForNextRequestTime > 0
                ? cy
                      .wait(waitForNextRequestTime, {
                          log: false
                      })
                      .then(() =>
                          this.isThereRequestPending(
                              stringMatcherOrOptions,
                              stringMatcherOrOptions.enforceCheck
                          )
                              ? this.waitUntilRequestIsDone_withWait(
                                    stringMatcherOrOptions,
                                    startTime,
                                    errorMessage
                                )
                              : cy.wrap(this)
                      )
                : cy.wrap(this);
        });
    }

    /**
     * Write the logged requests' (or filtered by the provided route matcher) information to a file
     * example: in `afterEach`
     *      => interceptor.writeStatsToLog("./out") => example output will be "./out/Description - It.stats.json"
     *      => interceptor.writeStatsToLog("./out", { fileName: "file_name" }) => example output will be "./out/file_name.stats.json"
     *      => interceptor.writeStatsToLog("./out", { routeMatcher: { type: "onmessage" } }) => write only "onmessage" requests to the output file
     *
     * @param outputDir A path for the output directory
     * @param options Options
     */
    public writeStatsToLog(outputDir: string, options?: WriteStatsOptions) {
        let callStack = options?.routeMatcher
            ? this.callStack.filter(this.filterItemsByMatcher(options?.routeMatcher))
            : this.callStack;

        if (options?.filter) {
            callStack = callStack.filter(options.filter);
        }

        cy.writeFile(
            getFilePath(options?.fileName, outputDir, "stats"),
            JSON.stringify(
                options?.mapper ? callStack.map(options.mapper) : callStack,
                replacer,
                options?.prettyOutput ? 4 : undefined
            )
        );
    }
}
