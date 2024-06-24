import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { fireRequest } from "../src/utils";

describe("Using it in before each - first", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";

    const testPath_Script1 = "sources/script-1.js";
    const duration = 2500;

    beforeEach(() => {
        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    delay: 150,
                    duration,
                    method: "POST",
                    path: testPath_Fetch1,
                    requests: [
                        {
                            method: "POST",
                            duration,
                            fireOnClick: true,
                            path: testPath_Fetch2,
                            type: "fetch"
                        }
                    ],
                    type: "fetch"
                },
                {
                    delay: 150,
                    duration,
                    path: testPath_Script1,
                    type: "script"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);
    });

    it("First test", () => {
        cy.startTiming();

        fireRequest();

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);
    });

    it("Second test", () => {
        cy.startTiming();

        fireRequest();

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);
    });
});

describe("Using it in before each - second", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";

    const testPath_Script1 = "sources/script-1.js";

    const duration = 2500;

    beforeEach(() => {
        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    delay: 150,
                    duration,
                    method: "POST",
                    path: testPath_Fetch1,
                    requests: [
                        {
                            method: "POST",
                            duration,
                            fireOnClick: true,
                            path: testPath_Fetch2,
                            type: "fetch"
                        }
                    ],
                    type: "fetch"
                },
                {
                    delay: 150,
                    duration,
                    path: testPath_Script1,
                    type: "script"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);
    });

    it("First test", () => {
        cy.startTiming();

        fireRequest();

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);
    });

    it("Second test", () => {
        cy.startTiming();

        fireRequest();

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);
    });
});
