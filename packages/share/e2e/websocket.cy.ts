import { getFilePath } from "cypress-interceptor/src/utils";
import { CallStackWebsocket } from "cypress-interceptor/src/WebsocketInterceptor";
import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { createMatcher, fireRequest } from "../src/utils";

function createOutputFileName(outputDir: string, fileName?: string) {
    const type = "ws.stats";

    return fileName
        ? `${outputDir}/${fileName}.${type}.json`
        : getFilePath(undefined, outputDir, type);
}

const outputDir = "_logs";

before(() => {
    cy.task("clearLogs", [outputDir]);
});

describe("Websocket", () => {
    describe("Match", () => {
        const autoResponse1 = "message 1";
        const autoResponse2 = "message 2";
        const autoResponse3 = "message 3";
        const delay = 3000;
        const path1 = "webSocket-1";
        const path2 = "webSocket-2";
        const path3 = "webSocket-3";
        const query1 = { user: "Harry" };
        const query2 = { page: "5" };
        const responseData1 = "response data 1";
        const responseData2 = "response data 2";
        const sendData1 = "send data 1";
        const sendData2 = "send data 2";
        const sendQueue1 = "Hello,";
        const sendQueue2 = "server.";

        const config: DynamicRequest[] = [
            {
                delay: 100,
                communication: [
                    {
                        responseData: responseData1,
                        responseDelay: delay,
                        sendData: sendData1
                    },
                    {
                        responseData: responseData2,
                        responseDelay: delay,
                        sendData: sendData2
                    }
                ],
                path: path1,
                query: query1,
                type: "websocket"
            },
            {
                delay: 100,
                sendQueue: [
                    {
                        data: sendQueue1
                    },
                    {
                        data: sendQueue2,
                        delay
                    }
                ],
                path: path2,
                protocols: "soap",
                query: query2,
                type: "websocket"
            },
            {
                autoResponse: [
                    {
                        data: autoResponse1
                    },
                    {
                        data: autoResponse2,
                        delay: delay
                    },
                    {
                        data: autoResponse3,
                        delay: delay
                    }
                ],
                path: path3,
                protocols: ["amqp", "xmpp"],
                type: "websocket"
            }
        ];

        it("Multiple matches", () => {
            cy.visit(getDynamicUrl(config));

            cy.waitUntilWebsocketAction([
                {
                    data: responseData2,
                    type: "onmessage",
                    url: `**/${path1}`
                },
                {
                    data: sendQueue2,
                    type: "send",
                    url: `**/${path2}`
                },
                {
                    data: autoResponse3,
                    protocols: "xmpp",
                    type: "onmessage",
                    url: `**/${path3}`
                }
            ]);

            cy.wsInterceptorStats({ type: "send" }).then((stats) => {
                expect(stats.length).to.eq(4);
                expect(stats[0].data).not.to.be.empty;
                expect(stats[1].data).not.to.be.empty;
                expect(stats[2].data).not.to.be.empty;
                expect(stats[3].data).not.to.be.empty;
            });

            cy.wsInterceptorStats({ type: "onmessage" }).then((stats) => {
                expect(stats.length).to.eq(5);
                expect(stats[0].data).not.to.be.empty;
                expect(stats[1].data).not.to.be.empty;
                expect(stats[2].data).not.to.be.empty;
                expect(stats[3].data).not.to.be.empty;
                expect(stats[4].data).not.to.be.empty;
            });

            cy.wsInterceptorStats({ url: `**/${path2}` }).then((stats) => {
                expect(stats.length).to.eq(4);
                expect(stats[0].type).to.eq("create");
                expect(stats[1].type).to.eq("onopen");
                expect(stats[2].data).to.eq(sendQueue1);
                expect(stats[2].type).to.eq("send");
                expect(stats[3].data).to.eq(sendQueue2);
                expect(stats[3].type).to.eq("send");
            });

            cy.wsInterceptorStats({
                queryMatcher: createMatcher(query1)
            }).then((stats) => {
                expect(stats.length).to.eq(6);
                expect(stats[0].type).to.eq("create");
                expect(stats[1].type).to.eq("onopen");
                expect(stats[2].data).not.to.be.empty;
                expect(stats[2].type).to.eq("send");
                expect(stats[3].data).to.haveOwnProperty("data", responseData1);
                expect(stats[4].data).not.to.be.empty;
                expect(stats[4].type).to.eq("send");
                expect(stats[5].data).to.haveOwnProperty("data", responseData2);
            });

            cy.wsInterceptorStats({
                protocols: "soap"
            }).then((stats) => {
                expect(stats.length).to.eq(4);
                expect(stats[0].type).to.eq("create");
                expect(stats[1].type).to.eq("onopen");
                expect(stats[2].data).to.eq(sendQueue1);
                expect(stats[2].type).to.eq("send");
                expect(stats[3].data).to.eq(sendQueue2);
                expect(stats[3].type).to.eq("send");
            });

            cy.wsInterceptorStats({
                protocols: ["amqp", "xmpp"]
            }).then((stats) => {
                expect(stats.length).to.eq(5);
                expect(stats[0].type).to.eq("create");
                expect(stats[1].type).to.eq("onopen");
                expect(stats[2].data).to.haveOwnProperty("data", autoResponse1);
                expect(stats[3].data).to.haveOwnProperty("data", autoResponse2);
                expect(stats[4].data).to.haveOwnProperty("data", autoResponse3);
            });

            cy.wsInterceptorStats({
                types: ["send", "onmessage"]
            }).then((stats) => {
                expect(stats.length).to.eq(9);
            });

            cy.wsInterceptor().then((interceptor) => {
                expect(interceptor.callStack.length > 0).to.be.true;
            });
        });

        it("Custom wait with default", () => {
            cy.visit(getDynamicUrl(config));

            // just for testing that it passes
            cy.waitUntilWebsocketAction();

            cy.wsInterceptorLastRequest({ url: "some-url" }).should("be.undefined");
        });

        it("Custom wait with enforce check without match", () => {
            cy.visit(getDynamicUrl(config));

            // just for testing that it passes
            cy.waitUntilWebsocketAction({ timeout: 5000 });
        });

        it("Default options - will not wait to the first action", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        communication: [
                            {
                                responseData: responseData1,
                                responseDelay: delay,
                                sendData: sendData1,
                                sendDelay: delay
                            },
                            {
                                responseData: responseData2,
                                responseDelay: delay,
                                sendData: sendData2
                            }
                        ],
                        path: path1,
                        query: query1,
                        type: "websocket"
                    }
                ])
            );

            cy.waitUntilWebsocketAction();
        });
    });

    describe("Expected fail", () => {
        const errMessage = "<EXPECTED WS ERROR>";
        let expectedErrorMessage = errMessage;

        const listener = (error: Error) => {
            if (error.message === expectedErrorMessage) {
                return;
            }

            /* istanbul ignore next */
            throw new Error(error.message);
        };

        after(() => {
            Cypress.off("fail", listener);
        });

        before(() => {
            Cypress.on("fail", listener);
        });

        let envTimeout: unknown;

        beforeEach(() => {
            envTimeout = Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");
        });

        afterEach(() => {
            Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT", envTimeout);
        });

        it("Max wait", () => {
            const delay = 9999;
            const responseData = "response data";

            cy.visit(
                getDynamicUrl([
                    {
                        communication: [
                            {
                                responseData,
                                responseDelay: delay,
                                sendData: "send data"
                            }
                        ],
                        delay: 100,
                        path: "websocket-1",
                        type: "websocket"
                    }
                ])
            );

            expectedErrorMessage = `${errMessage} (${delay / 2}ms)`;

            cy.waitUntilWebsocketAction(
                { data: responseData, type: "onmessage" },
                { timeout: delay / 2 },
                errMessage
            );

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Enforce check", () => {
            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (5000ms)`;

            cy.waitUntilWebsocketAction({ timeout: 5000 }, errMessage);

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Default timeout", () => {
            Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT", undefined);

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (10000ms)`;

            cy.waitUntilWebsocketAction({ url: "some-url" }, errMessage);

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Env timeout", () => {
            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (20000ms)`;

            cy.waitUntilWebsocketAction({ url: "some-url" }, errMessage);

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });
    });

    describe("Log stats to file", () => {
        const path1 = "websocket-in-1";
        const path2 = "websocket-in-2";
        const responseData11 = "data response 1-1";
        const responseData12 = "data response 1-2";
        const responseData21 = "data response 2-1";
        const responseData22 = "data response 2-2";
        const sendData1 = "data send 1";
        const sendData2 = "data send 2";

        const config: DynamicRequest[] = [
            {
                communication: [
                    {
                        responseData: responseData11,
                        responseDelay: 1500,
                        sendData: sendData1
                    },
                    {
                        responseData: responseData12,
                        responseDelay: 2000,
                        sendData: sendData2
                    }
                ],
                delay: 100,
                path: path1,
                type: "websocket"
            }
        ];

        it("Name auto generated", () => {
            cy.visit(getDynamicUrl(config));

            cy.waitUntilWebsocketAction({
                data: responseData12,
                type: "onmessage",
                url: new RegExp(`${path1}$`, "i")
            });

            cy.wsInterceptor().then((intereptor) => {
                intereptor.writeStatsToLog(`${outputDir}/`);

                cy.readFile(createOutputFileName(outputDir)).then((stats: CallStackWebsocket[]) => {
                    expect(stats.length).to.eq(6);
                    expect(stats.find((entry) => entry.url.endsWith(path1))).not.to.be.undefined;
                    expect(stats[2].data).not.to.be.empty;
                    expect(stats[2].type).to.eq("send");
                    expect(stats[3].data).to.haveOwnProperty("data", responseData11);
                    expect(stats[3].type).to.eq("onmessage");
                    expect(stats[4].data).not.to.be.empty;
                    expect(stats[4].type).to.eq("send");
                    expect(stats[5].data).to.haveOwnProperty("data", responseData12);
                    expect(stats[5].type).to.eq("onmessage");
                });
            });
        });

        it("Strict name", () => {
            const fileName = "FILE_NAME_WS_STATS";

            cy.visit(getDynamicUrl(config));

            cy.waitUntilWebsocketAction({
                data: responseData12,
                type: "onmessage",
                url: new RegExp(`${path1}$`, "i")
            });

            cy.wsInterceptor().then((intereptor) => {
                intereptor.writeStatsToLog(outputDir, { fileName });

                cy.readFile(createOutputFileName(outputDir, fileName)).then(
                    (stats: CallStackWebsocket[]) => {
                        expect(stats.length).to.eq(6);
                        expect(stats.find((entry) => entry.url.endsWith(path1))).not.to.be
                            .undefined;
                        expect(stats[2].data).not.to.be.empty;
                        expect(stats[2].type).to.eq("send");
                        expect(stats[3].data).to.haveOwnProperty("data", responseData11);
                        expect(stats[3].type).to.eq("onmessage");
                        expect(stats[4].data).not.to.be.empty;
                        expect(stats[4].type).to.eq("send");
                        expect(stats[5].data).to.haveOwnProperty("data", responseData12);
                        expect(stats[5].type).to.eq("onmessage");
                    }
                );
            });
        });

        it("Stats to file - matcher, filter, mapper", () => {
            const fileName = "FILE_NAME_WS_STATS_MATCH";

            cy.visit(
                getDynamicUrl([
                    ...config,
                    {
                        communication: [
                            {
                                responseData: responseData21,
                                responseDelay: 1000,
                                sendData: sendData1
                            },
                            {
                                responseData: responseData22,
                                sendData: sendData2
                            }
                        ],
                        delay: 100,
                        path: path2,
                        protocols: "soap",
                        type: "websocket"
                    }
                ])
            );

            cy.waitUntilWebsocketAction([
                {
                    data: responseData12,
                    type: "onmessage"
                },
                {
                    data: responseData22,
                    type: "onmessage"
                }
            ]);

            const filePath = createOutputFileName(outputDir, fileName);

            cy.wsInterceptor().then((intereptor) => {
                intereptor.writeStatsToLog(outputDir, { fileName, prettyOutput: true });

                cy.readFile(filePath).then((stats: CallStackWebsocket[]) => {
                    expect(stats.length).to.eq(12);
                });

                intereptor.writeStatsToLog(outputDir, { fileName, matcher: { protocols: "soap" } });

                cy.readFile(filePath).then((stats: CallStackWebsocket[]) => {
                    expect(stats.length).to.eq(6);
                    expect(stats.find((entry) => entry.url.endsWith(path2))).not.to.be.undefined;
                    expect(stats[2].data).not.to.be.empty;
                    expect(stats[2].type).to.eq("send");
                    expect(stats[3].data).to.haveOwnProperty("data", responseData21);
                    expect(stats[3].type).to.eq("onmessage");
                    expect(stats[4].data).not.to.be.empty;
                    expect(stats[4].type).to.eq("send");
                    expect(stats[5].data).to.haveOwnProperty("data", responseData22);
                    expect(stats[5].type).to.eq("onmessage");
                });

                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    matcher: { type: "onmessage", url: `**/${path1}` }
                });

                cy.readFile(filePath).then((stats: CallStackWebsocket[]) => {
                    expect(stats.length).to.eq(2);
                    expect(stats[0].data).to.haveOwnProperty("data", responseData11);
                    expect(stats[0].type).to.eq("onmessage");
                    expect(stats[1].data).to.haveOwnProperty("data", responseData12);
                    expect(stats[1].type).to.eq("onmessage");
                });

                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    filter: (callStack) => callStack.url.endsWith(path2)
                });

                cy.readFile(filePath).then((stats: CallStackWebsocket[]) => {
                    expect(stats.length).to.eq(6);
                    expect(stats.every((entry) => entry.url.endsWith(path2)));
                });

                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    mapper: (callStack) => ({ type: callStack.type, url: callStack.url })
                });

                cy.readFile(filePath).then((stats: CallStackWebsocket[]) => {
                    expect(stats.length).to.eq(12);
                    expect(
                        stats.every(
                            (entry) =>
                                entry.type !== undefined &&
                                entry.url !== undefined &&
                                Object.keys(entry).length === 2
                        )
                    ).to.be.true;
                });
            });
        });
    });

    it("Close", () => {
        const delay = 3000;
        const code = 1000;
        const path = "webSocket-1";
        const reason = "<REASON>";

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    close: {
                        code,
                        reason
                    },
                    communication: [
                        {
                            responseData: "response data",
                            responseDelay: delay,
                            sendData: "send data"
                        }
                    ],
                    delay: 100,
                    path,
                    type: "websocket"
                }
            ])
        );

        cy.waitUntilWebsocketAction([
            {
                code,
                reason,
                type: "close"
            }
        ]);

        cy.stopTiming().should("be.gte", delay);

        cy.wsInterceptorLastRequest({ type: "close" }).then((entry) => {
            expect(entry).not.to.be.undefined;
            expect(entry!.data).to.haveOwnProperty("code", code);
            expect(entry!.data).to.haveOwnProperty("reason", reason);
            expect(entry!.url.toString().endsWith(path)).to.be.true;
        });
    });

    it("Communication", () => {
        const delay1 = 2000;
        const delay2 = 3500;
        const sendData1 = "hello";
        const sendData2 = "server";
        const response1 = "wellcome";
        const response2 = "friend";

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    communication: [
                        {
                            responseData: response1,
                            responseDelay: delay1,
                            sendData: sendData1
                        },
                        {
                            responseData: response2,
                            responseDelay: delay2,
                            sendData: sendData2
                        }
                    ],
                    delay: 100,
                    path: "webSocket-1",
                    type: "websocket"
                }
            ])
        );

        cy.waitUntilWebsocketAction({
            data: response2,
            type: "onmessage"
        });

        cy.stopTiming().should("be.gte", delay1 + delay2);

        cy.wsInterceptorStats().then((stats) => {
            expect(stats.length).to.eq(6);
        });

        cy.wsInterceptorStats({ type: "create" }).then((stats) => {
            expect(stats.length).to.eq(1);
        });

        cy.wsInterceptorStats({ type: "onopen" }).then((stats) => {
            expect(stats.length).to.eq(1);
        });

        cy.wsInterceptorStats({ type: "send" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].data).not.to.be.empty;
            expect(stats[1].data).not.to.be.empty;
        });

        cy.wsInterceptorStats({ type: "onmessage" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].data).to.haveOwnProperty("data", response1);
            expect(stats[1].data).to.haveOwnProperty("data", response2);
        });
    });

    it("Error", () => {
        const delay = 3000;

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    delay,
                    error: true,
                    path: "webSocket-1",
                    type: "websocket"
                }
            ])
        );

        cy.waitUntilWebsocketAction({
            type: "onerror"
        });

        cy.stopTiming().should("be.gte", delay);

        cy.wsInterceptorLastRequest({ type: "onerror" }).should("not.be.undefined");
    });

    it("OnMessage", () => {
        const delay1 = 3000;
        const delay2 = 2000;
        const response1 = "wellcome";
        const response2 = "friend";

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    autoResponse: [
                        { data: response1, delay: delay1 },
                        { data: response2, delay: delay2 }
                    ],
                    delay: 100,
                    path: "webSocket-1",
                    type: "websocket"
                }
            ])
        );

        cy.waitUntilWebsocketAction({
            data: response2,
            type: "onmessage"
        });

        cy.stopTiming().should("be.gte", delay1 + delay2);

        cy.wsInterceptorStats().then((stats) => {
            expect(stats.length).to.eq(4);
        });

        cy.wsInterceptorStats({ type: "create" }).then((stats) => {
            expect(stats.length).to.eq(1);
        });

        cy.wsInterceptorStats({ type: "onopen" }).then((stats) => {
            expect(stats.length).to.eq(1);
        });

        cy.wsInterceptorStats({ type: "onmessage" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].data).to.haveOwnProperty("data", response1);
            expect(stats[1].data).to.haveOwnProperty("data", response2);
        });
    });

    it("Send", () => {
        const delay1 = 2500;
        const delay2 = 3000;
        const sendData1 = "hello";
        const sendData2 = "server";

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    path: "webSocket-1",
                    sendQueue: [
                        {
                            data: sendData1,
                            delay: delay1
                        },
                        {
                            data: sendData2,
                            delay: delay2
                        }
                    ],
                    type: "websocket"
                }
            ])
        );

        cy.waitUntilWebsocketAction({
            data: sendData2,
            type: "send"
        });

        cy.stopTiming().should("be.gte", delay1 + delay2);

        cy.wsInterceptorStats().then((stats) => {
            expect(stats.length).to.eq(4);
        });

        cy.wsInterceptorStats({ type: "create" }).then((stats) => {
            expect(stats.length).to.eq(1);
        });

        cy.wsInterceptorStats({ type: "onopen" }).then((stats) => {
            expect(stats.length).to.eq(1);
        });

        cy.wsInterceptorStats({ type: "send" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].data).to.eq(sendData1);
            expect(stats[1].data).to.eq(sendData2);
        });
    });

    it("Reset watch", () => {
        const delay1 = 2500;
        const delay2 = 3000;
        const path = "webSocket-1";
        const sendData1 = "hello";
        const sendData2 = "server";

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    path,
                    sendQueue: [
                        {
                            data: "send me"
                        },
                        {
                            data: sendData2,
                            delay: 500
                        }
                    ],
                    type: "websocket"
                },
                {
                    fireOnClick: true,
                    path,
                    sendQueue: [
                        {
                            data: sendData1,
                            delay: delay1
                        },
                        {
                            data: sendData2,
                            delay: delay2
                        }
                    ],
                    type: "websocket"
                }
            ])
        );

        cy.waitUntilWebsocketAction(
            {
                type: "send"
            },
            { countMatch: 2 }
        );

        cy.wsResetInterceptorWatch();

        fireRequest();

        cy.startTiming();

        cy.waitUntilWebsocketAction({
            data: sendData2,
            type: "send"
        });

        cy.stopTiming().should("be.gte", delay1 + delay2);

        cy.wsInterceptorStats({ type: "send" }).then((stats) => {
            expect(stats.length).to.eq(4);
            expect(stats[stats.length - 2].data).to.eq(sendData1);
            expect(stats[stats.length - 1].data).to.eq(sendData2);
        });
    });

    it("Set options", () => {
        cy.visit(
            getDynamicUrl([
                {
                    path: "some-path",
                    type: "websocket"
                }
            ])
        );

        cy.wsInterceptor().then((interceptor) => {
            expect(interceptor.debugIsEnabled).to.be.true;
        });

        cy.wsInterceptorOptions({ debug: false }).then((options) => {
            expect(options).to.haveOwnProperty("debug", false);
        });

        cy.wsInterceptor().then((interceptor) => {
            expect(interceptor.debugIsEnabled).to.be.false;
        });
    });
});
