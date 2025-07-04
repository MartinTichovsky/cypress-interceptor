/// <reference types="cypress" preserve="true" />

import { deepCopy, isNonNullableObject, testUrlMatch } from "./src/utils";
import { getFilePath } from "./src/utils.cypress";
import { waitTill } from "./src/wait";
import { WebsocketListener } from "./src/websocketListener";
import {
    CallStackWebsocket,
    IWSMatcher,
    WaitUntilActionOptions,
    WriteStatsOptions
} from "./WebsocketInterceptor.types";

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Destroy the Websocket Interceptor
             */
            destroyWsInterceptor(): void;
            /**
             * Recreate the Websocket Interceptor
             */
            recreateWsInterceptor(): void;
            /**
             * Get an instance of the Websocket Interceptor
             *
             * @returns An instance of the Websocket Interceptor
             */
            wsInterceptor(): Chainable<WebsocketInterceptor>;
            /**
             * Get the last call matching the provided route matcher.
             *
             * @param matcher A matcher
             * @returns The last call information or `undefined` if none matches.
             */
            wsInterceptorLastRequest(
                matcher?: IWSMatcher
            ): Chainable<CallStackWebsocket | undefined>;
            /**
             * Get the statistics for all requests matching the provided matcher since the beginning
             * of the current test.
             *
             * @param matcher A matcher
             * @returns It returns all requests matching the provided matcher with detailed information.
             * If none match, it returns an empty array.
             */
            wsInterceptorStats(matcher?: IWSMatcher): Chainable<CallStackWebsocket[]>;
            /**
             * Write the logged requests' information (or those filtered by the provided matcher) to a file
             *
             * @example cy.wsInterceptorStatsToLog("./out") => the output file will be "./out/[Description] It.stats.json"
             * @example cy.wsInterceptorStatsToLog("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
             * @example cy.wsInterceptorStatsToLog("./out", { matcher: { protocols: "soap" } }) => write only "soap" requests to the output file
             * @example cy.wsInterceptorStatsToLog("./out", { matcher: { url: "my-url" } }) => write only requests to my-url to the output file
             * @example cy.wsInterceptorStatsToLog("./out", { mapper: (entry) => ({ url: entry.url }) }) => map the output that will be written to the output file
             *
             * @param outputDir A path for the output directory
             * @param options Options
             */
            wsInterceptorStatsToLog(
                outputDir: string,
                options?: WriteStatsOptions &
                    Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
            ): Chainable<null>;
            /**
             * Reset the the Websocket Interceptor's watch
             */
            wsResetInterceptorWatch: VoidFunction;
            /**
             * Wait until a websocket action occurs
             *
             * @param options Action options
             * @param errorMessage An error message when the maximum waiting time is reached
             */
            waitUntilWebsocketAction(
                options?: WaitUntilActionOptions,
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
            /**
             * Wait until a websocket action occurs
             *
             * @param matcher A matcher
             * @param errorMessage An error message when the maximum waiting time is reached
             */
            waitUntilWebsocketAction(
                matcher?: IWSMatcher | IWSMatcher[],
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
            /**
             * Wait until a websocket action occurs
             *
             * @param matcher A matcher
             * @param options Action options
             * @param errorMessage An error message when the maximum waiting time is reached
             */
            waitUntilWebsocketAction(
                matcher?: IWSMatcher | IWSMatcher[],
                options?: WaitUntilActionOptions,
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
        }
    }
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

    /**
     * Returns a copy of all logged requests since the WebSocket Interceptor was created
     * (the Websocket Interceptor is created in `beforeEach`)
     */
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

    /**
     * Get the last call matching the provided route matcher.
     *
     * @param matcher A matcher
     * @returns The last call information or `undefined` if none matches.
     */
    public getLastRequest(matcher?: IWSMatcher) {
        const items = this._callStack.filter(this.filterItemsByMatcher(matcher));

        return items.length ? deepCopy(items[items.length - 1]) : undefined;
    }

    /**
     * Get the statistics for all requests matching the provided matcher since the beginning
     * of the current test.
     *
     * @param matcher A matcher
     * @returns It returns all requests matching the provided matcher with detailed information.
     * If none match, it returns an empty array.
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
     * Reset the the Websocket Interceptor's watch
     */
    public resetWatch() {
        this._skip = this._callStack.length;
    }

    /**
     * Wait until a websocket action occurs
     *
     * @param options Action options
     * @param errorMessage An error message when the maximum waiting time is reached
     */
    public waitUntilWebsocketAction(
        options?: WaitUntilActionOptions,
        errorMessage?: string
    ): Cypress.Chainable<this>;
    /**
     * Wait until a websocket action occurs
     *
     * @param matcher A matcher
     * @param errorMessage An error message when the maximum waiting time is reached
     */
    public waitUntilWebsocketAction(
        matcher?: IWSMatcher | IWSMatcher[],
        errorMessage?: string
    ): Cypress.Chainable<this>;
    /**
     * Wait until a websocket action occurs
     *
     * @param matcher A matcher
     * @param options Action options
     * @param errorMessage An error message when the maximum waiting time is reached
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

    /**
     * Write the logged requests' information (or those filtered by the provided matcher) to a file
     *
     * @example writeStatsToLog("./out") => the output file will be "./out/Description - It.stats.json"
     * @example writeStatsToLog("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
     * @example writeStatsToLog("./out", { matcher: { protocols: "soap" } }) => write only "soap" requests to the output file
     * @example writeStatsToLog("./out", { matcher: { url: "my-url" } }) => write only requests to my-url to the output file
     * @example writeStatsToLog("./out", { mapper: (entry) => ({ url: entry.url }) }) => map the output that will be written to the output file
     *
     * @param outputDir A path for the output directory
     * @param options Options
     */
    public writeStatsToLog(
        outputDir: string,
        options?: WriteStatsOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
    ) {
        let callStack = options?.matcher
            ? this.callStack.filter(this.filterItemsByMatcher(options.matcher))
            : this.callStack;

        if (options?.filter) {
            callStack = callStack.filter(options.filter);
        }

        if (!callStack.length) {
            return cy.wrap(null);
        }

        return cy.writeFile(
            getFilePath(options?.fileName, outputDir, "ws.stats"),
            JSON.stringify(
                options?.mapper ? callStack.map(options.mapper) : callStack,
                undefined,
                options?.prettyOutput ? 4 : undefined
            ),
            options
        );
    }
}
