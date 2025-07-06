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
import { CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED } from "./src/createFetchProxy";
import { createRequestProxy } from "./src/createRequestProxy";
import { CYPRESS_ENV_KEY_XHR_PROXY_DISABLED } from "./src/createXMLHttpRequestProxy";
import { RequestProxy } from "./src/RequestProxy";

(() => {
    const startTime = new Date().getTime();
    let timeStart: number | undefined = undefined;
    let timeStop: number | undefined = undefined;

    const requestProxy = new RequestProxy();
    let interceptor = new Interceptor(requestProxy, startTime);

    // to be able use it without cy.visit
    createRequestProxy(requestProxy)(window as WindowTypeOfRequestProxy);

    // create the proxy in each window
    Cypress.on("window:before:load", createRequestProxy(requestProxy));

    // register commands
    Cypress.Commands.add("destroyInterceptor", () => {
        Cypress.env(CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED, true);
        Cypress.env(CYPRESS_ENV_KEY_XHR_PROXY_DISABLED, true);

        const globalWin = window as WindowTypeOfRequestProxy;

        if ("originFetch" in globalWin && globalWin.originFetch) {
            globalWin.fetch = globalWin.originFetch;
            delete globalWin["originFetch"];
        }

        if ("originXMLHttpRequest" in globalWin && globalWin.originXMLHttpRequest) {
            globalWin.XMLHttpRequest = globalWin.originXMLHttpRequest;
            delete globalWin["originXMLHttpRequest"];
        }

        cy.window().then((win: WindowTypeOfRequestProxy) => {
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
        Cypress.env(CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED, false);
        Cypress.env(CYPRESS_ENV_KEY_XHR_PROXY_DISABLED, false);

        interceptor = new Interceptor(requestProxy, startTime);

        // to be able use it without cy.visit
        createRequestProxy(requestProxy)(window as WindowTypeOfRequestProxy);

        cy.window().then(createRequestProxy(requestProxy));
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
        interceptor = new Interceptor(requestProxy, startTime);
    });
})();

// FOR DEBUG

// afterEach(function () {
//     cy.writeInterceptorStatsToLog("./_stats");
// });
