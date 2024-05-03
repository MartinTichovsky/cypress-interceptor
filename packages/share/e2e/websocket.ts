import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

describe("Websocket", () => {
    it.only("Basic", () => {
        cy.interceptorOptions({ resourceTypes: "all" });

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    body: "aa",
                    responseBody: "bbb",
                    path: "wss",
                    type: "websocket"
                }
            ])
        );

        cy.interceptor().then((interceptor) => {
            //  debugger;
        });
    });
});
