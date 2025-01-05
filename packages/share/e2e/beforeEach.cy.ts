import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { fireRequest } from "../src/utils";

describe("Using it in before each - first", () => {
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "test/api-2";
    const testPath_api_3 = "test/api-3";
    const duration = 2500;

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
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "test/api-2";
    const testPath_api_3 = "test/api-3";

    const duration = 2500;

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
