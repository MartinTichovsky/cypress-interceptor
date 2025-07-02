/// <reference preserve="true" types="cypress" />

import { StringMatcher } from "cypress/types/net-stubbing";

import { convertInputBodyToString } from "./convert/convert";
import {
    CallStack,
    CallStackJson,
    IMockResponse,
    IMockResponseOptions,
    InterceptorOptions,
    IRouteMatcher,
    IThrottleRequestOptions,
    OnRequestError,
    ReproduceNetComOptions,
    WaitUntilRequestOptions,
    WriteStatsOptions
} from "./Interceptor.types";
import { RequestProxy } from "./src/RequestProxy";
import { deepCopy, removeUndefinedFromObject, testUrlMatch } from "./src/utils";
import { getFilePath } from "./src/utils.cypress";
import { convertCallStackJsonToCallStack, validateStats } from "./src/validator";
import { waitTill } from "./src/wait";

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Destroy the Interceptor proxy. The original `fetch` and `XMLHttpRequest` will be restored.
             * The latest Interceptor instance is still available.
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
             * Reproduce the network communication from the provided stats.
             *
             * @param stats The stats to reproduce
             */
            reproduceNetCom(
                stats: CallStackJson[],
                options?: ReproduceNetComOptions
            ): Chainable<void>;
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
             * @example cy.writeInterceptorStatsToLog("./out") => the output file will be "./out/Description - It.stats.json"
             * @example cy.writeInterceptorStatsToLog("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
             * @example cy.writeInterceptorStatsToLog("./out", { routeMatcher: { method: "GET" } }) => write only "GET" requests to the output file
             * @example cy.writeInterceptorStatsToLog("./out", { mapper: (callStack) => ({ type: callStack.type, url: callStack.url }) }) => map the output that will be written to the output file
             *
             * @param outputDir The path for the output folder
             * @param options Options
             */
            writeInterceptorStatsToLog(
                outputDir: string,
                options?: WriteStatsOptions &
                    Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
            ): Chainable<null>;
        }
    }
}

const DEFAULT_INTERVAL = 500;
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_WAIT_FOR_NEXT_REQUEST = 750;

