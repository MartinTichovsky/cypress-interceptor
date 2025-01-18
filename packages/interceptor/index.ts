import { createRequestProxy } from "./createRequestProxy";
import { Interceptor } from "./Interceptor";
import {
    IMockResponse,
    IMockResponseOptions,
    InterceptorOptions,
    IRouteMatcher,
    IThrottleRequestOptions,
    WaitUntilRequestOptions,
    WriteStatsOptions
} from "./Interceptor.types";
import { RequestProxy } from "./RequestProxy";
import { StringMatcher } from "./WebsocketInterceptor.types";

const createCommands = () => {
    let timeStart: number | undefined = undefined;
    let timeStop: number | undefined = undefined;

    const requestProxy = new RequestProxy();
    const interceptor = new Interceptor(requestProxy);

    cy.on("window:before:load", createRequestProxy(requestProxy));

    Cypress.Commands.add("interceptor", () => cy.wrap(interceptor));
    Cypress.Commands.add("interceptorLastRequest", (routeMatcher?: IRouteMatcher) =>
        cy.wrap(interceptor.getLastRequest(routeMatcher))
    );
    Cypress.Commands.add("interceptorOptions", (options?: InterceptorOptions) =>
        cy.wrap(interceptor.setOptions(options))
    );
    Cypress.Commands.add("interceptorRequestCalls", (routeMatcher?: IRouteMatcher) =>
        cy.wrap(interceptor.requestCalls(routeMatcher))
    );
    Cypress.Commands.add("interceptorStats", (routeMatcher?: IRouteMatcher) =>
        cy.wrap(interceptor.getStats(routeMatcher))
    );
    Cypress.Commands.add(
        "mockInterceptorResponse",
        (routeMatcher: IRouteMatcher, mock: IMockResponse, options?: IMockResponseOptions) =>
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
    Cypress.Commands.add(
        "throttleInterceptorRequest",
        (routeMatcher: IRouteMatcher, delay: number, options?: IThrottleRequestOptions) =>
            cy.wrap(interceptor.throttleRequest(routeMatcher, delay, options))
    );
    Cypress.Commands.add(
        "waitUntilRequestIsDone",
        (stringMatcherOrOptions?: StringMatcher | WaitUntilRequestOptions, errorMessage?: string) =>
            interceptor.waitUntilRequestIsDone(stringMatcherOrOptions, errorMessage)
    );
    Cypress.Commands.add(
        "writeInterceptorStatsToLog",
        (
            outputDir: string,
            options?: WriteStatsOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
        ) => interceptor.writeStatsToLog(outputDir, options)
    );
};

beforeEach(() => {
    createCommands();
});

// FOR DEBUG

// afterEach(function () {
//     cy.writeInterceptorStatsToLog("./_stats");
// });
