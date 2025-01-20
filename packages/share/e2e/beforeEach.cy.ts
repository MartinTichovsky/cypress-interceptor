/* istanbul ignore file */
import "cypress-interceptor/console";
import "cypress-interceptor/websocket";

import { ConsoleLogType } from "cypress-interceptor/WatchTheConsole.types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { fireRequest } from "../src/utils";

describe("Before and BeforeEach", () => {
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "test/api-2";
    const testPath_api_3 = "test/api-3";
    const duration = 2500;

    describe("Using it in before each - first", () => {
        beforeEach(() => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                duration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_api_2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "GET",
                        path: testPath_api_3,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration);
        });

        it("First test", () => {
            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration);
        });

        it("Second test", () => {
            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration);
        });
    });

    describe("Using it in before each - second", () => {
        beforeEach(() => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                duration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_api_2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "GET",
                        path: testPath_api_3,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration);
        });

        it("First test", () => {
            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration);
        });

        it("Second test", () => {
            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration);
        });
    });

    describe("Using Interceptor and WatchTheConsole in before", () => {
        before(() => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                duration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_api_2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        method: "GET",
                        path: testPath_api_3,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.interceptorStats().should("have.length", 2);

            const log1 = "Before hook 1";
            const log2 = "Before hook 2";

            cy.window().then((win) => {
                win.console.log(log1);
                win.console.warn(log2);
            });

            cy.watchTheConsole().then((console) => {
                expect(console.log).to.have.length(2);
                expect(console.log[0].type).to.eq(ConsoleLogType.ConsoleLog);
                expect(console.log[0].args).to.deep.eq([log1]);
                expect(console.log[1].type).to.eq(ConsoleLogType.ConsoleWarn);
                expect(console.log[1].args).to.deep.eq([log2]);
            });
        });

        it("Should work", () => {
            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration);

            cy.interceptorStats().should("have.length", 3);

            const log3 = "Before hook 3";
            const log4 = "Before hook 4";

            cy.window().then((win) => {
                win.console.error(log3);
                win.console.info(log4);
            });

            cy.watchTheConsole().then((console) => {
                expect(console.log).to.have.length(4);
                expect(console.log[2].type).to.eq(ConsoleLogType.ConsoleError);
                expect(console.log[2].args).to.deep.eq([log3]);
                expect(console.log[3].type).to.eq(ConsoleLogType.ConsoleInfo);
                expect(console.log[3].args).to.deep.eq([log4]);
            });
        });
    });

    describe("Using Websocket in before", () => {
        const delay1 = 2500;
        const delay2 = 3000;
        const path = "webSocket-1";
        const sendData1 = "hello";
        const sendData2 = "server";

        before(() => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        path,
                        sendQueue: [
                            {
                                data: sendData1,
                                delay: delay1
                            }
                        ],
                        type: "websocket"
                    },
                    {
                        fireOnClick: true,
                        path,
                        sendQueue: [
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
                data: sendData1,
                type: "send"
            });

            cy.wsInterceptorStats({ type: "send" }).should("have.length", 1);
        });

        it("Should work", () => {
            cy.startTiming();

            fireRequest();

            cy.waitUntilWebsocketAction({
                data: sendData2,
                type: "send"
            });

            cy.stopTiming().should("be.gte", delay2);

            cy.wsInterceptorStats({ type: "send" }).should("have.length", 2);
        });
    });
});
