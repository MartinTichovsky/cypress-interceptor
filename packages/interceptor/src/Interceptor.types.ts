import { RouteMatcherOptions, StringMatcher } from "cypress/types/net-stubbing";

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
    resourceType: IResourceType;
    /**
     * Request info
     */
    request: IRequest;
    /**
     * An error when request fail
     */
    requestError?: unknown;
    /**
     * Response info
     */
    response?: IResponse;
    /**
     * Time when the request started
     */
    timeStart: Date;
    /**
     * URL of the request
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
     * Ignore request outside the domain, default: true
     */
    ingoreCrossDomain?: boolean;
}

export type IHeaders = { [key: string]: string | string[] };

export interface IMockResponse {
    /**
     * A response body, it can be anything
     */
    body?: unknown;
    /**
     * Generate a body with the original response body, this option is preferred before option `body`
     *
     * @param request An object with the request data (body, query, method, ...)
     * @param originalResponseBody The original response body
     * @returns A response body, it can be anything
     */
    generateBody?: (request: IRequest) => unknown;
    /**
     * If provided, will be added to the original response headers
     */
    headers?: IHeadersNormalized;
    /**
     * Response status code
     */
    statusCode?: number;
    /**
     * Response status text
     */
    statusText?: string;
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
     * URL query string as object
     */
    query: Record<string, string | number>;
}

export type IResourceType = "fetch" | "xhr";

export interface IResponse {
    /**
     * The response body
     */
    body: string;
    /**
     * Headers of the response
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
    bodyMatcher?: (body: string) => boolean;
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
    headersMatcher?: (headers: IHeaders) => boolean;
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
    resourceType?: IResourceType | IResourceType[] | "all";
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

export type OnRequestError = (request: IRequestInit, error: Error) => void;

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
     * Request method (GET, POST, ...)
     */
    method: string;
    /**
     * The full request url
     */
    url: URL;
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
     * Time of how long Cypress will be waiting for the pending requests.
     * Default set to 10000 or environment variable `INTERCEPTOR_REQUEST_TIMEOUT` if set
     */
    timeout?: number;
    /**
     * Time to wait in ms. Default set to 750
     *
     * There is needed to wait if there is a possible following request after the last one (because of the JS code
     * and subsequent requests). Set to 0 to skip repetitive checking for requests.
     */
    waitForNextRequest?: number;
}

export interface WriteStatsOptions {
    /**
     * A name of the file, if undefined, it will be composed from the running test
     */
    fileName?: string;
    /**
     * A possibility to filter the logged items
     *
     * @param callStack A call info stored in the stack
     * @returns false if the item should be skipped
     */
    filter?: (callStack: CallStack) => boolean;
    /**
     * A possibility to map the logged items
     *
     * @param callStack A call info stored in the stack
     * @returns Any object you want to log
     */
    mapper?: (callStack: CallStack) => unknown;
    /**
     * When true, the output JSON will be formatted with tabs
     */
    prettyOutput?: boolean;
    /**
     * A route matcher
     */
    routeMatcher?: IRouteMatcher;
}
