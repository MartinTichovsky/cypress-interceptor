import { Interceptor } from "./interceptor";

beforeEach(() => {
    const interceptor = new Interceptor();
    let timeStart: number | undefined = undefined;
    let timeStop: number | undefined = undefined;

    Cypress.Commands.add("howManyTimesHasBeenRequestCalled", (routeMatcher) =>
        cy.wrap(interceptor.howManyTimesHasBeenRequestCalled(routeMatcher))
    );
    Cypress.Commands.add("interceptor", () => cy.wrap(interceptor));
    Cypress.Commands.add("interceptorLastRequest", (routeMatcher) =>
        cy.wrap(interceptor.getLastRequest(routeMatcher))
    );
    Cypress.Commands.add("interceptorStats", (routeMatcher) =>
        cy.wrap(interceptor.getStats(routeMatcher))
    );
    Cypress.Commands.add("mockResponse", (urlMatcher, mock, options) =>
        cy.wrap(interceptor.mockResponse(urlMatcher, mock, options))
    );
    Cypress.Commands.add("resetInterceptorWatch", () => interceptor.resetWatch());
    Cypress.Commands.add("setInterceptorOptions", (options) => interceptor.setOptions(options));
    Cypress.Commands.add("startTiming", () => {
        timeStart = performance.now();
        return cy.wrap(timeStart, { timeout: 0 });
    });
    Cypress.Commands.add("stopTiming", () => {
        timeStop = performance.now();
        return cy.wrap(timeStart !== undefined ? timeStop - timeStart : undefined, {
            timeout: 0
        });
    });
    Cypress.Commands.add("throttleRequest", (urlMatcher, delay, options) =>
        cy.wrap(interceptor.throttleRequest(urlMatcher, delay, options))
    );
    Cypress.Commands.add("waitUntilRequestIsDone", (matcherOrOptions, errorTitle) =>
        interceptor.waitUntilRequestIsDone(matcherOrOptions, errorTitle)
    );
});

/// FOR DEBUG ///

// afterEach(function () {
//     cy.interceptor().then((interceptor) => {
//         if (interceptor.debugIsEnabled) {
//             interceptor.writeDebugToLog(this.currentTest, "./_logs");
//             // interceptor.writeStatsToLog(this.currentTest, "./_stats");
//         }
//     });
// });
