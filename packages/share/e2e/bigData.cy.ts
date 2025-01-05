import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

/**
 * Cypress.intercept has problems with big data and the response never
 * hits the caller's code when req.continue provided with a custom function.
 */
describe("Big Data", () => {
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "test/api-2";

    it("Fetch", () => {
        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    bigData: true,
                    delay: 100,
                    method: "POST",
                    path: testPath_api_1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone({ timeout: 300000 });

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.request.method).to.eq("POST");
            expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
        });
    });

    it("Xhr", () => {
        cy.startTiming();

        cy.visit(
            getDynamicUrl([
                {
                    bigData: true,
                    delay: 100,
                    method: "POST",
                    path: testPath_api_2,
                    type: "xhr"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.waitUntilRequestIsDone({ timeout: 300000 });

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.request.method).to.eq("POST");
            expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
        });
    });
});
