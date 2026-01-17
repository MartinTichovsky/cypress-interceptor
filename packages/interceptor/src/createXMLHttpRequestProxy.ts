import { convertInputBodyToString } from "../convert/convert";
import { WindowTypeOfRequestProxy } from "../Interceptor.types";
import { lineCalled } from "../test.unit";
import { emptyProxy, RequestProxy, RequestProxyFunctionResult } from "./RequestProxy";
import { CallLineEnum } from "./test.enum";

export const CYPRESS_ENV_KEY_XHR_PROXY_DISABLED = "__xhrProxyDisabled";

/**
 * !! IMPORTANT !!
 * There is a bug in the XMLHttpRequest implementation in Cypress. When use a wrapped function like:
 *
 * @example
 * ```ts
 *    set onreadystatechange(value: (this: XMLHttpRequest, ev: Event) => unknown) {
 *        // this is the wrapped function where the issue is
 *        super.onreadystatechange = (ev) => {
 *            value.call(this, ev);
 *        }
 *
 *        // this would work without any issue, but we need to use the wrapped function
 *        // super.onreadystatechange = value;
 *    }
 * ```
 *
 * And use a relative path like:
 *
 * @example
 * ```ts
 *       const req = new XMLHttpRequest();
 *
 *       // when executed on `http://localhost/page.html`
 *       req.open("GET", "http://localhost/test", true);
 *       req.send();
 *       req.onreadystatechange = () => {
 *           if (req.readyState === 4) {
 *               window.location.href = "./relative-path";
 *           }
 *       };
 * ```
 *
 * The redirected url will be "./__cypress/iframes/relative-path" instead of "http://localhost/relative-path".
 * The issue is when Cypress is resolving the relative path. This `shadow model` of XMLHttpRequest should fix this issue.
 */
