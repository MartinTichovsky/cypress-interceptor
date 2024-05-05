import { WebsocketInterceptor } from "./websocketInterceptor";
import { WebsocketListener } from "./websocketListener";
import { createWebsocketProxy } from "./websocketProxy";

beforeEach(() => {
    const websocketListener = new WebsocketListener();

    Cypress.on("window:before:load", createWebsocketProxy(websocketListener));

    const websocketInterceptor = new WebsocketInterceptor(websocketListener);

    Cypress.Commands.add("wsInterceptor", () => cy.wrap(websocketInterceptor));
    Cypress.Commands.add("wsInterceptorLastRequest", (matcher) =>
        cy.wrap(websocketInterceptor.getLastRequest(matcher))
    );
    Cypress.Commands.add("waitUntilWebsocketAction", (...args) =>
        websocketInterceptor.waitUntilWebsocketAction(
            ...(args as Parameters<typeof websocketInterceptor.waitUntilWebsocketAction>)
        )
    );
});

// FOR DEBUG

// afterEach(function () {
//     cy.wsInterceptor().then((wsInterceptor) => {
//         wsInterceptor.writeStatsToLog(Cypress.currentTest, "./_stats");
//     });
// });
