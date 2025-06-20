/// <reference types="cypress" preserve="true" />

import { RouteMatcherOptions, StringMatcher } from "cypress/types/net-stubbing";

export interface CallStack {
    _headerProcessDuration?: number;
    _responseProcessDuration?: number;
    /**
     * Cross-domain requests will have this property set to `true`.
     */
    crossDomain: boolean;
    /**
     * The throttle delay of the request is set by calling `throttleRequest` or `cy.throttleInterceptorRequest`.
     * If the request is not throttled, this property is `undefined`.
     */
    delay?: number;
    /**
     * The actual total duration of the request in milliseconds (excluding any delay).
     */
    duration?: number;
    /**
     * Is `true` if the request is still in progress
     */
    isPending: boolean;
    /**
     * The resource type
     */
    resourceType: IResourceType;
    /**
     * The request info
     */
    request: IRequest;
    /**
     * An error that occurs when the request fails
     */
    requestError?: unknown;
    /**
     * The response info
     */
    response?: IResponse;
    /**
     * The time when the request started
     */
    timeStart: Date;
    /**
     * The URL of the request
     */
    url: URL;
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

export type IHeadersNormalized = { [key: string]: string };

export interface InterceptorOptions {
    /**
     * Ignore requests outside the domain (default: `false`)
     */
    ignoreCrossDomain?: boolean;
}

export type IHeaders = { [key: string]: string | string[] };

export interface IMockResponse {
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

export interface IMockResponseOptions {
    /**
     * The number of times the response should be mocked. By default, it is set to 1.
     * Set it to Number.POSITIVE_INFINITY to mock the response indefinitely.
     */
    times?: number;
}

export interface IRequest {
    /**
     * The request body, it is the body in string format, JSON.stringify() is used
     */
    body: string;
    /**
     * The request headers
     */
    headers: IHeaders;
    /**
     * Request method (GET, POST, ...)
     */
    method: string;
    /**
     * The URL search params as an object
     */
    query: Record<string, string | number>;
}

export interface IRequestInit {
    /**
     * The request body, it can be anything
     */
    body: Document | BodyInit | null | undefined;
    /**
     * The request headers
     */
    headers: IHeaders;
    /**
     * The request method (GET, POST, ...)
     */
    method: string;
    /**
     * The full request url
     */
    url: URL;
}

export type IResourceType = "fetch" | "xhr";

export interface IResponse {
    /**
     * The response body, it is the body in string format
     */
    body: string;
    /**
     * The headers of the response
     */
    headers: IHeaders;
    /**
     *
     */
    isMock: boolean;
    /**
     * The response status code
     */
    statusCode: number;
    /**
     * The response status text
     */
    statusText: string;
    /**
     * The time when the request ended. This does not include any delay from throttling
     * and reflects the actual time the request finished.
     */
    timeEnd: Date;
}

/**
 * String comparison is case-insensitive. Provide a RegExp without the case-sensitive flag if needed.
 */
export type IRouteMatcher = StringMatcher | IRouteMatcherObject;

export type IRouteMatcherObject = {
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

export interface IThrottleRequestOptions {
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

export type OnRequestError = (request: IRequestInit, error: Error) => void;

export interface WaitUntilRequestOptions extends IRouteMatcherObject {
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

export type WindowTypeOfRequestProxy = Cypress.AUTWindow & {
    originFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    originXMLHttpRequest?: typeof XMLHttpRequest;
};

export interface WriteStatsOptions {
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
