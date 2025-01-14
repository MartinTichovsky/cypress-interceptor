import { createWebsocketProxy } from "../src/createWebsocketProxy";
import { WebsocketInterceptor } from "./WebsocketInterceptor";
import { WebsocketListener } from "./websocketListener";

const createCommands = () => {
    const websocketListener = new WebsocketListener();

    cy.on("window:before:load", createWebsocketProxy(websocketListener));

    const websocketInterceptor = new WebsocketInterceptor(websocketListener);

    Cypress.Commands.add("wsInterceptor", () => cy.wrap(websocketInterceptor));
    Cypress.Commands.add("wsInterceptorLastRequest", (matcher) =>
        cy.wrap(websocketInterceptor.getLastRequest(matcher))
    );
    Cypress.Commands.add("wsInterceptorStats", (matcher) =>
        cy.wrap(websocketInterceptor.getStats(matcher))
    );
    Cypress.Commands.add("wsInterceptorStatsToLog", (outputDir, options) =>
        cy.wrap(websocketInterceptor.writeStatsToLog(outputDir, options))
    );
    Cypress.Commands.add("wsResetInterceptorWatch", () => websocketInterceptor.resetWatch());
    Cypress.Commands.add("waitUntilWebsocketAction", (...args) =>
        websocketInterceptor.waitUntilWebsocketAction(
            ...(args as Parameters<typeof websocketInterceptor.waitUntilWebsocketAction>)
        )
    );
};

beforeEach(() => {
    createCommands();
});

// FOR DEBUG

// afterEach(function () {
//     cy.wsInterceptorStatsToLog("./_stats");
// });
