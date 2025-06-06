import "cypress-interceptor/test.unit.commands";

import { ConsoleProxy } from "cypress-interceptor/ConsoleProxy";
import { createConsoleProxy } from "cypress-interceptor/createConsoleProxy";
import { createRequestProxy } from "cypress-interceptor/createRequestProxy";
import { createWebsocketProxy } from "cypress-interceptor/createWebsocketProxy";
import {
    IMockResponse,
    IRequestInit,
    IResourceType,
    WindowTypeOfRequestProxy
} from "cypress-interceptor/Interceptor.types";
import {
    RequestProxy,
    RequestProxyFunction,
    RequestProxyFunctionResult
} from "cypress-interceptor/RequestProxy";
import { CallLineEnum } from "cypress-interceptor/test.enum";
import {
    __CALL_LINE__,
    CallLine,
    CallLineWindowType,
    enableCallLine,
    getCallLine,
    lineCalled,
    lineCalledWithClone
} from "cypress-interceptor/test.unit";
import { deepCopy, removeUndefinedFromObject } from "cypress-interceptor/utils";
import {
    getFileNameFromCurrentTest,
    getFilePath,
    normalizeFileName
} from "cypress-interceptor/utils.cypress";
import { WatchTheConsole } from "cypress-interceptor/WatchTheConsole";
import {
    ConsoleLogType,
    WindowTypeOfConsoleProxy
} from "cypress-interceptor/WatchTheConsole.types";
import { WindowTypeOfWebsocketProxy } from "cypress-interceptor/WebsocketInterceptor.types";
import { WebSocketAction, WebsocketListener } from "cypress-interceptor/websocketListener";
import { SERVER_URL } from "cypress-interceptor-server/src/resources/constants";

import { createXMLHttpRequestTest, XMLHttpRequestLoad } from "../src/utils";

const circularObj: Record<string, unknown> = {};
circularObj.self = circularObj;

const createDeeplyNestedObject = (depth: number) => {
    const result: Record<string, unknown> = { nested: {} };
    let current = result;

    for (let i = depth; i >= 0; i--) {
        const nestedObject: Record<string, unknown> = i === 0 ? { end: "end" } : { nested: {} };
        current.nested = nestedObject;
        current = nestedObject;
    }

    return result;
};

const wait = async (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout));

const url = "http://localhost:3000/test";
const urlBrokenStream = `http://localhost:3000/${SERVER_URL.BrokenStream}`;

let callLine: CallLine;

beforeEach(() => {
    cy.window().then((win) => {
        enableCallLine(win);

        callLine = getCallLine();
        callLine.clean();

        cy.callLineClean();
    });
});

it("ConsoleProxy", () => {
    const proxy = new ConsoleProxy();

    expect(proxy.onLog).to.be.a("function");
    expect(proxy.onLog(ConsoleLogType.Error)).to.be.undefined;
    expect(proxy.win).to.eq(window);

    const customFunction = () => "customFunction";

    proxy.onLog = customFunction;
    expect(proxy.onLog).to.eq(customFunction);
});

it("RequestProxy", async () => {
    const proxy = new RequestProxy();

    expect(proxy.onCreate).to.be.a("function");
    expect(proxy.onCreate()).to.be.undefined;

    const requestStartDefault = await proxy.requestStart(
        {} as IRequestInit,
        window,
        {} as IResourceType
    );

    expect(requestStartDefault).to.have.all.keys("done", "error", "mock");
    expect(requestStartDefault.done).to.be.a("function");
    expect(
        requestStartDefault.done({} as Response, () => {
            //
        })
    ).to.be.undefined;
    expect(requestStartDefault.error).to.be.a("function");
    expect(requestStartDefault.error(new Error())).to.be.undefined;
    expect(requestStartDefault.mock).to.be.undefined;

    const doneResult = "done result";
    const errorResult = "error result";
    const mockResult = "mock result";

    const result = Promise.resolve({
        done: () => doneResult,
        error: () => errorResult,
        mock: mockResult as IMockResponse
    });

    const customFunction: RequestProxyFunction = (
        _request: IRequestInit,
        _win: Cypress.AUTWindow,
        _resourceType: IResourceType
    ) => result;

    proxy.requestProxyFunction = customFunction;

    const requestStartCustom = await proxy.requestStart(
        {} as IRequestInit,
        window,
        {} as IResourceType
    );

    expect(requestStartCustom).to.have.all.keys("done", "error", "mock");
    expect(requestStartCustom.done).to.be.a("function");
    expect(
        requestStartCustom.done({} as Response, () => {
            //
        })
    ).to.eq(doneResult);
    expect(requestStartCustom.error).to.be.a("function");
    expect(requestStartCustom.error(new Error())).to.eq(errorResult);
    expect(requestStartCustom.mock).to.eq(mockResult);
});

it("WatchTheConsole", () => {
    const proxy = new ConsoleProxy();
    const watchTheConsole = new WatchTheConsole(proxy);

    watchTheConsole.setOptions({ cloneConsoleArguments: true });

    const deepObject = createDeeplyNestedObject(999999);

    proxy.onLog(ConsoleLogType.ConsoleLog, deepObject);

    expect(watchTheConsole.log[0].args).to.deep.eq([
        "RangeError: Maximum call stack size exceeded"
    ]);
});

it("getFileNameFromCurrentTest", () => {
    expect(getFileNameFromCurrentTest()).to.eq("coverage.cy.ts (getFileNameFromCurrentTest)");
});