export const createXMLHttpRequestProxy = (
    win: WindowTypeOfRequestProxy,
    requestProxy: RequestProxy
) => {
    if (Cypress.env(CYPRESS_ENV_KEY_XHR_PROXY_DISABLED)) {
        return;
    }

    if (win.originXMLHttpRequest === undefined) {
        win.originXMLHttpRequest = win.XMLHttpRequest;
    }

    class XMLHttpRequestProxy extends win.originXMLHttpRequest {
        private _convertedBody = "";
        private _headers: Record<string, string> = {};
        private _method: string = "GET";
        private _mockBody = false;
        private _proxy: RequestProxyFunctionResult = emptyProxy;
        private _url: URL = new URL("/", win.location.href);
        private shadowXhr: XMLHttpRequest;

        constructor() {
            super();

            // Create a shadow XMLHttpRequest that won't make real requests
            this.shadowXhr = new win.originXMLHttpRequest!();

            // Initialize default event handlers
            this.onabort = () => {
                //
            };

            this.onerror = () => {
                //
            };

            this.onloadend = () => {
                //
            };

            this.onloadstart = () => {
                //
            };

            this.onreadystatechange = () => {
                //
            };
        }

        private createEvent(type: string, originalEvent: ProgressEvent<EventTarget>) {
            return new win.ProgressEvent(type, {
                bubbles: originalEvent.bubbles,
                cancelable: originalEvent.cancelable,
                lengthComputable: originalEvent.lengthComputable,
                loaded: originalEvent.loaded,
                total: originalEvent.total
            });
        }

        private createProgressEvent(type: string, originalEvent: Event) {
            return new win.ProgressEvent(type, {
                bubbles: originalEvent.bubbles,
                cancelable: originalEvent.cancelable
            });
        }

        private handleError(error: Error, callLine: CallLineEnum) {
            try {
                this._proxy.error(error);
            } catch {
                lineCalled(callLine);
            }
        }

        private simulateResponseOnShadow() {
            // Set response properties on shadow XMLHttpRequest
            Object.defineProperty(this.shadowXhr, "readyState", {
                value: this.readyState,
                writable: true,
                configurable: true
            });

            Object.defineProperty(this.shadowXhr, "status", {
                value: this.status,
                writable: true,
                configurable: true
            });

            Object.defineProperty(this.shadowXhr, "statusText", {
                value: this.statusText,
                writable: true,
                configurable: true
            });

            Object.defineProperty(this.shadowXhr, "responseURL", {
                value: this._url.toString(),
                writable: true,
                configurable: true
            });
        }

        private syncToShadow() {
            // Sync timeout
            this.shadowXhr.timeout = this.timeout;

            // Sync withCredentials
            this.shadowXhr.withCredentials = this.withCredentials;

            // Sync responseType
            this.shadowXhr.responseType = this.responseType;
        }

        private _getMockBody() {
            if (this._proxy.mock && "body" in this._proxy.mock) {
                return this._proxy.mock.body;
            } else if (
                this._proxy.mock &&
                "generateBody" in this._proxy.mock &&
                this._proxy.mock.generateBody
            ) {
                return this._proxy.mock.generateBody(
                    {
                        body: this._convertedBody,
                        headers: this._headers,
                        method: this._method,
                        query: Object.fromEntries(this._url.searchParams)
                    },
                    () => {
                        try {
                            return JSON.parse(this._convertedBody);
                        } catch {
                            lineCalled(CallLineEnum.n000010);

                            return this._convertedBody;
                        }
                    }
                );
            }

            return undefined;
        }

        private _onResponse = (callback: VoidFunction) => {
            try {
                this._proxy.done(
                    this,
                    callback,
                    Boolean(
                        this._mockBody ||
                        this._proxy.mock?.headers ||
                        this._proxy.mock?.statusCode ||
                        this._proxy.mock?.statusText
                    )
                );
            } catch {
                lineCalled(CallLineEnum.n000011);
                callback();
            }
        };

        addEventListener<K extends keyof XMLHttpRequestEventMap>(
            type: K,
            listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => unknown,
            options?: boolean | AddEventListenerOptions
        ) {
            let proxyListener = listener;

            if (
                type === "load" ||
                type === "loadend" ||
                type === "readystatechange" ||
                type === "progress"
            ) {
                proxyListener = (...args) => {
                    const originalEvent = args[0] as Event;

                    if (this.readyState === XMLHttpRequest.DONE) {
                        this._onResponse(() => {
                            // Execute on shadow XMLHttpRequest instead of this
                            this.simulateResponseOnShadow();

                            // Create a new event object to avoid "already being dispatched" error
                            const newEvent =
                                type === "load" || type === "loadend"
                                    ? this.createProgressEvent(type, originalEvent)
                                    : new win.Event("readystatechange", {
                                          bubbles: originalEvent.bubbles,
                                          cancelable: originalEvent.cancelable
                                      });

                            this.shadowXhr.dispatchEvent(newEvent);
                        });
                    } else {
                        // For non-DONE states, execute on shadow XMLHttpRequest
                        Object.defineProperty(this.shadowXhr, "readyState", {
                            value: this.readyState,
                            writable: true,
                            configurable: true
                        });

                        // Create a new event object to avoid "already being dispatched" error
                        const newEvent =
                            type === "load" || type === "loadend"
                                ? this.createProgressEvent(type, originalEvent)
                                : new win.Event("readystatechange", {
                                      bubbles: originalEvent.bubbles,
                                      cancelable: originalEvent.cancelable
                                  });

                        this.shadowXhr.dispatchEvent(newEvent);
                    }
                };
            } else if (type === "loadstart") {
                proxyListener = (...args) => {
                    const originalEvent = args[0] as Event;
                    // loadstart happens at the beginning, so no need to wait for response
                    const newEvent = this.createProgressEvent("loadstart", originalEvent);

                    this.shadowXhr.dispatchEvent(newEvent);
                };
            } else {
                // For other events, execute on shadow XMLHttpRequest
                proxyListener = (...args) => {
                    const originalEvent = args[0] as ProgressEvent<EventTarget>;
                    const newEvent = this.createEvent(originalEvent.type, originalEvent);

                    this.shadowXhr.dispatchEvent(newEvent);
                };
            }

            super.addEventListener(type, proxyListener, options);
            this.shadowXhr.addEventListener(type, listener, options);
        }

        getAllResponseHeaders() {
            if (this._proxy.mock?.headers) {
                return Object.entries(this._proxy.mock.headers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\r\n");
            }

            return super.getAllResponseHeaders();
        }

        open(...args: [method: string, url: string | URL]) {
            this._method = args[0];
            this._url = typeof args[1] === "string" ? new URL(args[1], win.location.href) : args[1];

            // Also open on shadow XMLHttpRequest with same parameters
            this.shadowXhr.open(...args);

            return super.open(...args);
        }

        send(body?: Document | XMLHttpRequestBodyInit | null) {
            // Sync properties to shadow before sending
            this.syncToShadow();

            requestProxy
                .requestStart(
                    {
                        body,
                        headers: this._headers,
                        method: this._method,
                        url: this._url
                    },
                    win,
                    "xhr"
                )
                .then((proxy) => {
                    this._mockBody = Boolean(proxy.mock?.body || proxy.mock?.generateBody);
                    this._proxy = proxy;

                    if (!proxy || !this._mockBody) {
                        return super.send(body);
                    }

                    convertInputBodyToString(body, win)
                        .then((convertedBody) => {
                            this._convertedBody = convertedBody;

                            if (proxy.mock?.allowHitTheNetwork) {
                                return super.send(body);
                            } else {
                                try {
                                    return proxy.done(
                                        this,
                                        () => {
                                            this.dispatchEvent(
                                                new win.ProgressEvent("readystatechange")
                                            );
                                            this.dispatchEvent(new win.ProgressEvent("load"));
                                            this.dispatchEvent(new win.ProgressEvent("loadend"));
                                        },
                                        true
                                    );
                                } catch {
                                    lineCalled(CallLineEnum.n000018);

                                    return super.send(body);
                                }
                            }
                        })
                        .catch(() => {
                            lineCalled(CallLineEnum.n000019);

                            try {
                                this._proxy.error(new Error("convertInputBodyToString"));
                            } catch {
                                lineCalled(CallLineEnum.n000020);
                            }

                            return super.send(body);
                        });
                })
                .catch(() => {
                    lineCalled(CallLineEnum.n000021);

                    return super.send(body);
                });

            // DO NOT call this.shadowXhr.send(body) - key requirement
        }

        setRequestHeader(name: string, value: string) {
            this._headers[name] = value;

            // Also set on shadow XMLHttpRequest
            this.shadowXhr.setRequestHeader(name, value);

            super.setRequestHeader(name, value);
        }

        // Getters (alphabetically sorted)
        get readyState() {
            return this._mockBody && !this._proxy.mock?.allowHitTheNetwork
                ? XMLHttpRequest.DONE
                : super.readyState;
        }

        get response() {
            const mockBody = this._getMockBody();

            return mockBody
                ? typeof mockBody === "object"
                    ? this.responseType === "json"
                        ? mockBody
                        : JSON.stringify(mockBody)
                    : String(mockBody)
                : super.response;
        }

        get responseText() {
            // Check if responseType allows access to responseText
            const currentResponseType = this.responseType || "";

            if (currentResponseType !== "" && currentResponseType !== "text") {
                throw new win.DOMException(
                    `Failed to read the 'responseText' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'text' (was '${currentResponseType}').`,
                    "InvalidStateError"
                );
            }

            const mockBody = this._getMockBody();

            return mockBody
                ? typeof mockBody === "object"
                    ? JSON.stringify(mockBody)
                    : String(mockBody)
                : super.responseText;
        }

        get status() {
            const mock = this._proxy.mock;

            return mock?.statusCode ?? (mock && !super.status ? 200 : super.status);
        }

        get statusText() {
            const mock = this._proxy.mock;

            return mock?.statusText ?? (mock && !super.statusText ? "OK" : super.statusText);
        }

        // Setters (alphabetically sorted)
        set onabort(value: (ev: ProgressEvent<EventTarget>) => unknown) {
            super.onabort = (ev) => {
                this.handleError(new Error("AbortError"), CallLineEnum.n000016);

                // Execute on shadow XMLHttpRequest instead of this
                this.shadowXhr.onabort = value;

                if (typeof value === "function") {
                    this.simulateResponseOnShadow();
                    this.shadowXhr.dispatchEvent(this.createProgressEvent("abort", ev));
                }
            };
        }

        set onerror(value: (ev: ProgressEvent<EventTarget>) => unknown) {
            super.onerror = (ev) => {
                this.handleError(new Error(ev.type), CallLineEnum.n000017);

                // Execute on shadow XMLHttpRequest instead of this
                this.shadowXhr.onerror = value;

                if (typeof value === "function") {
                    this.shadowXhr.dispatchEvent(this.createProgressEvent("error", ev));
                }
            };
        }

        set onload(value: (this: XMLHttpRequest, ev: Event) => unknown) {
            super.onload = (ev) => {
                this._onResponse(() => {
                    // Execute on shadow XMLHttpRequest instead of this
                    this.shadowXhr.onload = value;

                    if (typeof value === "function") {
                        this.simulateResponseOnShadow();
                        this.shadowXhr.dispatchEvent(this.createProgressEvent("load", ev));
                    }
                });
            };
        }

        set onloadend(value: (this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) {
            super.onloadend = (ev) => {
                this._onResponse(() => {
                    // Execute on shadow XMLHttpRequest instead of this
                    this.shadowXhr.onloadend = value;

                    if (typeof value === "function") {
                        this.simulateResponseOnShadow();
                        this.shadowXhr.dispatchEvent(this.createProgressEvent("loadend", ev));
                    }
                });
            };
        }

        set onloadstart(value: (this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) {
            super.onloadstart = (ev) => {
                // Execute on shadow XMLHttpRequest instead of this
                this.shadowXhr.onloadstart = value;

                if (typeof value === "function") {
                    this.shadowXhr.dispatchEvent(this.createProgressEvent("loadstart", ev));
                }
            };
        }

        set onprogress(value: (this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) {
            // For progress events, set the handler directly on the real xhr
            // Progress events should flow naturally from the real xhr that's making the request
            super.onprogress = value;
        }

        set onreadystatechange(value: (this: XMLHttpRequest, ev: Event) => unknown) {
            super.onreadystatechange = (ev) => {
                Object.defineProperty(this.shadowXhr, "readyState", {
                    value: this.readyState,
                    writable: true,
                    configurable: true
                });

                if (this.readyState === XMLHttpRequest.DONE) {
                    this._onResponse(() => {
                        // Execute on shadow XMLHttpRequest instead of this
                        if (typeof value === "function") {
                            this.simulateResponseOnShadow();
                            this.shadowXhr.onreadystatechange = value;
                            this.shadowXhr.dispatchEvent(
                                new win.Event("readystatechange", {
                                    bubbles: ev.bubbles,
                                    cancelable: ev.cancelable
                                })
                            );
                        }
                    });
                } else {
                    // For non-DONE states, still execute on shadow XMLHttpRequest
                    if (typeof value === "function") {
                        this.shadowXhr.onreadystatechange = value;
                        this.shadowXhr.dispatchEvent(
                            new win.Event("readystatechange", {
                                bubbles: ev.bubbles,
                                cancelable: ev.cancelable
                            })
                        );
                    }
                }
            };
        }

        set ontimeout(value: (this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) {
            super.ontimeout = (ev) => {
                this.handleError(new Error("TimeoutError"), CallLineEnum.n000022);

                // Execute on shadow XMLHttpRequest instead of this
                this.shadowXhr.ontimeout = value;

                if (typeof value === "function") {
                    this.simulateResponseOnShadow();
                    this.shadowXhr.dispatchEvent(this.createProgressEvent("timeout", ev));
                }
            };
        }
    }

    win.XMLHttpRequest = XMLHttpRequestProxy;
};
