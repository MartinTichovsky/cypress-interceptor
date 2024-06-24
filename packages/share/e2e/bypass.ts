import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

describe("Bypass", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";

    const duration = 8000;

    it("Bypass fetch", () => {
        cy.bypassInterceptorRequest(`**/${testPath_Fetch1}`);

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
    });

    it("Bypass fetch", () => {
        cy.bypassInterceptorRequest(`**/${testPath_Fetch2}`);

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
    });
});
