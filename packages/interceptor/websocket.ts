/// <reference types="cypress" preserve="true" />

import { createWebsocketProxy } from "./createWebsocketProxy";
import { WebsocketInterceptor } from "./WebsocketInterceptor";
import {
    IWSMatcher,
    WindowTypeOfWebsocketProxy,
    WriteStatsOptions
} from "./WebsocketInterceptor.types";
import { WebsocketListener } from "./websocketListener";

export * from "./WebsocketInterceptor";

(() => {
    const websocketListener = new WebsocketListener();
    let websocketInterceptor = new WebsocketInterceptor(websocketListener);

    // to be able use it without cy.visit
    createWebsocketProxy(websocketListener)(window as WindowTypeOfWebsocketProxy);

    // create the proxy in each window
    Cypress.on("window:before:load", createWebsocketProxy(websocketListener));

    // register commands
    Cypress.Commands.add("wsInterceptor", () => cy.wrap(websocketInterceptor));
    Cypress.Commands.add("wsInterceptorLastRequest", (matcher?: IWSMatcher) =>
        cy.wrap(websocketInterceptor.getLastRequest(matcher))
    );
    Cypress.Commands.add("wsInterceptorStats", (matcher?: IWSMatcher) =>
        cy.wrap(websocketInterceptor.getStats(matcher))
    );
    Cypress.Commands.add(
        "wsInterceptorStatsToLog",
        (
            outputDir: string,
            options?: WriteStatsOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
        ) => websocketInterceptor.writeStatsToLog(outputDir, options)
    );
    Cypress.Commands.add("wsResetInterceptorWatch", () => websocketInterceptor.resetWatch());
    Cypress.Commands.add("waitUntilWebsocketAction", (...args: unknown[]) =>
        websocketInterceptor.waitUntilWebsocketAction(
            ...(args as Parameters<typeof websocketInterceptor.waitUntilWebsocketAction>)
        )
    );

    // reset the instance in each run
    Cypress.on("test:before:run", () => {
        websocketInterceptor = new WebsocketInterceptor(websocketListener);
    });
})();

// FOR DEBUG

// afterEach(function () {
//     cy.wsInterceptorStatsToLog("./_stats");
// });
