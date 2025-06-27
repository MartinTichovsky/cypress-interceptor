import "cypress-interceptor/console";
import "cypress-interceptor/websocket";

import { ConsoleLogType } from "cypress-interceptor/WatchTheConsole.types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { fireRequest } from "../src/utils";

after(() => {
    cy.interceptorStats().should("have.length", 3);
    cy.wsInterceptorStats({ type: "send" }).should("have.length", 1);
    cy.watchTheConsole().then((console) => {
        expect(console.log).to.have.length(4);
    });
});

describe("Hooks - Case 1", () => {
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "test/api-2";
    const testPath_api_3 = "test/api-3";
    const duration = 2500;

    // this must be the last test to be able check all packages in after and afterEach
    describe("Using Interceptor, WatchTheConsole and Websocket in hooks", () => {
        const log3 = "Before hook 3";
        const log4 = "Before hook 4";

        const check = () => {
            cy.interceptorStats().should("have.length", 3);
            cy.wsInterceptorStats({ type: "send" }).should("have.length", 1);

            cy.watchTheConsole().then((console) => {
                expect(console.log).to.have.length(4);
                expect(console.log[2].type).to.eq(ConsoleLogType.ConsoleError);
                expect(console.log[2].args).to.deep.eq([log3]);
                expect(console.log[3].type).to.eq(ConsoleLogType.ConsoleInfo);
                expect(console.log[3].args).to.deep.eq([log4]);
            });
        };

        after(() => {
            check();
        });

        afterEach(() => {
            check();
        });

        before(() => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 200,
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
                        method: "GET",
                        path: testPath_api_3,
                        type: "xhr"
                    },
                    {
                        delay: 100,
                        path: "webSocket-1",
                        sendQueue: [
                            {
                                data: "send data",
                                delay: 200
                            }
                        ],
                        type: "websocket"
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

            cy.window().then((win) => {
                win.console.error(log3);
                win.console.info(log4);
            });

            check();
        });
    });
});
