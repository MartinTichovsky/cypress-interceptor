import { deepCopy, getFilePath, isNonNullableObject, replacer, testUrlMatch } from "./utils";
import { waitTill } from "./wait";
import { WebSocketAction, WebsocketListener } from "./websocketListener";

declare global {
    namespace Cypress {
        interface Chainable {
            wsInterceptor: () => Chainable<WebsocketInterceptor>;
            wsInterceptorLastRequest: (
                matcher?: IWSMatcher
            ) => Chainable<CallStackWebsocket | undefined>;
            wsInterceptorStats: (matcher?: IWSMatcher) => Chainable<CallStackWebsocket[]>;
            wsResetInterceptorWatch: () => void;
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
    countMatch?: number;
    waitTimeout?: number;
}

const DEFAULT_INTERVAL = 500;
const DEFAULT_TIMEOUT = 10000;

export class WebsocketInterceptor {
    private _callStack: CallStackWebsocket[] = [];
    private _skip = 0;

    constructor(websocketListener: WebsocketListener) {
        websocketListener.subscribe((action) => {
            this._callStack.push({
                ...action,
                timeStart: new Date()
            });
        });
    }

    public get callStack() {
        return deepCopy(this._callStack);
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

    public getLastRequest(matcher?: IWSMatcher) {
        const items = this._callStack.filter(this.filterItemsByMatcher(matcher));

        return items.length ? deepCopy(items[items.length - 1]) : undefined;
    }

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

    public resetWatch() {
        this._skip = this._callStack.length;
    }

    public waitUntilWebsocketAction(
        options?: WaitUntilActionOptions,
        errorMessage?: string
    ): Cypress.Chainable<this>;
    public waitUntilWebsocketAction(
        matcher?: IWSMatcher | IWSMatcher[],
        errorMessage?: string
    ): Cypress.Chainable<this>;
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
            ("countMatch" in options || "enforceCheck" in options || "waitTimeout" in options)
        );
    }

    private waitUntilWebsocketAction_withWait(
        matcher: IWSMatcher | IWSMatcher[] = [],
        options: WaitUntilActionOptions = {},
        startTime: number,
        errorMessage?: string
    ): Cypress.Chainable<this> {
        const timeout =
            (options.waitTimeout ?? Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT") ?? DEFAULT_TIMEOUT) -
            (performance.now() - startTime);

        return waitTill(() => !this.isThereActionMatch(matcher, options.countMatch), {
            errorMessage,
            interval: DEFAULT_INTERVAL,
            timeout
        }).then(() => cy.wrap(this));
    }

    // DEBUG TOOLS

    public writeStatsToLog(outputDir: string, matcher?: IWSMatcher, fileName?: string) {
        cy.writeFile(
            getFilePath(fileName, outputDir, "ws.stats"),
            JSON.stringify(this.callStack.filter(this.filterItemsByMatcher(matcher)), replacer, 4)
        );
    }
}
