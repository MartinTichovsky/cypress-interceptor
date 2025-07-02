/// <reference types="cypress" preserve="true" />

import { Interceptor } from "./Interceptor";
import {
    IMockResponse,
    IMockResponseOptions,
    InterceptorOptions,
    IRouteMatcher,
    IThrottleRequestOptions,
    WindowTypeOfRequestProxy,
    WriteStatsOptions
} from "./Interceptor.types";
import { createRequestProxy } from "./src/createRequestProxy";
import { RequestProxy } from "./src/RequestProxy";

(() => {
    let timeStart: number | undefined = undefined;
    let timeStop: number | undefined = undefined;

    const requestProxy = new RequestProxy();
    let interceptor = new Interceptor(requestProxy);

    // to be able use it without cy.visit
    createRequestProxy(requestProxy)(window as WindowTypeOfRequestProxy);

    // create the proxy in each window
    Cypress.on("window:before:load", createRequestProxy(requestProxy));

    // register commands
    Cypress.Commands.add("destroyInterceptor", () => {
        cy.window().then((_win) => {
            const win = _win as WindowTypeOfRequestProxy;

            if ("originFetch" in win && win.originFetch) {
                win.fetch = win.originFetch;
                delete win["originFetch"];
            }

            if ("originXMLHttpRequest" in win && win.originXMLHttpRequest) {
                win.XMLHttpRequest = win.originXMLHttpRequest;
                delete win["originXMLHttpRequest"];
            }
        });
    });
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
    Cypress.Commands.add("recreateInterceptor", () => {
        interceptor = new Interceptor(requestProxy);
        cy.window().then((win) => createRequestProxy(requestProxy)(win));
    });
    Cypress.Commands.add("reproduceNetCom", (stats, options) => {
        interceptor.reproduceNetCom(stats, options);
    });
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
    Cypress.Commands.add("waitUntilRequestIsDone", (...args: unknown[]) =>
        interceptor.waitUntilRequestIsDone(
            ...(args as Parameters<typeof interceptor.waitUntilRequestIsDone>)
        )
    );
    Cypress.Commands.add(
        "writeInterceptorStatsToLog",
        (
            outputDir: string,
            options?: WriteStatsOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
        ) => interceptor.writeStatsToLog(outputDir, options)
    );

    // reset the instance in each run
    Cypress.on("test:before:run", () => {
        interceptor = new Interceptor(requestProxy);
    });
})();

// FOR DEBUG

// afterEach(function () {
//     cy.writeInterceptorStatsToLog("./_stats");
// });
