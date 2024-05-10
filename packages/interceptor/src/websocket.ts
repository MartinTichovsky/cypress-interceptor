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
    Cypress.Commands.add("wsInterceptorStats", (matcher) =>
        cy.wrap(websocketInterceptor.getStats(matcher))
    );
    Cypress.Commands.add("wsResetInterceptorWatch", () => websocketInterceptor.resetWatch());
    Cypress.Commands.add("waitUntilWebsocketAction", (...args) =>
        websocketInterceptor.waitUntilWebsocketAction(
            ...(args as Parameters<typeof websocketInterceptor.waitUntilWebsocketAction>)
        )
    );
});

// FOR DEBUG

// afterEach(function () {
//     cy.wsInterceptor().then((wsInterceptor) => {
//         if (wsInterceptor.callStack.length) {
//             wsInterceptor.writeStatsToLog("./_stats");
//         }
//     });
// });
