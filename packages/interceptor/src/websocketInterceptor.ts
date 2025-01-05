import {
    deepCopy,
    getFilePath,
    isNonNullableObject,
    removeUndefinedFromObject,
    replacer,
    testUrlMatch
} from "./utils";
import { waitTill } from "./wait";
import { WebSocketAction, WebsocketListener } from "./websocketListener";

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Get an instance of Websocket Interceptor
             *
             * @returns An instance of Websocket Interceptor
             */
            wsInterceptor: () => Chainable<WebsocketInterceptor>;
            /**
             * Get the last call matching the provided matcher
             *
             * @param matcher A matcher
             * @returns The last call information or undefined if none match
             */
            wsInterceptorLastRequest: (
                matcher?: IWSMatcher
            ) => Chainable<CallStackWebsocket | undefined>;
            /**
             * Set Websocket Interceptor options,
             * must be called before a request/s occur
             *
             * @param options Options
             * @returns Current Websocket Interceptor options
             */
            wsInterceptorOptions: (
                options?: WebsocketInterceptorOptions
            ) => Chainable<WebsocketInterceptorOptions>;
            /**
             * Get statistics for all requests matching the provided matcher since the beginning
             * of the current test
             *
             * @param matcher A matcher
             * @returns All requests matching the provided matcher with detailed information,
             *          if none match, returns an empty array
             */
            wsInterceptorStats: (matcher?: IWSMatcher) => Chainable<CallStackWebsocket[]>;
            /**
             * Reset the watch of Websocket Interceptor
             */
            wsResetInterceptorWatch: VoidFunction;
            /**
             * Wait until a websocket action occur
             *
             * @param options Action options
             * @param errorMessage An error message when the maximum time of waiting is reached
             */
            waitUntilWebsocketAction(
                options?: WaitUntilActionOptions,
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
            /**
             * Wait until a websocket action occur
             *
             * @param matcher A matcher
             * @param errorMessage An error message when the maximum time of waiting is reached
             */
            waitUntilWebsocketAction(
                matcher?: IWSMatcher | IWSMatcher[],
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
            /**
             * Wait until a websocket action occur
             *
             * @param matcher A matcher
             * @param options Action options
             * @param errorMessage An error message when the maximum time of waiting is reached
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
        }
    }
}

export type CallStackWebsocket = WebSocketAction & {
    /**
     * Time when the request started
     */
    timeStart: Date;
};

export type IWSMatcher = {
    /**
     * A matcher for query string
     *
     * @param query The URL query string
     * @returns True if matches
     */
    queryMatcher?: (query: Record<string, string | number>) => boolean;
    /**
     * Match by protocols
     */
    protocols?: string | string[];
    /**
     * A URL matcher, use * or ** to match any word in string ("**\/api/call", ...)
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

type StringMatcher = string | RegExp;

export interface WaitUntilActionOptions {
    /**
     * How much requests should match the provided matcher
     */
    countMatch?: number;
    /**
     * Time of how long Cypress will be waiting for the action.
     * Default set to 10000 or environment variable `INTERCEPTOR_REQUEST_TIMEOUT` if set
     */
    timeout?: number;
}

export interface WebsocketInterceptorOptions {
    /**
     * Set a debug mode
     */
    debug?: boolean;
}

interface WriteStatsOptions {
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
    filter?: (callStack: CallStackWebsocket) => boolean;
    /**
     * A possibility to map the logged items
     *
     * @param callStack A call info stored in the stack
     * @returns Any object you want to log
     */
    mapper?: (callStack: CallStackWebsocket) => unknown;
    /**
     * A matcher
     */
    matcher?: IWSMatcher;
    /**
     * When true, the output JSON will be formatted with tabs
     */
    prettyOutput?: boolean;
}

const DEFAULT_INTERVAL = 500;
const DEFAULT_TIMEOUT = 10000;

const defaultOptions: Required<WebsocketInterceptorOptions> = {
    debug: undefined!
};

export class WebsocketInterceptor {
    private _callStack: CallStackWebsocket[] = [];
    private _debugByEnv = false;
    private _options: Required<WebsocketInterceptorOptions> = {
        ...defaultOptions
    };
    private _skip = 0;

    constructor(websocketListener: WebsocketListener) {
        this._debugByEnv = !!Cypress.env("INTERCEPTOR_DEBUG");

        websocketListener.subscribe((action) => {
            this._callStack.push({
                ...action,
                timeStart: new Date()
            });
        });
    }

    /**
     * Return a copy of all logged requests since the Websocket Interceptor has been created
     * (the Websocket Interceptor is created in `beforeEach`)
     */
    public get callStack() {
        return deepCopy(this._callStack);
    }

    /**
     * Returns true if debug is enabled by Websocket Interceptor options or Cypress environment
     * variable `INTERCEPTOR_DEBUG`. The Websocket Interceptor `debug` option has the highest
     * priority so if the option is undefined (by default), it returns `Cypress.env("INTERCEPTOR_DEBUG")`
     */
    public get debugIsEnabled() {
        return this._options.debug ?? this._debugByEnv;
    }

    private filterItemsByMatcher(matcher?: IWSMatcher) {
        return (item: CallStackWebsocket) => {
            if (!matcher) {
                return true;
            }

            let matches = 0;
            let mustMatch = 0;

            if ("type" in matcher) {
                switch (matcher.type) {
                    case "close":
                    case "onclose": {
                        if (matcher.reason !== undefined) {
                            mustMatch++;

                            matches +=
                                isNonNullableObject(item.data) &&
                                "reason" in item.data &&
                                matcher.reason === item.data.reason
                                    ? 1
                                    : 0;
                        }

                        if (matcher.code !== undefined) {
                            mustMatch++;

                            matches +=
                                isNonNullableObject(item.data) &&
                                "code" in item.data &&
                                matcher.code === item.data.code
                                    ? 1
                                    : 0;
                        }

                        break;
                    }
                    case "onmessage": {
                        if (matcher.data) {
                            mustMatch++;

                            matches +=
                                isNonNullableObject(item.data) &&
                                "data" in item.data &&
                                matcher.data === item.data.data
                                    ? 1
                                    : 0;
                        }
                        break;
                    }
                    case "send": {
                        if (matcher.data) {
                            mustMatch++;

                            matches += matcher.data === item.data ? 1 : 0;
                        }

                        break;
                    }
                }
            }

            if (matcher.protocols) {
                mustMatch++;

                const matcherProtocols = Array.isArray(matcher.protocols)
                    ? matcher.protocols
                    : [matcher.protocols];
                const itemProtocols = Array.isArray(item.protocols)
                    ? item.protocols
                    : [item.protocols];

                matches += matcherProtocols.every((entry) => itemProtocols.includes(entry)) ? 1 : 0;
            }

            if (matcher.queryMatcher !== undefined) {
                mustMatch++;

                matches += matcher.queryMatcher(item.query) ? 1 : 0;
            }

            if ("type" in matcher && matcher.type) {
                mustMatch++;

                matches += matcher.type === item.type ? 1 : 0;
            }

            if ("types" in matcher && matcher.types) {
                mustMatch++;

                matches += matcher.types.includes(item.type) ? 1 : 0;
            }

            if (matcher.url) {
                mustMatch++;

                matches += testUrlMatch(matcher.url, item.url.toString()) ? 1 : 0;
            }

            return matches === mustMatch;
        };
    }

    /**
     * Get the last call matching the provided matcher
     *
     * @param matcher A matcher
     * @returns The last call information or undefined if none match
     */
    public getLastRequest(matcher?: IWSMatcher) {
        const items = this._callStack.filter(this.filterItemsByMatcher(matcher));

        return items.length ? deepCopy(items[items.length - 1]) : undefined;
    }

    /**
     * Get statistics for all requests matching the provided matcher since the beginning
     * of the current test
     *
     * @param matcher A matcher
     * @returns All requests matching the provided matcher with detailed information,
     *          if none match, returns an empty array
     */
    public getStats(matcher?: IWSMatcher) {
        return deepCopy(this._callStack.filter(this.filterItemsByMatcher(matcher)));
    }

    private isThereActionMatch(matcher: IWSMatcher | IWSMatcher[], countMatch = 1) {
        const matcherArray = Array.isArray(matcher) ? matcher : [matcher];
        const callStack = this._callStack.slice(this._skip);

        const itemsArray = matcherArray.map(
            (entry) => callStack.filter(this.filterItemsByMatcher(entry)).length >= countMatch
        );

        return matcherArray.length > 0
            ? itemsArray.length && itemsArray.every((hasItems) => hasItems)
            : callStack.length > 0;
    }

    /**
     * Reset the watch of Websocket Interceptor
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
    public setOptions(
        options: WebsocketInterceptorOptions = this._options
    ): WebsocketInterceptorOptions {
        this._options = {
            ...this._options,
            ...removeUndefinedFromObject(options),
            // only one option allowed to be undefined
            debug: options.debug!
        };

        return deepCopy(this._options);
    }

    /**
     * Wait until a websocket action occur
     *
     * @param options Action options
     * @param errorMessage An error message when the maximum time of waiting is reached
     */
    public waitUntilWebsocketAction(
        options?: WaitUntilActionOptions,
        errorMessage?: string
    ): Cypress.Chainable<this>;
    /**
     * Wait until a websocket action occur
     *
     * @param matcher A matcher
     * @param errorMessage An error message when the maximum time of waiting is reached
     */
    public waitUntilWebsocketAction(
        matcher?: IWSMatcher | IWSMatcher[],
        errorMessage?: string
    ): Cypress.Chainable<this>;
    /**
     * Wait until a websocket action occur
     *
     * @param matcher A matcher
     * @param options Action options
     * @param errorMessage An error message when the maximum time of waiting is reached
     */
    public waitUntilWebsocketAction(
        matcher?: IWSMatcher | IWSMatcher[],
        options?: WaitUntilActionOptions,
        errorMessage?: string
    ): Cypress.Chainable<this>;
    public waitUntilWebsocketAction(
        matcherOrOptions?: IWSMatcher | IWSMatcher[] | WaitUntilActionOptions,
        errorMessageOrOptions?: string | WaitUntilActionOptions,
        errorMessage?: string
    ) {
        const matcher = this.waitUntilWebsocketAction_isMatcher(matcherOrOptions)
            ? matcherOrOptions
            : undefined;

        const options = this.waitUntilWebsocketAction_isOption(matcherOrOptions)
            ? matcherOrOptions
            : this.waitUntilWebsocketAction_isOption(errorMessageOrOptions)
              ? errorMessageOrOptions
              : undefined;

        return this.waitUntilWebsocketAction_withWait(
            matcher,
            options,
            performance.now(),
            typeof errorMessageOrOptions === "string" ? errorMessageOrOptions : errorMessage
        );
    }

    private waitUntilWebsocketAction_isMatcher(
        matcher?: IWSMatcher | IWSMatcher[] | string | WaitUntilActionOptions
    ): matcher is IWSMatcher | IWSMatcher[] {
        return (
            isNonNullableObject(matcher) &&
            (Array.isArray(matcher) || !this.waitUntilWebsocketAction_isOption(matcher))
        );
    }

    private waitUntilWebsocketAction_isOption(
        options?: IWSMatcher | IWSMatcher[] | string | WaitUntilActionOptions
    ): options is WaitUntilActionOptions {
        return (
            isNonNullableObject(options) &&
            ("countMatch" in options || "enforceCheck" in options || "timeout" in options)
        );
    }

    private waitUntilWebsocketAction_withWait(
        matcher: IWSMatcher | IWSMatcher[] = [],
        options: WaitUntilActionOptions = {},
        startTime: number,
        errorMessage?: string
    ): Cypress.Chainable<this> {
        const totalTimeout =
            options.timeout ?? Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT") ?? DEFAULT_TIMEOUT;

        const timeout = totalTimeout - (performance.now() - startTime);

        return waitTill(() => !this.isThereActionMatch(matcher, options.countMatch), {
            errorMessage,
            interval: DEFAULT_INTERVAL,
            timeout,
            totalTimeout
        }).then(() => cy.wrap(this));
    }

    // DEBUG TOOLS

    /**
     * Write the logged requests' (or filtered by the provided matcher) information to a file,
     * example: in `afterEach`
     *      => wsInterceptor.writeStatsToLog("./out") => example output will be "./out/Description - It.stats.json"
     *      => wsInterceptor.writeStatsToLog("./out", { fileName: "file_name" }) => example output will be "./out/file_name.stats.json"
     *      => wsInterceptor.writeStatsToLog("./out", { matcher: { resourceType: "fetch" }}) => write only fetch requests to the output file
     *
     * @param outputDir A path for the output directory
     * @param options Options
     */
    public writeStatsToLog(outputDir: string, options?: WriteStatsOptions) {
        let callStack = options?.matcher
            ? this.callStack.filter(this.filterItemsByMatcher(options?.matcher))
            : this.callStack;

        if (options?.filter) {
            callStack = callStack.filter(options.filter);
        }

        cy.writeFile(
            getFilePath(options?.fileName, outputDir, "ws.stats"),
            JSON.stringify(
                options?.mapper ? callStack.map(options.mapper) : callStack,
                replacer,
                options?.prettyOutput ? 4 : undefined
            )
        );
    }
}
