import { createWebsocketProxy } from "./createWebsocketProxy";
import { WebsocketInterceptor } from "./WebsocketInterceptor";
import { IWSMatcher, WriteStatsOptions } from "./WebsocketInterceptor.types";
import { WebsocketListener } from "./websocketListener";

export * from "./WebsocketInterceptor";

const createCommands = () => {
    const websocketListener = new WebsocketListener();

    Cypress.on("window:before:load", createWebsocketProxy(websocketListener));

    const websocketInterceptor = new WebsocketInterceptor(websocketListener);

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
};

// this technique is used to ensure the commands are loaded when using it in before hooks

before(() => {
    createCommands();
});

afterEach(() => {
    createCommands();
});

// FOR DEBUG

// afterEach(function () {
//     cy.wsInterceptorStatsToLog("./_stats");
// });
