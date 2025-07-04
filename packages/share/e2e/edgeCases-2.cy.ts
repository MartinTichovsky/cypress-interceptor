import "cypress-interceptor";
import "cypress-interceptor/websocket";
import "cypress-interceptor/test.unit.commands";

import { CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED } from "cypress-interceptor/src/createFetchProxy";
import { CYPRESS_ENV_KEY_WEBSOCKET_PROXY_DISABLED } from "cypress-interceptor/src/createWebsocketProxy";
import { CYPRESS_ENV_KEY_XHR_PROXY_DISABLED } from "cypress-interceptor/src/createXMLHttpRequestProxy";
import { HOST, SERVER_URL } from "cypress-interceptor-server/src/resources/constants";

import { createXMLHttpRequestTest, wait, wrap, XMLHttpRequestLoad } from "../src/utils";

const createTests = (disableInterceptor: boolean, withvisit?: "after" | "before") => {
    describe(`${disableInterceptor ? "Without" : "With"} proxy`, () => {
        const url = `http://${HOST}/test`;
        const urlBrokenStream = `http://${HOST}/${SERVER_URL.BrokenStream}`;

        beforeEach(() => {
            cy.callLineEnable();

            if (withvisit === "before") {
                cy.visit("/");
            }

            if (disableInterceptor) {
                cy.destroyInterceptor();
                cy.destroyWsInterceptor();

                wrap(() => {
                    expect(Cypress.env(CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED)).to.eq(true);
                    expect("originFetch" in window).to.eq(false);

                    expect(Cypress.env(CYPRESS_ENV_KEY_XHR_PROXY_DISABLED)).to.eq(true);
                    expect("originXMLHttpRequest" in window).to.eq(false);

                    expect(Cypress.env(CYPRESS_ENV_KEY_WEBSOCKET_PROXY_DISABLED)).to.eq(true);
                    expect("originWebSocket" in window).to.eq(false);
                });
            } else {
                cy.recreateInterceptor();
                cy.recreateWsInterceptor();

                wrap(() => {
                    expect(Cypress.env(CYPRESS_ENV_KEY_FETCH_PROXY_DISABLED)).to.eq(false);
                    expect("originFetch" in window).to.eq(true);

                    expect(Cypress.env(CYPRESS_ENV_KEY_XHR_PROXY_DISABLED)).to.eq(false);
                    expect("originXMLHttpRequest" in window).to.eq(true);

                    expect(Cypress.env(CYPRESS_ENV_KEY_WEBSOCKET_PROXY_DISABLED)).to.eq(false);
                    expect("originWebSocket" in window).to.eq(true);
                });
            }

            if (withvisit === "after") {
                cy.visit("/");
            }
        });

        it(`The proxy should be ${disableInterceptor ? "disabled" : "enabled"}`, async () => {
            const responseFetch = await fetch(url);

            expect(responseFetch.status).to.eq(200);
            expect(await responseFetch.text()).to.eq("{}");

            const responseXHR = new XMLHttpRequest();

            responseXHR.open("GET", url);
            responseXHR.send();

            await wait(500);

            expect(responseXHR.status).to.eq(200);
            expect(responseXHR.response).to.eq("{}");

            cy.interceptorStats().then((stats) => {
                expect(stats.length).to.eq(disableInterceptor ? 0 : 2);
            });
        });

        createXMLHttpRequestTest("Should return the correct response", async (onResponse) => {
            const request = new XMLHttpRequest();

            request.open("GET", url);
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            await new Promise((resolve) => {
                onResponse(request, () => {
                    setTimeout(() => {
                        resolve(null);
                    }, 500);
                });

                request.send();
            }).then(() => {
                expect(request.response).to.deep.eq({});
                cy.callLine().then((callLine) => expect(callLine.length).to.eq(0));
            });
        });

        it("Should call `onreadystatechange` between states", async () => {
            const request = new XMLHttpRequest();

            request.open("GET", new URL(url));
            request.responseType = "json";
            request.setRequestHeader("Content-Type", "application/json");

            let betweenStateCalledCount = 0;
            let loadCalled = false;

            await new Promise((resolve) => {
                request.onreadystatechange = () => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        // a delay for other methods to be called before the next step
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    } else {
                        betweenStateCalledCount++;
                    }
                };

                request.onload = () => {
                    loadCalled = true;
                };

                request.send();
            }).then(() => {
                expect(request.response).to.deep.eq({});
                expect(betweenStateCalledCount).to.be.above(0);
                expect(loadCalled).to.be.true;
                cy.callLine().then((callLine) => expect(callLine.length).to.eq(0));
            });
        });

        createXMLHttpRequestTest(
            "Should fail when reading text from a broken strem",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                let onerror: unknown;

                request.open("GET", urlBrokenStream);

                await new Promise((resolve) => {
                    request.onerror = function (ev) {
                        onerror = ev.type;
                    };

                    onResponse(request, () => {
                        // a delay for `onerror` to be called
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                }).then(() => {
                    expect(onerror).not.to.be.undefined;
                    cy.callLine().then((callLine) => expect(callLine.length).to.eq(0));
                });
            },
            [
                XMLHttpRequestLoad.AddEventListener_Readystatechange,
                XMLHttpRequestLoad.Onreadystatechange
            ]
        );

        createXMLHttpRequestTest(
            "Should fail with the correct error message when cancelled",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                let onabort: unknown;
                let onerror: unknown;

                request.open("GET", url + "?duration=2000");
                request.responseType = "json";
                request.setRequestHeader("Content-Type", "application/json");

                new Promise((resolve) => {
                    request.onabort = (ev) => {
                        onabort = ev.type;
                    };

                    request.onerror = function (ev) {
                        onerror = ev.type;
                    };

                    onResponse(request, () => {
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                });

                setTimeout(() => {
                    request.abort();
                }, 100);

                await wait(1000);

                expect(onabort).not.to.be.undefined;
                expect(onabort).to.eq("abort");
                expect(onerror).to.be.undefined;
                cy.callLine().then((callLine) => expect(callLine.length).to.eq(0));
            }
        );

        createXMLHttpRequestTest(
            "Should work when passing null - without error",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                request.open("GET", url);
                request.responseType = "json";
                request.setRequestHeader("Content-Type", "application/json");

                request.onabort = null;
                request.onerror = null;
                request.onload = null;
                request.onloadstart = null;
                request.onprogress = null;
                request.onreadystatechange = null;
                request.ontimeout = null;

                await new Promise((resolve) => {
                    onResponse(request, () => {
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                }).then(() => {
                    expect(request.response).to.deep.eq({});
                    cy.callLine().then((callLine) => expect(callLine.length).to.eq(0));
                });
            }
        );

        createXMLHttpRequestTest(
            "Should work when passing null - with error",
            async (onResponse) => {
                const request = new XMLHttpRequest();

                request.open("GET", urlBrokenStream);

                request.onabort = null;
                request.onerror = null;
                request.onload = null;
                request.onloadstart = null;
                request.onprogress = null;
                request.onreadystatechange = null;
                request.ontimeout = null;

                await new Promise((resolve) => {
                    onResponse(request, () => {
                        // a delay for `onerror` to be called
                        setTimeout(() => {
                            resolve(null);
                        }, 500);
                    });

                    request.send();
                }).then(() => {
                    cy.callLine().then((callLine) => expect(callLine.length).to.eq(0));
                });
            },
            [
                XMLHttpRequestLoad.AddEventListener_Readystatechange,
                XMLHttpRequestLoad.Onreadystatechange
            ]
        );

        it("should handle WebSocket with ping/pong", async () => {
            return new Promise((resolve) => {
                const ws = new WebSocket(`ws://${HOST}/ping-test`);

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

                ws.onmessage = (event) => {
                    if (event.data === response) {
                        resolve(undefined);
                    }
                };
            });
        });
    });
};

// we must be sure that the tests are applicable to the original fetch, xhr and websocket
createTests(true);
createTests(true, "before");
createTests(true, "after");
// tests with interceptor enabled
createTests(false);
createTests(false, "before");
createTests(false, "after");
