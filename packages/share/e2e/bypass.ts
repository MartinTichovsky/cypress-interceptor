import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { getResponseStatus } from "../src/selectors";

describe("Bypass", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";

    const duration = 8000;

    it("Bypass - fetch", () => {
        cy.bypassInterceptorResponse(`**/${testPath_Fetch1}`);

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    duration,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);

        cy.interceptor().then((interceptor) => {
            const bypassRequest = interceptor.debugInfo.find((entry) => entry.type === "bypass");
            expect(bypassRequest).not.to.be.undefined;
            expect(bypassRequest?.method).to.eq("POST");
            expect(bypassRequest?.url.endsWith(testPath_Fetch1)).to.be.true;
        });

        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
            expect(stats?.response).to.be.undefined;
        });
    });

    it("Bypass - xhr", () => {
        cy.bypassInterceptorResponse(`**/${testPath_Fetch2}`);

        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    duration,
                    method: "POST",
                    path: testPath_Fetch2,
                    type: "xhr"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.stopTiming().should("be.gt", duration);

        cy.interceptor().then((interceptor) => {
            const bypassRequest = interceptor.debugInfo.find((entry) => entry.type === "bypass");

            expect(bypassRequest).not.to.be.undefined;
            expect(bypassRequest?.method).to.eq("POST");
            expect(bypassRequest?.url.endsWith(testPath_Fetch2)).to.be.true;
        });

        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
            expect(stats?.response).to.be.undefined;
        });
    });

    /**
     * This test fails without bypassing. Big response cause not finishing the request in the browser.
     * It does not work in the command line with a newer Electron.
     */
    it.skip("Big data response - fetch", () => {
        cy.bypassInterceptorResponse(`**/${testPath_Fetch1}`);

        cy.visit(
            getDynamicUrl([
                {
                    bigData: true,
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        getResponseStatus(testPath_Fetch1).should("eq", 200);
    });

    /**
     * This test fails without bypassing. Big response cause not finishing the request in the browser.
     * It does not work in the command line with a newer Electron.
     */
    it.skip("Big data response - xhr", () => {
        cy.bypassInterceptorResponse(`**/${testPath_Fetch2}`);

        cy.visit(
            getDynamicUrl([
                {
                    bigData: true,
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch2,
                    type: "xhr"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        getResponseStatus(testPath_Fetch2).should("eq", 200);
    });
});
