import { Interceptor } from "./interceptor";

beforeEach(() => {
    const interceptor = new Interceptor();
    let timeStart: number | undefined = undefined;
    let timeStop: number | undefined = undefined;

    Cypress.Commands.add("interceptor", () => cy.wrap(interceptor));
    Cypress.Commands.add("interceptorLastRequest", (routeMatcher) =>
        cy.wrap(interceptor.getLastRequest(routeMatcher))
    );
    Cypress.Commands.add("interceptorOptions", (options) =>
        cy.wrap(interceptor.setOptions(options))
    );
    Cypress.Commands.add("interceptorRequestCalls", (routeMatcher) =>
        cy.wrap(interceptor.requestCalls(routeMatcher))
    );
    Cypress.Commands.add("interceptorStats", (routeMatcher) =>
        cy.wrap(interceptor.getStats(routeMatcher))
    );
    Cypress.Commands.add("mockInterceptorResponse", (routeMatcher, mock, options) =>
        cy.wrap(interceptor.mockResponse(routeMatcher, mock, options))
    );
    Cypress.Commands.add("resetInterceptorWatch", () => interceptor.resetWatch());
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
    Cypress.Commands.add("throttleInterceptorRequest", (routeMatcher, delay, options) =>
        cy.wrap(interceptor.throttleRequest(routeMatcher, delay, options))
    );
    Cypress.Commands.add("waitUntilRequestIsDone", (stringMatcherOrOptions, errorMessage) =>
        interceptor.waitUntilRequestIsDone(stringMatcherOrOptions, errorMessage)
    );
});

// FOR DEBUG

// afterEach(function () {
//     cy.interceptor().then((interceptor) => {
//         if (interceptor.debugIsEnabled) {
//             interceptor.writeDebugToLog("./_logs");
//         }
//         // interceptor.writeStatsToLog("./_stats");
//     });
// });
