import { emptyProxy, RequestProxy, RequestProxyFunctionResult } from "./RequestProxy";
import { convertToString } from "./utils";

export const createRequestProxy = (requestProxy: RequestProxy) => {
    const listener = (
        win: Cypress.AUTWindow & {
            originFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
            originXMLHttpRequest: typeof XMLHttpRequest;
        }
    ) => {
        requestProxy.onCreate?.();

        if (win.originFetch === undefined) {
            win.originFetch = win.fetch;
        }

        win.fetch = async (input: RequestInfo | URL, init: RequestInit | undefined = {}) => {
            const inputUrl =
                typeof input === "object" && !(input instanceof win.URL) ? input.url : input;
            const url =
                typeof inputUrl === "string" ? new win.URL(inputUrl, win.location.href) : inputUrl;

            if (input instanceof win.Request) {
                init.body = input.body;
                init.method = input.method;
                init.headers = input.headers;
            }

            const headers = Object.fromEntries(new Headers(init.headers).entries());

            const proxy = await requestProxy.requestStart(
                {
                    body: init.body,
                    headers,
                    method: init.method ?? "GET",
                    url
                },
                win,
                "fetch"
            );

            return new Promise((resolve, reject) => {
                const mock = proxy.mock;

                if (!mock?.body && !mock?.generateBody) {
                    win.originFetch(input, init)
                        .then((response) => {
                            // mock only headers or status
                            if (mock?.headers || mock?.statusCode || mock?.statusText) {
                                response
                                    .text()
                                    .then((responseText) => {
                                        const headersWithMock = { ...headers, ...mock.headers };

                                        const mockResponse = new Response(responseText, {
                                            headers: headersWithMock,
                                            status: mock?.statusCode ?? response.status,
                                            statusText: mock?.statusText ?? response.statusText
                                        });

                                        proxy.done(mockResponse, () => resolve(mockResponse), true);
                                    })
                                    .catch((error) => {
                                        proxy.error(error);
                                        reject(error);
                                    });
                            } else {
                                proxy.done(response, () => resolve(response));
                            }
                        })
                        .catch((error) => {
                            proxy.error(error);
                            reject(error);
                        });
                    return;
                }

                convertToString(init.body, win)
                    .then((convertedBody) => {
                        const body =
                            mock.generateBody?.({
                                body: convertedBody,
                                headers,
                                method: init.method ?? "GET",
                                query: Object.fromEntries(url.searchParams)
                            }) ?? mock.body;

                        const isObject = typeof body === "object";

                        const headersWithMock = { ...headers, ...mock.headers };

                        if (
                            isObject &&
                            !Object.keys(headersWithMock).some(
                                (key) => key.toLowerCase() === "content-type"
                            )
                        ) {
                            headersWithMock["Content-Type"] = "application/json";
                        }

                        const response = new Response(
                            isObject ? JSON.stringify(body) : body?.toString(),
                            {
                                headers: headersWithMock,
                                status: mock.statusCode ?? 200,
                                statusText: mock.statusText ?? "OK"
                            }
                        );

                        proxy.done(response, () => resolve(response), true);
                    })
                    .catch((error) => {
                        proxy.error(error);
                        reject(error);
                    });
            });
        };

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

            _getMockBody() {
                if (this._proxy.mock && "body" in this._proxy.mock) {
                    return this._proxy.mock.body;
                } else if (
                    this._proxy.mock &&
                    "generateBody" in this._proxy.mock &&
                    this._proxy.mock.generateBody
                ) {
                    return this._proxy.mock.generateBody({
                        body: this._convertedBody,
                        headers: this._headers,
                        method: this._method ?? "GET",
                        query: Object.fromEntries(this._url.searchParams)
                    });
                }

                return undefined;
            }

            _onResponse = (callback: VoidFunction) => {
                if (!this._proxy || this._mockBody) {
                    callback();
                } else {
                    this._proxy.done(
                        this,
                        callback,
                        Boolean(
                            this._proxy.mock?.headers ||
                                this._proxy.mock?.statusCode ||
                                this._proxy.mock?.statusText
                        )
                    );
                }
            };

            get readyState() {
                return this._mockBody ? XMLHttpRequest.DONE : super.readyState;
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

            // catch an aborted request
            set onabort(value: (ev: ProgressEvent<EventTarget>) => unknown) {
                super.onabort = (ev) => {
                    this._proxy.error(new Error("AbortError"));
                    value.bind(this)(ev);
                };
            }

            set onload(value: (this: XMLHttpRequest, ev: Event) => unknown) {
                super.onload = (ev) => {
                    if (this.readyState === XMLHttpRequest.DONE) {
                        this._onResponse(() => value.bind(this)(ev));
                    } else {
                        value.bind(this)(ev);
                    }
                };
            }

            // catch the response
            set onreadystatechange(value: (this: XMLHttpRequest, ev: Event) => unknown) {
                super.onreadystatechange = (ev) => {
                    if (this.readyState === XMLHttpRequest.DONE) {
                        this._onResponse(() => value.bind(this)(ev));
                    } else {
                        value.bind(this)(ev);
                    }
                };
            }

            // catch an error of the request
            set onerror(value: (ev: ProgressEvent<EventTarget>) => unknown) {
                super.onerror = (ev) => {
                    this._proxy.error(new Error("Error"));
                    value.bind(this)(ev);
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

                this.onreadystatechange = () => {
                    //
                };
            }

            addEventListener<K extends keyof XMLHttpRequestEventMap>(
                type: K,
                listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => unknown,
                options?: boolean | AddEventListenerOptions
            ) {
                let proxyListener = listener;

                if (type === "load" || type === "readystatechange") {
                    proxyListener = (...args) => {
                        if (this.readyState === XMLHttpRequest.DONE) {
                            this._onResponse(() => listener.bind(this)(...args));
                        } else {
                            listener.bind(this)(...args);
                        }
                    };
                }

                super.addEventListener(type, proxyListener, options);
            }

            getAllResponseHeaders() {
                if (this._proxy.mock?.headers) {
                    return Object.entries(this._proxy.mock.headers)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join("\r\n");
                }

                return super.getAllResponseHeaders();
            }

            open(...args: [method: string, url: string | URL]): void {
                this._method = args[0];
                this._url =
                    typeof args[1] === "string" ? new URL(args[1], win.location.href) : args[1];

                return super.open(...args);
            }

            send(body?: Document | XMLHttpRequestBodyInit | null) {
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

                        if (proxy && this._mockBody) {
                            convertToString(body, win)
                                .then((convertedBody) => {
                                    this._convertedBody = convertedBody;

                                    proxy.done(
                                        this,
                                        () => {
                                            this.dispatchEvent(
                                                new ProgressEvent("readystatechange")
                                            );
                                            this.dispatchEvent(new ProgressEvent("load"));
                                        },
                                        true
                                    );
                                })
                                .catch(() => {
                                    this.onerror(new ProgressEvent("error"));
                                });
                        } else {
                            super.send(body);
                        }
                    })
                    .catch(() => {
                        this.onerror(new ProgressEvent("error"));
                    });
            }

            setRequestHeader(name: string, value: string) {
                this._headers[name] = value;
                super.setRequestHeader(name, value);
            }
        }

        win.XMLHttpRequest = XMLHttpRequestProxy;
    };

    return listener;
};
