import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

describe("Websocket", () => {
    it("Basic", () => {
        cy.visit(
            getDynamicUrl([
                {
                    data: "send data 1",
                    duration: 5000,
                    path: "aaa",
                    response: "some response 1",
                    type: "websocket"
                },
                {
                    data: "send data 2",
                    delay: 5000,
                    path: "bbb",
                    response: "some response 2",
                    type: "websocket"
                }
            ])
        );

        cy.waitUntilWebsocketAction([
            {
                type: "onmessage"
            },
            {
                type: "send",
                url: "**/bbb"
            }
        ]);
    });
});
