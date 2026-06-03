import { HOST, I_TEST_ID_HEADER } from "cypress-interceptor-server/src/resources/constants";

import { getCounter, resetCounter } from "../src/counter";
import { getTestId, resourceTypeIt } from "../src/utils";

describe("Delay Request", () => {
    const testPath = "/api/delay-request";
    const delay = 2000;

    const fireRequest = (
        win: Cypress.AUTWindow,
        resourceType: "fetch" | "xhr",
        url: string,
        iTestId: string
    ) => {
        if (resourceType === "fetch") {
            void win.fetch(url, {
                headers: { [I_TEST_ID_HEADER]: iTestId },
                method: "GET"
            });
        } else {
            const xhr = new win.XMLHttpRequest();

            xhr.open("GET", url);
            xhr.setRequestHeader(I_TEST_ID_HEADER, iTestId);
            xhr.send();
        }
    };

    resourceTypeIt("does not hit the back-end during the delay", (resourceType) => {
        const iTestId = getTestId();

        cy.delayInterceptorRequest({ resourceType }, delay);

        cy.visit("/");

        resetCounter(iTestId).then((reset) => {
            const resetTimestamp = reset.body.timestamp;

            cy.window().then((win) => {
                fireRequest(win, resourceType, `${win.location.origin}${testPath}`, iTestId);
            });

            // while the request is being delayed, the back-end must not be hit yet
            cy.wait(delay / 2);

            getCounter(iTestId).then((counter) => {
                expect(counter.body).to.have.length(0);
            });

            // wait until the delayed request is finally sent and finished
            cy.waitUntilRequestIsDone();

            getCounter(iTestId).then((counter) => {
                expect(counter.body).to.have.length(1);
                expect(counter.body[0].url).to.eq(`http://${HOST}${testPath}`);
                // the back-end was hit only after the delay elapsed
                expect(counter.body[0].timestamp - resetTimestamp).to.be.gte(delay);
            });

            cy.interceptorLastRequest(`**${testPath}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.requestDelay).to.eq(delay);
            });
        });
    });
});
