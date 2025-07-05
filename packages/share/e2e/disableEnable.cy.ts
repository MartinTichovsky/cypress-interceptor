import "cypress-interceptor";
import "cypress-interceptor/websocket";

import { CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED } from "cypress-interceptor/src/createFetchProxy";
import { CYPRESS_ENV_KEY_WEBSOCKET_PROXY_DISABLED } from "cypress-interceptor/src/createWebsocketProxy";
import { CYPRESS_ENV_KEY_XHR_PROXY_DISABLED } from "cypress-interceptor/src/createXMLHttpRequestProxy";
import { HOST } from "cypress-interceptor-server/src/resources/constants";

import { wait } from "../src/utils";

const disableEnableInterceptor = (disableInterceptor: boolean) => {
    if (disableInterceptor) {
        cy.destroyInterceptor();
        cy.destroyWsInterceptor();

        cy.window().then((win) => {
            expect(Cypress.env(CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED)).to.eq(true);
            expect("originFetch" in win).to.eq(false);

            expect(Cypress.env(CYPRESS_ENV_KEY_XHR_PROXY_DISABLED)).to.eq(true);
            expect("originXMLHttpRequest" in win).to.eq(false);

            expect(Cypress.env(CYPRESS_ENV_KEY_WEBSOCKET_PROXY_DISABLED)).to.eq(true);
            expect("originWebSocket" in win).to.eq(false);
        });
    } else {
        cy.recreateInterceptor();
        cy.recreateWsInterceptor();

        cy.window().then((win) => {
            expect(Cypress.env(CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED)).to.eq(false);
            expect("originFetch" in win).to.eq(true);

            expect(Cypress.env(CYPRESS_ENV_KEY_XHR_PROXY_DISABLED)).to.eq(false);
            expect("originXMLHttpRequest" in win).to.eq(true);

            expect(Cypress.env(CYPRESS_ENV_KEY_WEBSOCKET_PROXY_DISABLED)).to.eq(false);
            expect("originWebSocket" in win).to.eq(true);
        });
    }
};

const doTest = (disableInterceptor: boolean) => {
    cy.interceptorStats().then((stats) => {
        expect(stats.length).to.eq(0);
    });

    cy.wsInterceptorStats().then((stats) => {
        expect(stats.length).to.eq(0);
    });

    cy.visit("/");

    cy.window().then(async (win) => {
        const urlFetch = `http://${HOST}/test-fetch`;
        const urlXhr = `http://${HOST}/test-xhr`;

        const responseFetch = await win.fetch(urlFetch);

        expect(responseFetch.status).to.eq(200);
        expect(await responseFetch.text()).to.eq("{}");

        const responseXHR = new win.XMLHttpRequest();

        responseXHR.open("GET", urlXhr);
        responseXHR.send();

        await wait(500);

        expect(responseXHR.status).to.eq(200);
        expect(responseXHR.response).to.eq("{}");

        const ws = new win.WebSocket("ws://localhost:3000/ping-test");

        const response = "pong";

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    data: "ping",
                    delay: 500,
                    response
                })
            );
        };

        let responseCalled = false;

        ws.onmessage = (event) => {
            if (event.data === response) {
                responseCalled = true;
            }
        };

        await wait(1000);

        expect(responseCalled).to.be.true;
    });

    cy.interceptorStats().then((stats) => {
        expect(stats.length).to.eq(disableInterceptor ? 0 : 2);
    });

    cy.wsInterceptorStats().then((stats) => {
        expect(stats.length).to.eq(disableInterceptor ? 0 : 4);
    });
};

const createTests = (disableInterceptor: boolean) => {
    describe("Disable / Enable Interceptor - before hook", () => {
        before(() => disableEnableInterceptor(disableInterceptor));

        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - first run`, () => {
            doTest(disableInterceptor);
        });

        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - second run`, () => {
            doTest(disableInterceptor);
        });
    });

    describe("Disable / Enable Interceptor - beforeEach hook", () => {
        beforeEach(() => disableEnableInterceptor(disableInterceptor));

        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - first run`, () => {
            doTest(disableInterceptor);
        });

        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - second run`, () => {
            doTest(disableInterceptor);
        });
    });

    describe("Disable / Enable Interceptor - it", () => {
        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - first run`, () => {
            disableEnableInterceptor(disableInterceptor);

            doTest(disableInterceptor);
        });

        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - second run`, () => {
            disableEnableInterceptor(disableInterceptor);

            doTest(disableInterceptor);
        });
    });

    describe("Disable / Enable Interceptor - all together", () => {
        before(() => disableEnableInterceptor(disableInterceptor));

        beforeEach(() => disableEnableInterceptor(disableInterceptor));

        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - first run`, () => {
            disableEnableInterceptor(disableInterceptor);

            doTest(disableInterceptor);
        });

        it(`Interceptor should be ${disableInterceptor ? "disabled" : "enabled"} - second run`, () => {
            disableEnableInterceptor(disableInterceptor);

            doTest(disableInterceptor);
        });
    });
};

createTests(true);
createTests(false);
createTests(true);
createTests(false);
