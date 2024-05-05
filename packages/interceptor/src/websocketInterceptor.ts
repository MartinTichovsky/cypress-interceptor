import { deepCopy, getFilePath, testUrlMatch } from "./utils";
import { waitTill } from "./wait";
import { WebSocketAction, WebsocketListener } from "./websocketListener";

declare global {
    namespace Cypress {
        interface Chainable {
            wsInterceptor: () => Chainable<WebsocketInterceptor>;
            wsInterceptorLastRequest: (
                matcher?: IMatcher
            ) => Chainable<CallStackWebsocket | undefined>;
            waitUntilWebsocketAction(
                options?: WaitUntilActionOptions,
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
            waitUntilWebsocketAction(
                matcher?: IMatcher | IMatcher[],
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
            waitUntilWebsocketAction(
                matcher?: IMatcher | IMatcher[],
                options?: WaitUntilActionOptions,
                errorMessage?: string
            ): Cypress.Chainable<WebsocketInterceptor>;
            waitUntilWebsocketAction(
                matcherOrOptions?: IMatcher | IMatcher[] | WaitUntilActionOptions,
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

export type IMatcher = {
    protocols?: string | string[];
    url?: StringMatcher;
} & (
    | {
          type?: "create" | "close" | "onclose" | "onerror" | "onmessage" | "onopen" | "send";
      }
    | {
          code?: number;
          reason?: string;
          type: "close";
      }
    | {
          // data: CloseEvent;
          type: "onclose";
      }
    | {
          // data: MessageEvent<unknown>;
          type: "onmessage";
      }
    | {
          // data: Event;
          type: "onerror" | "onopen";
      }
    | {
          // data: string | ArrayBufferLike | Blob | ArrayBufferView;
          type: "send";
      }
);

type StringMatcher = string | RegExp;

export interface WaitUntilActionOptions {
    enforceCheck?: boolean;
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

    private filterItemsByMatcher(matcher?: IMatcher) {
        return (item: CallStackWebsocket) => {
            if (!matcher) {
                return true;
            }

            let matches = 0;
            let mustMatch = 0;

            switch (matcher.type) {
                case "close": {
                    break;
                }
                case "create": {
                    break;
                }
                case "onclose": {
                    break;
                }
                case "onerror": {
                    break;
                }
                case "onmessage": {
                    break;
                }
                case "onopen": {
                    break;
                }
                case "send": {
                    break;
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

            if (matcher.type) {
                mustMatch++;

                matches += matcher.type === item.type ? 1 : 0;
            }

            if (matcher.url) {
                mustMatch++;

                matches += testUrlMatch(matcher.url, item.url.toString()) ? 1 : 0;
            }

            return matches === mustMatch;
        };
    }

    public getLastRequest(matcher?: IMatcher) {
        const items = this._callStack.filter(this.filterItemsByMatcher(matcher));

        return items.length ? deepCopy(items[items.length - 1]) : undefined;
    }

    private isThereActionMatch(matcher?: IMatcher | IMatcher[], enforceCheck = true) {
        const matcherArray = Array.isArray(matcher) ? matcher : [matcher];

        const itemsArray = matcherArray.map(
            (entry) =>
                this._callStack.slice(this._skip).filter(this.filterItemsByMatcher(entry)).length >
                0
        );

        return enforceCheck
            ? itemsArray.every((hasItems) => hasItems)
            : itemsArray.some((items) => items);
    }

    public resetWatch() {
        this._skip = this._callStack.length;
    }

    public waitUntilWebsocketAction(
        options?: WaitUntilActionOptions,
        errorMessage?: string
    ): Cypress.Chainable<this>;
    public waitUntilWebsocketAction(
        matcher?: IMatcher | IMatcher[],
        errorMessage?: string
    ): Cypress.Chainable<this>;
    public waitUntilWebsocketAction(
        matcher?: IMatcher | IMatcher[],
        options?: WaitUntilActionOptions,
        errorMessage?: string
    ): Cypress.Chainable<this>;
    public waitUntilWebsocketAction(
        matcherOrOptions?: IMatcher | IMatcher[] | WaitUntilActionOptions,
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
        matcher?: IMatcher | IMatcher[] | string | WaitUntilActionOptions
    ): matcher is IMatcher | IMatcher[] {
        return (
            typeof matcher === "object" &&
            matcher !== null &&
            (Array.isArray(matcher) || !this.waitUntilWebsocketAction_isOption(matcher))
        );
    }

    private waitUntilWebsocketAction_isOption(
        options?: IMatcher | IMatcher[] | string | WaitUntilActionOptions
    ): options is WaitUntilActionOptions {
        return (
            typeof options === "object" &&
            options !== null &&
            ("enforceCheck" in options ||
                "waitForNextRequest" in options ||
                "waitTimeout" in options)
        );
    }

    private waitUntilWebsocketAction_withWait(
        matcher: IMatcher | IMatcher[] = [],
        options: WaitUntilActionOptions = {},
        startTime: number,
        errorMessage?: string
    ): Cypress.Chainable<this> {
        const timeout =
            (options.waitTimeout ?? Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT") ?? DEFAULT_TIMEOUT) -
            (performance.now() - startTime);

        return waitTill(() => !this.isThereActionMatch(matcher, options.enforceCheck), {
            errorMessage,
            interval: DEFAULT_INTERVAL,
            timeout
        }).then(() => cy.wrap(this));
    }

    // DEBUG TOOLS

    public writeStatsToLog(
        currentTest: typeof Cypress.currentTest | string | undefined,
        outputDir: string
    ) {
        cy.writeFile(
            getFilePath(currentTest, outputDir, "stats"),
            JSON.stringify(this.callStack, undefined, 4)
        );
    }
}
