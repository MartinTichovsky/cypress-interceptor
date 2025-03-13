/// <reference types="cypress" preserve="true" />

import { WebSocketAction } from "./websocketListener";

export type CallStackWebsocket = WebSocketAction & {
    /**
     * The time when the request started
     */
    timeStart: Date;
};

export type IWSMatcher = {
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

export type StringMatcher = string | RegExp;

export interface WaitUntilActionOptions {
    /**
     * How many requests should match the provided matcher
     */
    countMatch?: number;
    /**
     * The duration Websocket Interceptor will wait for the action. The default is set to 10,000
     * or the value of the `INTERCEPTOR_REQUEST_TIMEOUT` environment variable if specified.
     */
    timeout?: number;
}

export type WindowTypeOfWebsocketProxy = Cypress.AUTWindow & {
    originWebSocket: typeof WebSocket;
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
