import { convertInputBodyToString } from "../convert/convert";
import { WindowTypeOfRequestProxy } from "../Interceptor.types";
import { lineCalled } from "../test.unit";
import { emptyProxy, RequestProxy } from "./RequestProxy";
import { CallLineEnum } from "./test.enum";

export const createFetchProxy = (win: WindowTypeOfRequestProxy, requestProxy: RequestProxy) => {
    if (win.originFetch === undefined) {
        win.originFetch = win.fetch;
    }

    win.fetch = async (input: RequestInfo | URL, init: RequestInit | undefined = {}) => {
        const inputUrl =
            typeof input === "object" && !(input instanceof win.URL || input instanceof URL)
                ? input.url
                : input;
        const url =
            typeof inputUrl === "string" ? new win.URL(inputUrl, win.location.href) : inputUrl;

        if (input instanceof win.Request || input instanceof Request) {
            init.body = input.body;
            init.method = input.method;
            init.headers = input.headers;
        }

        const headers = Object.fromEntries(new Headers(init.headers).entries());

        const proxy = await requestProxy
            .requestStart(
                {
                    body: init.body,
                    headers,
                    method: init.method ?? "GET",
                    url
                },
                win,
                "fetch"
            )
            .catch(() => {
                lineCalled(CallLineEnum.n000001);

                return emptyProxy;
            });

        return new Promise((resolve, reject) => {
            const mock = proxy.mock;

            const hasResponseBodyMock = !(!mock?.body && !mock?.generateBody);

            const mockResponse = (responseText = "") => {
                convertInputBodyToString(init.body, win)
                    .then((convertedBody) => {
                        const body =
                            mock!.generateBody?.(
                                {
                                    body: convertedBody,
                                    headers,
                                    method: init.method ?? "GET",
                                    query: Object.fromEntries(url.searchParams)
                                },
                                () => {
                                    try {
                                        return JSON.parse(convertedBody);
                                    } catch {
                                        lineCalled(CallLineEnum.n000004);

                                        return convertedBody;
                                    }
                                }
                            ) ??
                            mock!.body ??
                            responseText;

                        const isObject = typeof body === "object";

                        const headersWithMock = { ...headers, ...mock!.headers };

                        if (
                            isObject &&
                            !Object.keys(headersWithMock).some(
                                (key) => key.toLowerCase() === "content-type"
                            )
                        ) {
                            headersWithMock["Content-Type"] = "application/json";
                        }

                        const response = new Response(
                            isObject ? JSON.stringify(body) : String(body),
                            {
                                headers: headersWithMock,
                                status: mock!.statusCode ?? 200,
                                statusText: mock!.statusText ?? "OK"
                            }
                        );

                        return proxy.done(response, () => resolve(response), true);
                    })
                    .catch((error) => {
                        lineCalled(CallLineEnum.n000002);

                        try {
                            proxy.error(error);
                        } catch {
                            lineCalled(CallLineEnum.n000003);
                        }

                        reject(error);
                    });
            };

            if (hasResponseBodyMock && !mock.allowHitTheNetwork) {
                return mockResponse();
            }

            win.originFetch!(input, init)
                .then((response) => {
                    // mock only headers or status
                    if (
                        hasResponseBodyMock ||
                        mock?.headers ||
                        mock?.statusCode ||
                        mock?.statusText
                    ) {
                        response
                            .text()
                            .then((responseText) => {
                                mockResponse(responseText);
                            })
                            .catch((error) => {
                                lineCalled(CallLineEnum.n000005);

                                try {
                                    proxy.error(error);
                                } catch {
                                    lineCalled(CallLineEnum.n000006);
                                }

                                resolve(response);
                            });
                    } else if (proxy) {
                        try {
                            proxy.done(response, () => resolve(response));
                        } catch {
                            lineCalled(CallLineEnum.n000007);
                            resolve(response);
                        }
                    } else {
                        resolve(response);
                    }
                })
                .catch((error) => {
                    lineCalled(CallLineEnum.n000008);

                    try {
                        proxy.error(error);
                    } catch {
                        lineCalled(CallLineEnum.n000009);
                    }

                    reject(error);
                });
        });
    };
};