describe("Utils", () => {
    it("deepCopy", () => {
        const arr = [
            1,
            [
                1,
                [1],
                {
                    a: 1,
                    b: [1],
                    c: {
                        a: 1,
                        b: [1, { a: 1 }],
                        c: { a: 1 }
                    }
                }
            ]
        ];
        const obj = {
            a: 1,
            b: [
                1,
                [
                    1,
                    [
                        1,
                        [
                            1,
                            [1],
                            {
                                a: 1,
                                b: [1],
                                c: {
                                    a: 1,
                                    b: [1, { a: 1 }],
                                    c: { a: 1 }
                                }
                            }
                        ]
                    ],
                    {
                        a: 1,
                        b: [1],
                        c: {
                            a: 1,
                            b: [1, { a: 1 }],
                            c: { a: 1 }
                        }
                    }
                ],
                { a: 1 }
            ],
            c: {
                a: 1,
                b: [1, { a: 1 }],
                c: { a: 1 }
            }
        };

        const arrCopy = deepCopy(arr);
        const objCopy = deepCopy(obj);

        const changeValues = (subject: Record<string, unknown> | Array<unknown>) => {
            const entries = Object.entries(subject);

            for (const [key, value] of entries) {
                if (typeof value === "object" && value !== null) {
                    changeValues(value as Record<string, unknown>);
                } else {
                    (subject as Record<string, unknown>)[key] = 2;
                }
            }
        };

        changeValues(arr);
        changeValues(obj);

        expect(arr).to.deep.equal([
            2,
            [
                2,
                [2],
                {
                    a: 2,
                    b: [2],
                    c: {
                        a: 2,
                        b: [2, { a: 2 }],
                        c: { a: 2 }
                    }
                }
            ]
        ]);
        expect(obj).to.deep.equal({
            a: 2,
            b: [
                2,
                [
                    2,
                    [
                        2,
                        [
                            2,
                            [2],
                            {
                                a: 2,
                                b: [2],
                                c: {
                                    a: 2,
                                    b: [2, { a: 2 }],
                                    c: { a: 2 }
                                }
                            }
                        ]
                    ],
                    {
                        a: 2,
                        b: [2],
                        c: {
                            a: 2,
                            b: [2, { a: 2 }],
                            c: { a: 2 }
                        }
                    }
                ],
                { a: 2 }
            ],
            c: {
                a: 2,
                b: [2, { a: 2 }],
                c: { a: 2 }
            }
        });
        expect(arrCopy).to.deep.equal([
            1,
            [
                1,
                [1],
                {
                    a: 1,
                    b: [1],
                    c: {
                        a: 1,
                        b: [1, { a: 1 }],
                        c: { a: 1 }
                    }
                }
            ]
        ]);
        expect(objCopy).to.deep.equal({
            a: 1,
            b: [
                1,
                [
                    1,
                    [
                        1,
                        [
                            1,
                            [1],
                            {
                                a: 1,
                                b: [1],
                                c: {
                                    a: 1,
                                    b: [1, { a: 1 }],
                                    c: { a: 1 }
                                }
                            }
                        ]
                    ],
                    {
                        a: 1,
                        b: [1],
                        c: {
                            a: 1,
                            b: [1, { a: 1 }],
                            c: { a: 1 }
                        }
                    }
                ],
                { a: 1 }
            ],
            c: {
                a: 1,
                b: [1, { a: 1 }],
                c: { a: 1 }
            }
        });
    });

    it("getFileNameFromCurrentTest", () => {
        expect(getFileNameFromCurrentTest()).to.eq(
            "coverage.cy.ts (Utils - getFileNameFromCurrentTest)"
        );
    });

    it("getFilePath", () => {
        expect(getFilePath(undefined, "", "type")).to.eq(
            "coverage.cy.ts (Utils - getFilePath).type.json"
        );
        expect(getFilePath(undefined, "output", "type")).to.eq(
            "output/coverage.cy.ts (Utils - getFilePath).type.json"
        );
        expect(getFilePath(undefined, "output/", "type")).to.eq(
            "output/coverage.cy.ts (Utils - getFilePath).type.json"
        );
        expect(getFilePath("file name", "", "type")).to.eq("file name.type.json");
    });

    it("normalizeFileName", () => {
        expect(
            normalizeFileName(
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-_=+[]{}\\|;:'\",.<>/?`~ ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ ØøÞþßŒœŠšŽžÐðΓΔΘΛΞΠΣΦΨΩαβγδθλξπσφψω АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя عـبـتـثـجـحـخـدـذـرـزـسـشـصـضـطـظـعـغـفـقـكـلـمـنـهـوـي ❤☯☆🐱‍👤"
            )
        ).to.eq("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_-.- -");
    });

    it("removeUndefinedFromObject", () => {
        expect(
            removeUndefinedFromObject({
                a: "a",
                b: 123,
                c: undefined
            })
        ).to.deep.equal({
            a: "a",
            b: 123
        });
    });
});

it("createConsoleProxy", () => {
    const proxy = new ConsoleProxy();

    let logs: [type: ConsoleLogType, ...args: unknown[]][] = [];

    proxy.onLog = (...args) => {
        logs.push(args);
    };

    const consoleProxy = createConsoleProxy(proxy);

    const originConsoleError = window.console.error;
    const originConsoleInfo = window.console.info;
    const originConsoleLog = window.console.log;
    const originConsoleWarn = window.console.warn;

    expect(window.console.error).to.eq(originConsoleError);
    expect(window.console.info).to.eq(originConsoleInfo);
    expect(window.console.log).to.eq(originConsoleLog);
    expect(window.console.warn).to.eq(originConsoleWarn);

    consoleProxy(window as WindowTypeOfConsoleProxy);

    expect(window.console.error).not.to.eq(originConsoleError);
    expect(window.console.info).not.to.eq(originConsoleInfo);
    expect(window.console.log).not.to.eq(originConsoleLog);
    expect(window.console.warn).not.to.eq(originConsoleWarn);

    const consoleErrorText = "Console Error Text";

    logs = [];
    console.error(consoleErrorText);

    expect(logs).to.have.length(1);
    expect(logs).to.deep.eq([[ConsoleLogType.ConsoleError, consoleErrorText]]);

    const consoleInfoText = "Console Info Text";

    logs = [];
    console.info(consoleInfoText);

    expect(logs).to.have.length(1);
    expect(logs).to.deep.eq([[ConsoleLogType.ConsoleInfo, consoleInfoText]]);

    const consoleLogText = "Console Log Text";

    logs = [];
    console.log(consoleLogText);

    expect(logs).to.have.length(1);
    expect(logs).to.deep.eq([[ConsoleLogType.ConsoleLog, consoleLogText]]);

    const consoleLogWarn = "Console Warn Text";

    logs = [];
    console.warn(consoleLogWarn);

    expect(logs).to.have.length(1);
    expect(logs).to.deep.eq([[ConsoleLogType.ConsoleWarn, consoleLogWarn]]);

    const javaScriptError = "Console Warn Text";

    logs = [];
    window.dispatchEvent(new ErrorEvent("error", { message: javaScriptError }));

    expect(logs).to.have.length(1);
    expect(logs[0][0]).to.deep.eq(ConsoleLogType.Error);
    expect((logs[0][1] as Error).message).to.deep.eq(javaScriptError);
});

