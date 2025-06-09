import "cypress-interceptor/console";
import "cypress-interceptor/websocket";

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
                        delay: 200,
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
                        delay: 200,
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
                        delay: 200,
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
                        delay: 200,
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
