import { RequestListener } from "./requestListener";

export const __REQUEST_KEY = "R-INTERCEPTOR-ID";

// TODO: remove when cancelled requests are catched by Cypress Intercept
// https://github.com/cypress-io/cypress/issues/19326
export const createRequestProxy = (requestListener: RequestListener) => {
    const listener = (
        win: Cypress.AUTWindow & {
            originFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
            originXMLHttpRequest: typeof XMLHttpRequest;
        }
    ) => {
        requestListener.setCurrentState("window:before:load");

        requestListener.onCreate();

        if (win.originFetch === undefined) {
            win.originFetch = win.fetch;
        }

        win.fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => {
            const requestId = requestListener.registerId();

            if (!init) {
                init = {};
            }

            const headers = Object.fromEntries(new Headers(init.headers).entries());

            init.headers = {
                ...headers,
                [__REQUEST_KEY]: requestId
            };

            return new Promise((resolve, reject) => {
                win.originFetch(input, init)
                    .then((result) => {
                        resolve(result);
                    })
                    .catch((error) => {
                        requestListener.fireError([input, init], error, requestId);
                        reject(error);
                    });
            });
        };

        if (win.originXMLHttpRequest === undefined) {
            win.originXMLHttpRequest = win.XMLHttpRequest;
        }

        class XMLHttpRequestProxy extends win.originXMLHttpRequest {
            private _method: string | undefined;
            private _requestId: string | undefined;
            private _url: string | URL | undefined;

            // catch an aborted request
            set onabort(value: (ev: ProgressEvent<EventTarget>) => unknown) {
                super.onabort = (ev) => {
                    value.bind(this)(ev);
                    requestListener.fireError([this._url, this._method], ev, this._requestId);
                };
            }

            // catch an error of the request
            set onerror(value: (ev: ProgressEvent<EventTarget>) => unknown) {
                super.onerror = (ev) => {
                    value.bind(this)(ev);
                    requestListener.fireError([this._url, this._method], ev, this._requestId);
                };
            }

            constructor() {
                super();

                this.onabort = () => {
                    //
                };

                this.onerror = () => {
                    //
                };
            }

            open(method: string, url: string | URL): void;
            open(
                method: string,
                url: string | URL,
                async: boolean,
                username?: string | null | undefined,
                password?: string | null | undefined
            ): void;
            open(
                method: string,
                url: string | URL,
                async?: boolean,
                username?: string | null | undefined,
                password?: string | null | undefined
            ): void {
                this._method = method;
                this._url = url;

                if (async !== undefined) {
                    return super.open(method, url, async, username, password);
                } else {
                    return super.open(method, url);
                }
            }

            send(body?: Document | XMLHttpRequestBodyInit | null) {
                this._requestId = requestListener.registerId();
                this.setRequestHeader(__REQUEST_KEY, this._requestId);

                return super.send(body);
            }
        }

        win.XMLHttpRequest = XMLHttpRequestProxy;
    };

    return listener;
};