describe("createRequestProxy - fetch - without Interceptor", () => {
    let proxy: RequestProxy;

    beforeEach(() => {
        proxy = new RequestProxy();

        const requestProxy = createRequestProxy(proxy);

        const originFetch = window.fetch;

        expect(originFetch).to.eq(window.fetch);

        requestProxy(window as WindowTypeOfRequestProxy);

        expect(originFetch).not.to.eq(window.fetch);
    });

    describe("Without proxy", () => {
        it("Should return the correct response", async () => {
            const request = await fetch(new URL(url), {
                headers: { "Content-Type": "application/json" }
            });

            expect(await request.json()).to.deep.eq({});
            expect(callLine.length).to.eq(0);
        });

        it("Should fail when reading text from a broken strem", async () => {
            const request = await fetch(urlBrokenStream);

            let error: unknown;

            try {
                await request.text();
            } catch (e) {
                error = e;
                expect(e).to.exist;
            }

            expect(error).not.to.be.undefined;
            expect(callLine.length).to.eq(0);
        });

        it("Should fail with the correct error message when cancelled", async () => {
            let error: Error | undefined;

            const controller = new AbortController();

            fetch(new URL(url + "?duration=2000"), {
                headers: { "Content-Type": "application/json" },
                signal: controller.signal
            })
                .then(() => {
                    //
                })
                .catch((e) => {
                    error = e;
                });

            setTimeout(() => {
                controller.abort();
            }, 100);

            await wait(1000);

            expect(error).not.to.be.undefined;
            expect(error!.name).to.eq("AbortError");
            expect(callLine.length).to.eq(1);
            expect(callLine.next).to.eq(CallLineEnum.n000008);
        });
    });

    it("Should mock the correct JSON body", async () => {
        const responseBody = {
            something: 123
        };

        proxy.requestProxyFunction = async () => ({
            done: (_response, resolve) => resolve(),
            error: () => {
                //
            },
            mock: {
                generateBody: () => responseBody
            }
        });

        const request = await fetch(url);

        expect(await request.json()).to.deep.eq(responseBody);
        expect(callLine.length).to.eq(0);
    });

    it("Shold mock an incorrect JSON body", async () => {
        const responseBody = "something: 123 };";

        proxy.requestProxyFunction = async () => ({
            done: (_response, resolve) => resolve(),
            error: () => {
                //
            },
            mock: {
                generateBody: () => responseBody
            }
        });

        const request = await fetch(url);

        expect(await request.text()).to.deep.eq(responseBody);
        expect(callLine.length).to.eq(0);
    });

    it("Should work when an error in `requestProxyFunction`", async () => {
        proxy.requestProxyFunction = async () => {
            throw "Error";
        };

        const request = await fetch(url, {
            headers: { "Content-Type": "application/json" }
        });

        expect(await request.json()).to.deep.eq({});
        expect(callLine.length).to.eq(1);
        expect(callLine.next).to.eq(CallLineEnum.n000001);
    });

    it("Should work when an error in `done`", async () => {
        proxy.requestProxyFunction = async () => ({
            done: () => {
                throw "Error";
            },
            error: () => {
                //
            },
            mock: undefined
        });

        const request = await fetch(url, {
            headers: { "Content-Type": "application/json" }
        });

        expect(await request.json()).to.deep.eq({});
        expect(callLine.length).to.eq(1);
        expect(callLine.next).to.eq(CallLineEnum.n000007);
    });

    it("Should work when an error in `error` but never triggered", async () => {
        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(() => {
                throw "Error";
            }),
            mock: undefined
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        const request = await fetch(url, {
            headers: { "Content-Type": "application/json" }
        });

        expect(await request.json()).to.deep.eq({});
        expect(requestProxyFunctionObject.error).not.to.be.called;
        expect(callLine.length).to.eq(0);
    });

    it("Should fail the request when an error in `error` and triggered by `generateBody`", async () => {
        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(() => {
                throw "Error";
            }),
            mock: {
                allowHitTheNetwork: true,
                generateBody: () => {
                    throw "Error";
                }
            }
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        let error: unknown;

        try {
            await fetch(url, {
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) {
            error = e;
        }

        expect(error).not.to.be.undefined;
        expect(requestProxyFunctionObject.error).to.be.called;
        expect(callLine.length).to.eq(2);
        expect(callLine.next).to.eq(CallLineEnum.n000002);
        expect(callLine.next).to.eq(CallLineEnum.n000003);
    });

    it("Should work when an error in `error` triggered by broken stream", async () => {
        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(() => {
                throw "Error";
            }),
            mock: {
                headers: {
                    "custom-header": "value"
                }
            }
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        let error: unknown;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        const request = await fetch(urlBrokenStream);

        try {
            await request.text();
        } catch (e) {
            error = e;
            expect(e).to.exist;
        }

        expect(error).not.to.be.undefined;
        expect(requestProxyFunctionObject.error).to.be.called;
        expect(callLine.length).to.eq(2);
        expect(callLine.next).to.eq(CallLineEnum.n000005);
        expect(callLine.next).to.eq(CallLineEnum.n000006);
    });

    it("Should return the correct cancelled message when an error in `error` and the request is canceled", async () => {
        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(() => {
                throw "Error";
            }),
            mock: undefined
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        let error: Error | undefined;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        const controller = new AbortController();

        fetch(new URL(url + "?duration=2000"), {
            headers: { "Content-Type": "application/json" },
            signal: controller.signal
        })
            .then(() => {
                //
            })
            .catch((e) => {
                error = e;
            });

        setTimeout(() => {
            controller.abort();
        }, 100);

        await wait(1000);

        expect(error).not.to.be.undefined;
        expect(error!.name).to.eq("AbortError");
        expect(requestProxyFunctionObject.error).to.be.called;
        expect(callLine.length).to.eq(2);
        expect(callLine.next).to.eq(CallLineEnum.n000008);
        expect(callLine.next).to.eq(CallLineEnum.n000009);
    });

    it("Should fail when reading `text` or `json` of the original `fetch` return when an error in stream and mock provided", async () => {
        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(),
            mock: {
                headers: {
                    "custom-header": "value"
                }
            }
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        let error: unknown;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        const request = await fetch(urlBrokenStream);

        try {
            await request.text();
        } catch (e) {
            error = e;
            expect(e).to.exist;
        }

        // be sure that `catch` above has been called
        expect(error).not.to.be.undefined;
        expect(requestProxyFunctionObject.error).to.be.called;
        expect(callLine.length).to.eq(1);
        expect(callLine.next).to.eq(CallLineEnum.n000005);
    });

    it("Should fail when reading `text` or `json` of the original `fetch` return when an error in stream and mock not provided", async () => {
        proxy.requestProxyFunction = async () => ({
            done: (_response, resolve) => resolve(),
            error: () => {
                //
            },
            mock: undefined
        });

        let error: unknown;

        const request = await fetch(urlBrokenStream);

        try {
            await request.text();
        } catch (e) {
            error = e;
            expect(e).to.exist;
        }

        // be sure that `catch` above has been called
        expect(error).not.to.be.undefined;
        expect(callLine.length).to.eq(0);
    });

    it("Should fail in `fetch` when an error in `generateBody` and `allowHitTheNetwork` set to `false``", async () => {
        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(),
            mock: {
                generateBody: () => {
                    throw "Error";
                }
            }
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        let error: unknown;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        try {
            await fetch(url);
        } catch (e) {
            error = e;
        }

        expect(error).not.to.be.undefined;
        expect(requestProxyFunctionObject.error).to.be.called;
        expect(callLine.length).to.eq(1);
        expect(callLine.next).to.eq(CallLineEnum.n000002);
    });

    it("Should fail in `fetch` when an error in `generateBody` and `allowHitTheNetwork` set to `true`", async () => {
        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(),
            mock: {
                allowHitTheNetwork: true,
                generateBody: () => {
                    throw "Error";
                }
            }
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        let error: unknown;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        try {
            await fetch(url);
        } catch (e) {
            error = e;
        }

        expect(error).not.to.be.undefined;
        expect(requestProxyFunctionObject.error).to.be.called;
        expect(callLine.length).to.eq(1);
        expect(callLine.next).to.eq(CallLineEnum.n000002);
    });

    it("Should fail during stringify the input body", async () => {
        const responseBody = {
            thing: 222
        };

        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(() => {
                throw "Error";
            }),
            mock: {
                body: responseBody
            }
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        let error: unknown;

        try {
            await fetch(url, {
                body: circularObj as unknown as BodyInit,
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) {
            error = e;
        }

        expect(error).not.to.be.undefined;
        expect(requestProxyFunctionObject.error).to.be.called;
        expect(callLine.length).to.eq(2);
        expect(callLine.next).to.eq(CallLineEnum.n000002);
        expect(callLine.next).to.eq(CallLineEnum.n000003);
    });

    it("Should fail during calling `getJsonRequestBody` but return a correct mocked resposne body", async () => {
        const responseBody = {
            thing: 222
        };

        const requestProxyFunctionObject: RequestProxyFunctionResult = {
            done: (_response, resolve) => resolve(),
            error: cy.spy(() => {
                throw "Error";
            }),
            mock: {
                generateBody: (_, getJsonRequestBody) => {
                    getJsonRequestBody();

                    return responseBody;
                }
            }
        };

        proxy.requestProxyFunction = async () => requestProxyFunctionObject;

        expect(requestProxyFunctionObject.error).not.to.be.called;

        const request = await fetch(url, {
            body: "'er':}" as unknown as BodyInit,
            headers: { "Content-Type": "application/json" }
        });

        expect(await request.json()).to.be.deep.eq(responseBody);
        expect(requestProxyFunctionObject.error).not.to.be.called;
        expect(callLine.length).to.be.eq(1);
        expect(callLine.next).to.eq(CallLineEnum.n000004);
    });
});

describe("createRequestProxy - xhr - without the Interceptor", () => {
    let proxy: RequestProxy;

    beforeEach(() => {
        proxy = new RequestProxy();

        const requestProxy = createRequestProxy(proxy);

        const originXMLHttpRequest = window.XMLHttpRequest;

        expect(originXMLHttpRequest).to.eq(window.XMLHttpRequest);

        requestProxy(window as WindowTypeOfRequestProxy);

        expect(originXMLHttpRequest).not.to.eq(window.XMLHttpRequest);
    });

    describe("Without proxy", () => {
        createXMLHttpRequestTest("Should return the correct response", async (onResponse) => {
            const request = new XMLHttpRequest();

            request.open("GET", url);
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            await new Promise((resolve) => {
                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 500);
                });

                request.send();
            }).then(() => {
                expect(request.response).to.deep.eq({});
                expect(callLine.length).to.eq(0);
            });
        });

        it("Should call `onreadystatechange` between states", async () => {
            const request = new XMLHttpRequest();

            request.open("GET", new URL(url));
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            let betweenStateCalledCount = 0;
            let loadCalled = false;

            await new Promise((resolve) => {
                request.onreadystatechange = () => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        // a delay for other methods to be called before the next step
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    } else {
                        betweenStateCalledCount++;
                    }
                };

                request.onload = () => {
                    loadCalled = true;
                };

                request.send();
            }).then(() => {
                expect(request.response).to.deep.eq({});
                expect(betweenStateCalledCount).to.be.above(0);
                expect(loadCalled).to.be.true;
                expect(callLine.length).to.eq(0);
            });
        });

        createXMLHttpRequestTest(
            "Should fail when reading text from a broken strem",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                let onerror: unknown;

                request.open("GET", urlBrokenStream);

                await new Promise((resolve) => {
                    request.onerror = function (ev) {
                        onerror = ev.type;
                    };

                    onResponse(request, () => {
                        // a delay for `onerror` to be called
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                }).then(() => {
                    expect(onerror).not.to.be.undefined;
                    expect(callLine.length).to.eq(0);
                });
            },
            [
                XMLHttpRequestLoad.AddEventListener_Readystatechange,
                XMLHttpRequestLoad.Onreadystatechange
            ]
        );

        createXMLHttpRequestTest(
            "Should fail with the correct error message when cancelled",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                let onabort: unknown;
                let onerror: unknown;

                request.open("GET", url + "?duration=2000");
                request.responseType = "json";
                request.setRequestHeader("Content-Type", "application/json");

                new Promise((resolve) => {
                    request.onabort = (ev) => {
                        onabort = ev.type;
                    };

                    request.onerror = function (ev) {
                        onerror = ev.type;
                    };

                    onResponse(request, () => {
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                });

                setTimeout(() => {
                    request.abort();
                }, 100);

                await wait(1000);

                expect(onabort).not.to.be.undefined;
                expect(onabort).to.eq("abort");
                expect(onerror).to.be.undefined;
                expect(callLine.length).to.eq(0);
            }
        );

        createXMLHttpRequestTest(
            "Should work when passing null - without error",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                request.open("GET", url);
                request.responseType = "json";
                request.setRequestHeader("Content-Type", "application/json");

                request.onabort = null;
                request.onerror = null;
                request.onload = null;
                request.onloadstart = null;
                request.onprogress = null;
                request.onreadystatechange = null;
                request.ontimeout = null;

                await new Promise((resolve) => {
                    onResponse(request, () => {
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                }).then(() => {
                    expect(request.response).to.deep.eq({});
                    expect(callLine.length).to.eq(0);
                });
            }
        );

        createXMLHttpRequestTest(
            "Should work when passing null - with error",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                request.open("GET", urlBrokenStream);

                request.onabort = null;
                request.onerror = null;
                request.onload = null;
                request.onloadstart = null;
                request.onprogress = null;
                request.onreadystatechange = null;
                request.ontimeout = null;

                await new Promise((resolve) => {
                    onResponse(request, () => {
                        // a delay for `onerror` to be called
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                }).then(() => {
                    expect(callLine.length).to.eq(0);
                });
            },
            [
                XMLHttpRequestLoad.AddEventListener_Readystatechange,
                XMLHttpRequestLoad.Onreadystatechange
            ]
        );
    });

    createXMLHttpRequestTest("Should mock the correct JSON body", async (onResponse) => {
        const responseBody1 = {
            something: 345
        };

        proxy.requestProxyFunction = async () => ({
            done: (_response, resolve) => resolve(),
            error: () => {
                //
            },
            mock: {
                body: responseBody1
            }
        });

        const request = new XMLHttpRequest();

        request.open("GET", url);
        request.responseType = "json";
        request.setRequestHeader("Content-Type", "application/json");

        await new Promise((resolve) => {
            onResponse(request, () => resolve(null));

            request.send();
        }).then(() => {
            expect(request.response).to.deep.eq(responseBody1);
            expect(callLine.length).to.eq(0);
        });
    });

    createXMLHttpRequestTest("Should mock an incorrect JSON body", async (onResponse) => {
        const responseBody = "something: 345 };";

        proxy.requestProxyFunction = async () => ({
            done: (_response, resolve) => resolve(),
            error: () => {
                //
            },
            mock: {
                body: responseBody
            }
        });

        const request = new XMLHttpRequest();

        request.open("GET", url);
        request.responseType = "json";
        request.setRequestHeader("Content-Type", "application/json");

        await new Promise((resolve) => {
            onResponse(request, () => resolve(null));

            request.send();
        }).then(() => {
            expect(request.response).to.deep.eq(responseBody);
            expect(callLine.length).to.eq(0);
        });
    });

    createXMLHttpRequestTest(
        "Should work when an error in `requestProxyFunction`",
        async (onResponse) => {
            proxy.requestProxyFunction = async () => {
                throw "Error";
            };

            const request = new XMLHttpRequest();

            request.open("GET", url);
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            await new Promise((resolve) => {
                onResponse(request, () => resolve(null));

                request.send();
            }).then(() => {
                expect(request.response).to.deep.eq({});
                expect(callLine.length).to.eq(1);
                expect(callLine.next).to.eq(CallLineEnum.n000021);
            });
        }
    );

    createXMLHttpRequestTest("Should work when an error in `done`", async (onResponse) => {
        proxy.requestProxyFunction = async () => ({
            done: () => {
                throw "Error";
            },
            error: () => {
                //
            },
            mock: undefined
        });

        const request = new XMLHttpRequest();

        request.open("GET", url);
        request.responseType = "json";
        request.setRequestHeader("Content-Type", "application/json");

        await new Promise((resolve) => {
            onResponse(request, () => resolve(null));

            request.send();
        }).then(() => {
            expect(request.response).to.deep.eq({});
            // when `onload` and `addEventListener` provided, there is an extra call
            // which is optimized in proxy.done, but the proxy.error can be called twice
            expect(callLine.length).to.above(0);
            expect(callLine.next).to.eq(CallLineEnum.n000011);
        });
    });

    createXMLHttpRequestTest(
        "Should work when an error in `error` but never triggered",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(() => {
                    throw "Error";
                }),
                mock: undefined
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            expect(requestProxyFunctionObject.error).not.to.be.called;

            const request = new XMLHttpRequest();

            request.open("GET", url);
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            await new Promise((resolve) => {
                onResponse(request, () => resolve(null));

                request.send();
            }).then(() => {
                expect(request.response).to.deep.eq({});
                expect(requestProxyFunctionObject.error).not.to.be.called;
                expect(callLine.length).to.eq(0);
            });
        }
    );

    createXMLHttpRequestTest(
        "Should fail when reading `responseText` and an error in `error` and triggered by `generateBody`",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(() => {
                    throw "Error";
                }),
                mock: {
                    allowHitTheNetwork: true,
                    generateBody: () => {
                        throw "Error";
                    }
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            expect(requestProxyFunctionObject.error).not.to.be.called;

            const request = new XMLHttpRequest();

            request.open("GET", url);
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            await new Promise((resolve) => {
                onResponse(request, () => resolve(null));

                request.send();
            }).then(() => {
                let error: unknown;

                try {
                    request.response;
                } catch (e) {
                    error = e;
                }

                expect(error).not.to.be.undefined;
                expect(requestProxyFunctionObject.error).not.to.be.called;
                expect(callLine.length).to.eq(0);
            });
        }
    );

    createXMLHttpRequestTest(
        "Should fail when reading `responseText` and an error in `error` and triggered by `generateBody`",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(() => {
                    throw "Error";
                }),
                mock: {
                    allowHitTheNetwork: true,
                    generateBody: () => {
                        throw "Error";
                    }
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            expect(requestProxyFunctionObject.error).not.to.be.called;

            const request = new XMLHttpRequest();

            request.open("GET", url);
            request.setRequestHeader("Content-Type", "application/json");

            await new Promise((resolve) => {
                onResponse(request, () => resolve(null));

                request.send();
            }).then(() => {
                let error: unknown;

                try {
                    request.responseText;
                } catch (e) {
                    error = e;
                }

                expect(error).not.to.be.undefined;
                expect(requestProxyFunctionObject.error).not.to.be.called;
                expect(callLine.length).to.eq(0);
            });
        }
    );

    createXMLHttpRequestTest(
        "Should work when an error in `error` triggered by broken stream",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(() => {
                    throw "Error";
                }),
                mock: {
                    headers: {
                        "custom-header": "value"
                    }
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            expect(requestProxyFunctionObject.error).not.to.be.called;

            const request = new XMLHttpRequest();

            let onerror: unknown;

            request.open("GET", urlBrokenStream);

            await new Promise((resolve) => {
                request.onerror = function (ev) {
                    onerror = ev.type;
                };

                onResponse(request, () => {
                    // a delay for `onerror` to be called
                    setTimeout(() => {
                        resolve(null);
                    }, 500);
                });
                request.send();
            });

            expect(onerror).not.to.be.undefined;
            expect(callLine.length).to.eq(1);
            expect(callLine.next).to.eq(CallLineEnum.n000017);
        },
        [
            XMLHttpRequestLoad.AddEventListener_Readystatechange,
            XMLHttpRequestLoad.Onreadystatechange
        ]
    );

    createXMLHttpRequestTest(
        "Should return the correct cancelled message when an error in `error` and the request is canceled",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(() => {
                    throw "Error";
                }),
                mock: undefined
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            const request = new XMLHttpRequest();

            let onabort: unknown;
            let onerror: unknown;

            expect(requestProxyFunctionObject.error).not.to.be.called;

            request.open("GET", url + "?duration=2000");
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            new Promise((resolve) => {
                request.onabort = (ev) => {
                    onabort = ev.type;
                };

                request.onerror = function (ev) {
                    onerror = ev.type;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 500);
                });

                request.send();
            });

            setTimeout(() => {
                request.abort();
            }, 100);

            await wait(1000);

            expect(onabort).not.to.be.undefined;
            expect(onabort).to.eq("abort");
            expect(onerror).to.be.undefined;
            expect(requestProxyFunctionObject.error).to.be.called;
            expect(callLine.length).to.eq(1);
            expect(callLine.next).to.eq(CallLineEnum.n000016);
        }
    );

    createXMLHttpRequestTest(
        "Should call `onerror` when an error in stream and mock provided",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(),
                mock: {
                    headers: {
                        "custom-header": "value"
                    }
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            const request = new XMLHttpRequest();

            let onerror: unknown;
            let readError: unknown;

            request.open("GET", urlBrokenStream);

            await new Promise((resolve) => {
                request.onerror = (e) => {
                    onerror = e;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                request.send();
            }).then(() => {
                try {
                    request.responseText;
                } catch (e) {
                    readError = e;
                }

                expect(onerror).not.to.be.undefined;
                expect(readError).to.be.undefined;
                expect(requestProxyFunctionObject.error).to.be.called;
                expect(callLine.length).to.eq(0);
            });
        },
        [
            XMLHttpRequestLoad.AddEventListener_Readystatechange,
            XMLHttpRequestLoad.Onreadystatechange
        ]
    );

    createXMLHttpRequestTest(
        "Should call `onerror` when an error in stream and mock not provided",
        async (onResponse) => {
            proxy.requestProxyFunction = async () => ({
                done: (_response, resolve) => resolve(),
                error: () => {
                    //
                },
                mock: undefined
            });

            const request = new XMLHttpRequest();

            let onerror: unknown;
            let readError: unknown;

            request.open("GET", urlBrokenStream);

            await new Promise((resolve) => {
                request.onerror = (e) => {
                    onerror = e;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                request.send();
            }).then(() => {
                try {
                    request.responseText;
                } catch (e) {
                    readError = e;
                }

                expect(onerror).not.to.be.undefined;
                expect(readError).to.be.undefined;
                expect(callLine.length).to.eq(0);
            });
        },
        [
            XMLHttpRequestLoad.AddEventListener_Readystatechange,
            XMLHttpRequestLoad.Onreadystatechange
        ]
    );

    createXMLHttpRequestTest(
        "Should fail when reading `responseText` when error in `generateBody` and `allowHitTheNetwork` set to `false``",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(),
                mock: {
                    generateBody: () => {
                        throw "Error";
                    }
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            const request = new XMLHttpRequest();

            let onerror: unknown;
            let readError: unknown;

            request.open("GET", url);

            expect(requestProxyFunctionObject.error).not.to.be.called;

            await new Promise((resolve) => {
                request.onerror = (e) => {
                    onerror = e;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                request.send();
            }).then(() => {
                try {
                    request.responseText;
                } catch (e) {
                    readError = e;
                }

                expect(onerror).to.be.undefined;
                expect(readError).not.to.be.undefined;
                expect(callLine.length).to.eq(0);
            });
        }
    );

    createXMLHttpRequestTest(
        "Should fail when reading `responseText` when error in `generateBody` and `allowHitTheNetwork` set to `true`",
        async (onResponse) => {
            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(),
                mock: {
                    allowHitTheNetwork: true,
                    generateBody: () => {
                        throw "Error";
                    }
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            const request = new XMLHttpRequest();

            let onerror: unknown;
            let readError: unknown;

            request.open("GET", url);

            expect(requestProxyFunctionObject.error).not.to.be.called;

            await new Promise((resolve) => {
                request.onerror = (e) => {
                    onerror = e;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                request.send();
            }).then(() => {
                try {
                    request.responseText;
                } catch (e) {
                    readError = e;
                }

                expect(onerror).to.be.undefined;
                expect(readError).not.to.be.undefined;
                expect(callLine.length).to.eq(0);
            });
        }
    );

    createXMLHttpRequestTest(
        "Should send the request when an error in done function when mock provided",
        async (onResponse) => {
            const responseBody = {
                some: 123
            };

            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: () => {
                    throw "Error";
                },
                error: cy.spy(),
                mock: {
                    body: responseBody
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            const request = new XMLHttpRequest();
            request.responseType = "json";

            let onerror: unknown;

            request.open("GET", url);

            expect(requestProxyFunctionObject.error).not.to.be.called;

            await new Promise((resolve) => {
                request.onerror = (e) => {
                    onerror = e;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                request.send();
            }).then(() => {
                expect(onerror).to.be.undefined;
                expect(request.response).to.deep.eq(responseBody);
                expect(callLine.length).to.be.above(0);
                expect(callLine.next).to.eq(CallLineEnum.n000018);
            });
        }
    );

    createXMLHttpRequestTest(
        "Should fail during stringify the input body but return a correct mocked resposne body",
        async (onResponse) => {
            const responseBody = {
                thing: 222
            };

            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(() => {
                    throw "Error";
                }),
                mock: {
                    body: responseBody
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            const request = new XMLHttpRequest();
            request.responseType = "json";

            let onerror: unknown;

            request.open("GET", url);

            expect(requestProxyFunctionObject.error).not.to.be.called;

            await new Promise((resolve) => {
                request.onerror = (e) => {
                    onerror = e;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                // send circular object to make `convertInputBodyToString` fail
                request.send(circularObj as unknown as XMLHttpRequestBodyInit);
            }).then(() => {
                expect(onerror).to.be.undefined;
                expect(request.response).to.deep.eq(responseBody);
                expect(callLine.length).to.be.above(1);
                expect(callLine.next).to.eq(CallLineEnum.n000019);
                expect(callLine.next).to.eq(CallLineEnum.n000020);
            });
        }
    );

    createXMLHttpRequestTest(
        "Should fail during calling `getJsonRequestBody` but return a correct mocked resposne body",
        async (onResponse) => {
            const responseBody = {
                thing: 222
            };

            const requestProxyFunctionObject: RequestProxyFunctionResult = {
                done: (_response, resolve) => resolve(),
                error: cy.spy(() => {
                    throw "Error";
                }),
                mock: {
                    generateBody: (_, getJsonRequestBody) => {
                        getJsonRequestBody();

                        return responseBody;
                    }
                }
            };

            proxy.requestProxyFunction = async () => requestProxyFunctionObject;

            const request = new XMLHttpRequest();
            request.responseType = "json";

            let onerror: unknown;

            request.open("GET", url);

            expect(requestProxyFunctionObject.error).not.to.be.called;

            await new Promise((resolve) => {
                request.onerror = (e) => {
                    onerror = e;
                };

                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                // send a nonesense string to make JSON.parse fail
                request.send("'er':}" as unknown as XMLHttpRequestBodyInit);
            }).then(() => {
                expect(onerror).to.be.undefined;
                expect(request.response).to.deep.eq(responseBody);
                expect(callLine.length).to.be.eq(1);
                expect(callLine.next).to.eq(CallLineEnum.n000010);
            });
        }
    );

    createXMLHttpRequestTest("Should return stringified mock", async (onResponse) => {
        const responseBody = {
            res: "abc"
        };

        proxy.requestProxyFunction = async () => ({
            done: (_response, resolve) => resolve(),
            error: () => {
                //
            },
            mock: {
                body: responseBody
            }
        });

        const request = new XMLHttpRequest();

        request.open("GET", url);

        await new Promise((resolve) => {
            onResponse(request, () => {
                setTimeout(() => {
                    resolve(null);
                }, 100);
            });

            request.send();
        }).then(() => {
            expect(request.response).to.deep.eq(JSON.stringify(responseBody));
            expect(request.responseText).to.deep.eq(JSON.stringify(responseBody));
            expect(callLine.length).to.be.eq(0);
        });
    });

    createXMLHttpRequestTest(
        "Should pass when `onerror` not provided but an error occur",
        async (onResponse) => {
            proxy.requestProxyFunction = async () => ({
                done: (_response, resolve) => resolve(),
                error: cy.spy(),
                mock: {
                    headers: {
                        "custom-header": "value"
                    }
                }
            });

            const request = new XMLHttpRequest();

            let readError: unknown;

            request.open("GET", urlBrokenStream);

            await new Promise((resolve) => {
                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 100);
                });

                request.send();
            }).then(() => {
                expect(request.responseText).to.eq("");
                expect(readError).to.be.undefined;
                expect(callLine.length).to.eq(0);
            });
        },
        [
            XMLHttpRequestLoad.AddEventListener_Readystatechange,
            XMLHttpRequestLoad.Onreadystatechange
        ]
    );
});

it("createWebsocketProxy ", async () => {
    const listener = new WebsocketListener();
    const actions: WebSocketAction[] = [];

    listener.subscribe((action) => {
        actions.push(action);
    });

    const websocketProxy = createWebsocketProxy(listener);

    const OriginWebsocket = window.WebSocket;

    expect(OriginWebsocket).to.eq(window.WebSocket);

    websocketProxy(window as WindowTypeOfWebsocketProxy);

    expect(OriginWebsocket).not.to.eq(window.WebSocket);

    const websocket = new WebSocket("ws://localhost:3000/test");

    await new Promise((resolve) => {
        websocket.onopen = () => {
            websocket.send("");

            websocket.close();

            resolve(null);
        };
    });

    expect(
        actions.map((entry) => ({
            protocols: entry.protocols,
            type: entry.type,
            query: entry.query,
            url: entry.url,
            urlQuery: entry.urlQuery
        }))
    ).to.deep.eq([
        {
            protocols: undefined,
            type: "create",
            query: {},
            url: "ws://localhost:3000/test",
            urlQuery: "ws://localhost:3000/test"
        },
        {
            protocols: undefined,
            type: "onopen",
            query: {},
            url: "ws://localhost:3000/test",
            urlQuery: "ws://localhost:3000/test"
        },
        {
            protocols: undefined,
            type: "send",
            query: {},
            url: "ws://localhost:3000/test",
            urlQuery: "ws://localhost:3000/test"
        },
        {
            protocols: undefined,
            type: "close",
            query: {},
            url: "ws://localhost:3000/test",
            urlQuery: "ws://localhost:3000/test"
        }
    ]);
});

it("test.unit", () => {
    const win: CallLineWindowType = window;

    // disable call line
    win[__CALL_LINE__] = undefined;

    lineCalled("this");
    lineCalledWithClone("this");

    expect(win[__CALL_LINE__]).to.be.undefined;

    lineCalled("123");
    lineCalledWithClone("123");

    expect(win[__CALL_LINE__]).to.be.undefined;

    expect(callLine.current).to.be.undefined;
    expect(callLine.current).to.be.undefined;
    expect(callLine.isEnabled).to.be.false;
    expect(callLine.length).to.eq(0);
    expect(callLine.next).to.be.undefined;
    expect(callLine.next).to.be.undefined;

    // enabled

    enableCallLine(win);

    const callLine1 = "this line has been called";

    lineCalled(callLine1);

    expect(callLine.isEnabled).to.be.true;
    expect(callLine.length).to.eq(1);

    expect(callLine.current).to.be.undefined;
    expect(callLine.next).to.eq(callLine1);
    expect(callLine.current).to.eq(callLine1);
    expect(callLine.next).to.be.undefined;
    expect(callLine.current).to.eq(callLine1);

    callLine.reset();

    expect(win[__CALL_LINE__]).to.deep.eq([callLine1]);
    expect(callLine.array).to.deep.eq([callLine1]);

    const callLine2 = "321";

    lineCalled(callLine2);

    expect(win[__CALL_LINE__]).to.deep.eq([callLine1, callLine2]);
    expect(callLine.array).to.deep.eq([callLine1, callLine2]);

    expect(callLine.isEnabled).to.be.true;
    expect(callLine.length).to.eq(2);

    expect(callLine.current).to.be.undefined;
    expect(callLine.next).to.eq(callLine1);
    expect(callLine.current).to.eq(callLine1);
    expect(callLine.next).to.eq(callLine2);
    expect(callLine.current).to.eq(callLine2);
    expect(callLine.next).to.be.undefined;
    expect(callLine.current).to.eq(callLine2);
    expect(callLine.next).to.be.undefined;

    const callLine3 = "--";

    lineCalled(callLine3);

    expect(win[__CALL_LINE__]).to.deep.eq([callLine1, callLine2, callLine3]);
    expect(callLine.array).to.deep.eq([callLine1, callLine2, callLine3]);

    expect(callLine.isEnabled).to.be.true;
    expect(callLine.length).to.eq(3);

    expect(callLine.current).to.eq(callLine2);
    expect(callLine.next).to.eq(callLine3);
    expect(callLine.current).to.eq(callLine3);
    expect(callLine.next).to.be.undefined;
    expect(callLine.current).to.eq(callLine3);

    callLine.reset();

    expect(win[__CALL_LINE__]).to.deep.eq([callLine1, callLine2, callLine3]);
    expect(callLine.array).to.deep.eq([callLine1, callLine2, callLine3]);

    expect(callLine.isEnabled).to.be.true;
    expect(callLine.length).to.eq(3);

    expect(callLine.current).to.be.undefined;
    expect(callLine.next).to.eq(callLine1);
    expect(callLine.current).to.eq(callLine1);
    expect(callLine.next).to.eq(callLine2);
    expect(callLine.current).to.eq(callLine2);
    expect(callLine.next).to.eq(callLine3);
    expect(callLine.current).to.eq(callLine3);
    expect(callLine.next).to.be.undefined;
    expect(callLine.current).to.eq(callLine3);

    callLine.clean();

    expect(win[__CALL_LINE__]).to.deep.eq([]);
    expect(callLine.array).to.deep.eq([]);

    expect(callLine.current).to.be.undefined;
    expect(callLine.length).to.eq(0);
    expect(callLine.next).to.be.undefined;

    // call with multiple arguments
    const callLine4_arg1 = "arg1";
    const callLine4_arg2 = { obj: 987, arr: [9, false, null, ""] };
    const callLine4_arg3 = false;

    lineCalled(callLine4_arg1, callLine4_arg2, callLine4_arg3);

    expect(callLine.next).to.deep.eq([callLine4_arg1, callLine4_arg2, callLine4_arg3]);
    expect(callLine.current).to.deep.eq([callLine4_arg1, callLine4_arg2, callLine4_arg3]);
    expect((callLine.current as unknown[])[0]).to.eq(callLine4_arg1);
    expect((callLine.current as unknown[])[1]).to.eq(callLine4_arg2);
    expect((callLine.current as unknown[])[2]).to.eq(callLine4_arg3);

    // call with multiple arguments and clone
    const callLine5_arg1 = { l: "string", n: 999, b: true, a: [9, 8, [1, 2]] };
    const callLine5_arg2 = [9, 8, 7, { ea: ["y", 0, false, null] }];

    lineCalledWithClone(callLine5_arg1, callLine5_arg2);

    expect(callLine.next).to.deep.eq([callLine5_arg1, callLine5_arg2]);
    expect(callLine.current).to.deep.eq([callLine5_arg1, callLine5_arg2]);
    expect((callLine.current as unknown[])[0]).not.to.eq(callLine5_arg1);
    expect((callLine.current as unknown[])[1]).not.to.eq(callLine5_arg2);

    const callLine6 = "simple string";

    lineCalledWithClone(callLine6);

    expect(callLine.next).to.eq(callLine6);
});

it("cy.callLine", () => {
    const wrap = (fnc: VoidFunction) => cy.wrap(null).then(fnc);

    const win: CallLineWindowType = window;

    // disable call line
    win[__CALL_LINE__] = undefined;

    wrap(() => lineCalled("this"));

    wrap(() => win[__CALL_LINE__] === undefined).should("be.true");

    wrap(() => lineCalled("123"));

    wrap(() => win[__CALL_LINE__] === undefined).should("be.true");

    cy.callLine()
        .then((callLine) => callLine.current === undefined)
        .should("be.true");
    cy.callLineCurrent().should("be.undefined");
    cy.callLine()
        .then((callLine) => callLine.current === undefined)
        .should("be.true");
    cy.callLineCurrent().should("be.undefined");
    cy.callLine()
        .then((callLine) => callLine.isEnabled)
        .should("be.false");
    cy.callLine()
        .then((callLine) => callLine.length)
        .should("eq", 0);
    cy.callLineLength().should("eq", 0);
    cy.callLine()
        .then((callLine) => callLine.next === undefined)
        .should("be.true");
    cy.callLine()
        .then((callLine) => callLine.next === undefined)
        .should("be.true");
    cy.callLineNext().should("be.undefined");

    cy.callLineClean();

    wrap(() => win[__CALL_LINE__] === undefined).should("be.true");

    // enabled

    wrap(() => enableCallLine(win));

    const callLine1 = "this line has been called";

    wrap(() => lineCalled(callLine1));

    cy.callLine()
        .then((callLine) => callLine.isEnabled)
        .should("be.true");
    cy.callLine()
        .then((callLine) => callLine.length)
        .should("eq", 1);
    cy.callLineLength().should("eq", 1);

    cy.callLineCurrent().should("be.undefined");
    cy.callLineNext().should("eq", callLine1);
    cy.callLineCurrent().should("eq", callLine1);
    cy.callLineNext().should("be.undefined");
    cy.callLineCurrent().should("eq", callLine1);

    cy.callLine().then((callLine) => callLine.reset());

    wrap(() => win[__CALL_LINE__]).should("deep.equal", [callLine1]);
    cy.callLine()
        .then((callLine) => callLine.array)
        .should("deep.equal", [callLine1]);

    const callLine2 = "321";

    wrap(() => lineCalled(callLine2));

    wrap(() => win[__CALL_LINE__]).should("deep.equal", [callLine1, callLine2]);
    cy.callLine()
        .then((callLine) => callLine.array)
        .should("deep.equal", [callLine1, callLine2]);

    cy.callLine()
        .then((callLine) => callLine.isEnabled)
        .should("be.true");
    cy.callLine()
        .then((callLine) => callLine.length)
        .should("eq", 2);
    cy.callLineLength().should("eq", 2);

    cy.callLineCurrent().should("be.undefined");
    cy.callLineNext().should("eq", callLine1);
    cy.callLineCurrent().should("eq", callLine1);
    cy.callLineNext().should("eq", callLine2);
    cy.callLineCurrent().should("eq", callLine2);
    cy.callLineNext().should("be.undefined");
    cy.callLineCurrent().should("eq", callLine2);
    cy.callLineNext().should("be.undefined");

    const callLine3 = "--";

    wrap(() => lineCalled(callLine3));

    wrap(() => win[__CALL_LINE__]).should("deep.equal", [callLine1, callLine2, callLine3]);
    cy.callLine()
        .then((callLine) => callLine.array)
        .should("deep.equal", [callLine1, callLine2, callLine3]);

    cy.callLine()
        .then((callLine) => callLine.isEnabled)
        .should("be.true");
    cy.callLine()
        .then((callLine) => callLine.length)
        .should("eq", 3);
    cy.callLineLength().should("eq", 3);

    cy.callLineCurrent().should("eq", callLine2);
    cy.callLineNext().should("eq", callLine3);
    cy.callLineCurrent().should("eq", callLine3);
    cy.callLineNext().should("be.undefined");
    cy.callLineCurrent().should("eq", callLine3);

    cy.callLine().then((callLine) => callLine.reset());

    wrap(() => win[__CALL_LINE__]).should("deep.equal", [callLine1, callLine2, callLine3]);
    cy.callLine()
        .then((callLine) => callLine.array)
        .should("deep.equal", [callLine1, callLine2, callLine3]);

    cy.callLine()
        .then((callLine) => callLine.isEnabled)
        .should("be.true");
    cy.callLine()
        .then((callLine) => callLine.length)
        .should("eq", 3);
    cy.callLineLength().should("eq", 3);

    cy.callLineCurrent().should("be.undefined");
    cy.callLineNext().should("eq", callLine1);
    cy.callLineCurrent().should("eq", callLine1);
    cy.callLineNext().should("eq", callLine2);
    cy.callLineCurrent().should("eq", callLine2);
    cy.callLineNext().should("eq", callLine3);
    cy.callLineCurrent().should("eq", callLine3);
    cy.callLineNext().should("be.undefined");
    cy.callLineCurrent().should("eq", callLine3);

    cy.callLine().then((callLine) => callLine.clean());

    wrap(() => win[__CALL_LINE__]).should("deep.equal", []);
    cy.callLine()
        .then((callLine) => callLine.array)
        .should("deep.equal", []);

    cy.callLine()
        .then((callLine) => callLine.isEnabled)
        .should("be.true");
    cy.callLine()
        .then((callLine) => callLine.length)
        .should("eq", 0);
    cy.callLineLength().should("eq", 0);

    cy.callLineCurrent().should("be.undefined");
    cy.callLineNext().should("be.undefined");

    // call with multiple arguments
    const callLine4_arg1 = "arg1";
    const callLine4_arg2 = { obj: 987, arr: [9, false, null, ""] };
    const callLine4_arg3 = false;

    wrap(() => lineCalled(callLine4_arg1, callLine4_arg2, callLine4_arg3));

    cy.callLineNext().should("deep.eq", [callLine4_arg1, callLine4_arg2, callLine4_arg3]);
    cy.callLineCurrent().should("deep.eq", [callLine4_arg1, callLine4_arg2, callLine4_arg3]);
    cy.callLine()
        .then((callLine) => (callLine.current as unknown[])[0])
        .should("eq", callLine4_arg1);
    cy.callLine()
        .then((callLine) => (callLine.current as unknown[])[1])
        .should("eq", callLine4_arg2);
    cy.callLine()
        .then((callLine) => (callLine.current as unknown[])[2])
        .should("eq", callLine4_arg3);

    // call with multiple arguments and clone
    const callLine5_arg1 = { l: "string", n: 999, b: true, a: [9, 8, [1, 2]] };
    const callLine5_arg2 = [9, 8, 7, { ea: ["y", 0, false, null] }];

    wrap(() => lineCalledWithClone(callLine5_arg1, callLine5_arg2));

    cy.callLineNext().should("deep.eq", [callLine5_arg1, callLine5_arg2]);
    cy.callLineCurrent().should("deep.eq", [callLine5_arg1, callLine5_arg2]);
    cy.callLine()
        .then((callLine) => (callLine.current as unknown[])[0])
        .should("not.eq", callLine5_arg1);
    cy.callLine()
        .then((callLine) => (callLine.current as unknown[])[1])
        .should("not.eq", callLine5_arg2);

    const callLine6 = "simple string";

    wrap(() => lineCalledWithClone(callLine6));

    cy.callLineNext().should("eq", callLine6);
});

it("Should wait for the results", () => {
    setTimeout(() => {
        lineCalled(123);

        setTimeout(() => {
            lineCalled("aaa");
        }, 2500);
    }, 2500);

    cy.callLineLength().should("eq", 1);
    cy.callLineNext().should("eq", 123);
    cy.callLineNext().should("eq", "aaa");

    cy.callLineClean();

    cy.wrap(null).then(() => {
        setTimeout(() => {
            lineCalled("111");
        }, 3000);
    });

    cy.callLineNext().should("eq", "111");
});

it("Should wait for the results", () => {
    setTimeout(() => {
        lineCalled(999);
    }, 3000);

    cy.callLineNext().should("not.be.undefined");
    cy.callLineCurrent().should("eq", 999);

    cy.callLineClean();

    cy.wrap(null).then(() => {
        setTimeout(() => {
            lineCalled("555");
        }, 3000);
    });

    cy.callLineNext().should("not.be.undefined");
    cy.callLineCurrent().should("eq", "555");
});