const defaultOptions: Required<InterceptorOptions> = {
    ignoreCrossDomain: false
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
    private _reproduceOptions: ReproduceNetComOptions = {};
    private _reproduceStack?: CallStack[];
    private _skip = 0;
    private _throttle: {
        delay: number;
        id: number;
        options?: IThrottleRequestOptions;
        routeMatcher: IRouteMatcher;
    }[] = [];
    private _throttleId = 0;
    private win: Cypress.AUTWindow = window;

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
            const _headerProcessStart = performance.now();

            this.win = win;

            const crossDomain = request.url.host !== document.location.host;
            // the pending status is not logged in cross-domain requests when ignoreCrossDomain is `true`
            // but it can be mocked or throttled
            const ignoreItem = this._options.ignoreCrossDomain && crossDomain;
            const query = Object.fromEntries(request.url.searchParams);

            const item: CallStack = {
                crossDomain,
                isPending: !ignoreItem,
                request: {
                    body: await convertInputBodyToString(request.body, win),
                    headers: deepCopy(request.headers),
                    method: request.method,
                    query: deepCopy(query)
                },
                resourceType,
                timeStart: new Date("0000-00-00"),
                url: request.url
            };

            this._callStack.push(item);

            /**
             * when mocking the response, the priority is:
             * - reproduce
             * - mock
             * - throttle
             */

            const reproduceStack = this.getReproduceStack(item);
            const throttle = reproduceStack ?? this.getThrottle(item);
            const mock = reproduceStack
                ? reproduceStack.mockResponse
                : (this.getMock(item) ?? throttle.mockResponse);
            const durationStart = performance.now();

            item.delay = throttle.delay;
            item.timeStart = new Date();
            item._headerProcessDuration = performance.now() - _headerProcessStart;

            const onRequestDone = async (response: XMLHttpRequest | Response, isMock = false) => {
                try {
                    const _responseProcessDuration = performance.now();

                    item.duration = performance.now() - durationStart;

                    const timeEnd = new Date();

                    let body = "";

                    // store the response body as string (less demanding than an object) for possible logging
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
                                ? typeof response.response === "object"
                                    ? JSON.stringify(response.response)
                                    : response.response
                                : response.responseText;
                    }

                    item.response = {
                        body,
                        headers: Object.fromEntries(
                            new Headers(
                                response instanceof this.win.XMLHttpRequest ||
                                response instanceof XMLHttpRequest
                                    ? parseResponseHeaders(response.getAllResponseHeaders())
                                    : (response.headers as HeadersInit)
                            ).entries()
                        ),
                        isMock,
                        statusCode: response.status,
                        statusText: response.statusText,
                        timeEnd
                    };

                    item._responseProcessDuration = performance.now() - _responseProcessDuration;
                } catch (e) {
                    console.error(e);
                }
            };

            return {
                done: (response, resolve, isMock) => {
                    // to avoid multiple calls when using different response catch methods (in XMLHttpRequest)
                    void (async () => {
                        if (throttle?.delay) {
                            await wait(throttle.delay);
                        }

                        if (item.response === undefined) {
                            await onRequestDone(response, isMock);
                        }

                        try {
                            resolve();
                        } finally {
                            // set isPending with a delay to let JavaScript finish processing the response
                            // set isPending with a delay to let JavaScript finish processing the response
                            setTimeout(() => {
                                item.isPending = false;
                            }, 100);
                        }
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

    get requestTimeoutByEnv() {
        return Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");
    }

    /**
     * Return a copy of all logged requests since the Interceptor was created (the Interceptor is created in `beforeEach`).
     */
    public get callStack() {
        return deepCopy(this._callStack);
    }

    private filterItemsByMatcher(routeMatcher?: IRouteMatcher) {
        return (item: CallStack) => {
            if (!routeMatcher) {
                return true;
            }

            if (
                routeMatcher instanceof this.win.RegExp ||
                routeMatcher instanceof RegExp ||
                typeof routeMatcher === "string"
            ) {
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
     * Get the last call that matches the provided route matcher.
     *
     * @param routeMatcher A route matcher
     * @returns The last call information or `undefined` if none match
     */
    public getLastRequest(routeMatcher?: IRouteMatcher) {
        const items = this._callStack.filter(this.filterItemsByMatcher(routeMatcher));

        return items.length ? deepCopy(items[items.length - 1]) : undefined;
    }

    public getReproduceStack(item: CallStack) {
        if (!this._reproduceStack || this._reproduceStack.length === 0) {
            return undefined;
        }

        const url = `${item.url.origin}${item.url.pathname}`;

        const index = this._reproduceStack.findIndex(
            (entry) =>
                this._reproduceOptions.urlMatch?.(item.url, deepCopy(entry)) ||
                (this._reproduceOptions.onlyUrlMatch === true
                    ? false
                    : `${this._reproduceOptions.protocol ? `${this._reproduceOptions.protocol}:` : entry.url.protocol}//${this._reproduceOptions.host ?? entry.url.host}${entry.url.pathname}` ===
                          url &&
                      entry.request.method === item.request.method &&
                      entry.resourceType === item.resourceType)
        );

        if (index === -1) {
            return undefined;
        }

        const entry = this._reproduceStack[index];

        let body = entry.response?.body;

        // we expect the body will be a stingified JSON object
        if (body && typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch {
                //
            }
        }

        const delay = (entry.duration ?? 0) + (entry.delay ?? 0);

        const mockResponse = {
            body,
            headers: Object.fromEntries(
                Object.entries(entry.response?.headers ?? {}).map(([key, value]) => [
                    key,
                    Array.isArray(value) ? value[0] : value
                ])
            ),
            statusCode: entry.response?.statusCode,
            statusText: entry.response?.statusText
        };

        this._reproduceStack.splice(index, 1);

        return { delay, mockResponse };
    }

    /**
     * Get statistics for all requests matching the provided route matcher since the beginning of the current test.
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
     * Get the number of requests matching the provided route matcher.
     *
     * @param routeMatcher A route matcher
     * @returns The number of requests matching the provided route matcher since the current test started
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
     * Mock the response of requests matching the provided route matcher. By default, it mocks the
     * first matching request, and then the mock is removed. Set `times` in the options to change
     * how many times the matching requests should be mocked.
     *
     * @param routeMatcher A route matcher
     * @param mock The response mock
     * @param options The mock options
     * @returns The ID of the created mock. This is needed if you want to remove the mock manually.
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
     * Remove the mock entry by ID
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
     * Remove the throttle entry by ID
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

    public reproduceNetCom(stats: CallStackJson[], options?: ReproduceNetComOptions) {
        validateStats(stats);

        this._reproduceOptions = options ?? {};
        this._reproduceStack = convertCallStackJsonToCallStack(stats);
    }

    /**
     * Reset the Interceptor's watch. It sets the pointer to the last call. Resetting the pointer
     * is necessary when you want to wait for certain requests.
     *
     * Example: On a site, there are multiple requests to api/getUser, but we want to wait for the
     * specific one that occurs after clicking a button. Since we cannot know which api/getUser call
     * to wait for, calling this method sets the exact point from which we want to check the next requests.
     */
    public resetWatch() {
        this._skip = this._callStack.length;
    }

    /**
     * Set the Interceptor options. This must be called before a request occurs.
     *
     * @param options Options
     * @returns The current Interceptor options
     */
    public setOptions(options: InterceptorOptions = this._options): InterceptorOptions {
        this._options = {
            ...this._options,
            ...removeUndefinedFromObject(options)
        };

        return deepCopy(this._options);
    }

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
    public waitUntilRequestIsDone<T>(
        action: () => Cypress.Chainable<T>,
        stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
        errorMessage?: string
    ): Cypress.Chainable<T>;
    /**
     * @param action An action which should trigger a request
     * @param stringMatcherOrOptions A string matcher OR options with a route matcher
     * @param errorMessage An error message when the maximum waiting time is reached
     * @returns The result from the action
     */
    public waitUntilRequestIsDone<T>(
        action: () => T,
        stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
        errorMessage?: string
    ): Cypress.Chainable<T>;
    /**
     * @param stringMatcherOrOptions A string matcher OR options with a route matcher
     * @param errorMessage An error message when the maximum waiting time is reached
     * @returns An instance of the Interceptor
     */
    public waitUntilRequestIsDone(
        stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions,
        errorMessage?: string
    ): Cypress.Chainable<Interceptor>;
    public waitUntilRequestIsDone<T>(
        actionOrStringMatcherOrOptions?:
            | (() => Cypress.Chainable<T>)
            | (() => T)
            | StringMatcher
            | WaitUntilRequestOptions,
        stringMatcherOrOptionsOrErrorMessage?: StringMatcher | WaitUntilRequestOptions | string,
        errorMessage?: string
    ): Cypress.Chainable<T> | Cypress.Chainable<this> {
        if (typeof actionOrStringMatcherOrOptions === "function") {
            this.resetWatch();

            const actionResult = actionOrStringMatcherOrOptions();

            if (
                typeof actionResult === "object" &&
                actionResult !== null &&
                "then" in actionResult &&
                typeof actionResult.then === "function"
            ) {
                return actionResult.then((result) => {
                    this.waitUntilRequestIsDone_withWait(
                        stringMatcherOrOptionsOrErrorMessage,
                        performance.now(),
                        errorMessage
                    );

                    return cy.wrap(result);
                });
            } else {
                this.waitUntilRequestIsDone_withWait(
                    stringMatcherOrOptionsOrErrorMessage,
                    performance.now(),
                    errorMessage
                );

                return cy.wrap(actionResult as T);
            }
        }

        return this.waitUntilRequestIsDone_withWait(
            actionOrStringMatcherOrOptions,
            performance.now(),
            typeof stringMatcherOrOptionsOrErrorMessage === "string"
                ? stringMatcherOrOptionsOrErrorMessage
                : undefined
        );
    }

    private waitUntilRequestIsDone_withWait(
        stringMatcherOrOptions: StringMatcher | WaitUntilRequestOptions = {},
        startTime: number,
        errorMessage?: string
    ): Cypress.Chainable<this> {
        if (
            typeof stringMatcherOrOptions === "string" ||
            stringMatcherOrOptions instanceof this.win.RegExp ||
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
     * Write the logged requests' information (or those filtered by the provided route matcher) to a file
     *
     * @example writeStatsToLog("./out") => the output file will be "./out/Description - It.stats.json"
     * @example writeStatsToLog("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
     * @example writeStatsToLog("./out", { routeMatcher: { method: "GET" } }) => write only "GET" requests to the output file
     * @example writeStatsToLog("./out", { mapper: (callStack) => ({ type: callStack.type, url: callStack.url }) }) => map the output that will be written to the output file
     *
     * @param outputDir The path for the output folder
     * @param options Options
     */
    public writeStatsToLog(
        outputDir: string,
        options?: WriteStatsOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
    ) {
        let callStack = options?.routeMatcher
            ? this.callStack.filter(this.filterItemsByMatcher(options.routeMatcher))
            : this.callStack;

        if (options?.filter) {
            callStack = callStack.filter(options.filter);
        }

        if (!callStack.length) {
            return cy.wrap(null);
        }

        return cy.writeFile(
            getFilePath(options?.fileName, outputDir, "stats"),
            JSON.stringify(
                options?.mapper ? callStack.map(options.mapper) : callStack,
                undefined,
                options?.prettyOutput ? 4 : undefined
            ),
            options
        );
    }
}
