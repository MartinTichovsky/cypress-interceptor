import { getDynamicUrl, getIframeDynamicUrl } from "cypress-interceptor-server/src/utils";

const iframeId_1 = "dynamicFrame-1";
const iframeId_2 = "dynamicFrame-2";
const testPath_Fetch_1 = "iframe/fetch-1";
const testPath_Fetch_2 = "iframe/fetch-2";
const testPath_Fetch_3 = "iframe/fetch-3";
const testPath_Fetch_4 = "iframe/fetch-4";
const testPath_Fetch_5 = "iframe/fetch-5";

describe("Using Interceptor inside an IFRAME", () => {
    const multipIframeTest = (type: "fetch" | "xhr") => {
        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].url.pathname.endsWith(testPath_Fetch_1)).to.be.true;
            expect(stats[1].url.pathname.endsWith(testPath_Fetch_2)).to.be.true;
        });

        cy.get(`#${iframeId_1}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.true;
                expect("originXMLHttpRequest" in win).to.be.true;
            });

        cy.get(`#${iframeId_2}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.true;
                expect("originXMLHttpRequest" in win).to.be.true;
            });

        cy.destroyInterceptorInsideIframe();

        // when the original is destroyed, after new visit it should no more observe the network
        cy.visit(
            getIframeDynamicUrl([
                {
                    id: iframeId_1,
                    requests: [
                        {
                            delay: 100,
                            method: "POST",
                            path: testPath_Fetch_3,
                            type
                        }
                    ]
                },
                {
                    id: iframeId_2,
                    requests: [
                        {
                            delay: 200,
                            method: "POST",
                            path: testPath_Fetch_4,
                            type
                        }
                    ]
                }
            ])
        );

        cy.wait(1000);

        cy.interceptorStats().then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].url.pathname.endsWith(testPath_Fetch_1)).to.be.true;
            expect(stats[1].url.pathname.endsWith(testPath_Fetch_2)).to.be.true;
        });

        cy.get(`#${iframeId_1}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.false;
                expect("originXMLHttpRequest" in win).to.be.false;
            });

        cy.get(`#${iframeId_2}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.false;
                expect("originXMLHttpRequest" in win).to.be.false;
            });
    };

    const singleIframeTest = (type: "fetch" | "xhr") => {
        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].url.pathname.endsWith(testPath_Fetch_1)).to.be.true;
        });

        cy.get(`#${iframeId_1}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.true;
                expect("originXMLHttpRequest" in win).to.be.true;
            });

        cy.get(`#${iframeId_2}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.false;
                expect("originXMLHttpRequest" in win).to.be.false;
            });

        cy.destroyInterceptorInsideIframe();

        // when the original is destroyed, after new visit it should no more observe the network
        cy.visit(
            getIframeDynamicUrl([
                {
                    id: iframeId_1,
                    requests: [
                        {
                            delay: 100,
                            method: "POST",
                            path: testPath_Fetch_3,
                            type
                        }
                    ]
                },
                {
                    id: iframeId_2,
                    requests: [
                        {
                            delay: 100,
                            method: "POST",
                            path: testPath_Fetch_4,
                            type
                        }
                    ]
                }
            ])
        );

        cy.wait(1000);

        cy.interceptorStats().then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].url.pathname.endsWith(testPath_Fetch_1)).to.be.true;
        });

        cy.get(`#${iframeId_1}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.false;
                expect("originXMLHttpRequest" in win).to.be.false;
            });

        cy.get(`#${iframeId_2}`)
            .its("0.contentWindow")
            .then((win) => {
                expect("originFetch" in win).to.be.false;
                expect("originXMLHttpRequest" in win).to.be.false;
            });
    };

    const visit = (type: "fetch" | "xhr") => {
        cy.visit(
            getIframeDynamicUrl([
                {
                    id: iframeId_1,
                    requests: [
                        {
                            delay: 100,
                            method: "POST",
                            path: testPath_Fetch_1,
                            type
                        }
                    ]
                },
                {
                    id: iframeId_2,
                    requests: [
                        {
                            delay: 200,
                            method: "POST",
                            path: testPath_Fetch_2,
                            type
                        }
                    ]
                }
            ])
        );
    };

    describe("Should work when registering the interceptor before visit - single select", () => {
        beforeEach(() => {
            cy.enableInterceptorInsideIframe(`#${iframeId_1}`);
        });

        it("Fetch", () => {
            cy.wait(1000);

            visit("fetch");

            singleIframeTest("fetch");
        });

        it("XHR", () => {
            cy.wait(1000);

            visit("xhr");

            singleIframeTest("xhr");
        });
    });

    describe("Should work when registering the interceptor before visit - multiple select", () => {
        beforeEach(() => {
            cy.enableInterceptorInsideIframe("iframe");
        });

        it("Fetch", () => {
            cy.wait(1000);

            visit("fetch");

            multipIframeTest("fetch");
        });

        it("XHR", () => {
            cy.wait(1000);

            visit("xhr");

            multipIframeTest("xhr");
        });
    });

    describe("Should work when registering the interceptor after visit", () => {
        it("Fetch - single select", () => {
            visit("fetch");

            cy.enableInterceptorInsideIframe(`#${iframeId_1}`);

            singleIframeTest("fetch");
        });

        it("Fetch - element single select", () => {
            visit("fetch");

            cy.enableInterceptorInsideIframe(cy.get(`#${iframeId_1}`));

            singleIframeTest("fetch");
        });

        it("Fetch - jquery single select", () => {
            visit("fetch");

            cy.get(`#${iframeId_1}`).then(($element) => cy.enableInterceptorInsideIframe($element));

            singleIframeTest("fetch");
        });

        it("Fetch - element multiple select", () => {
            visit("fetch");

            cy.enableInterceptorInsideIframe(cy.get("iframe"));

            multipIframeTest("fetch");
        });

        it("Fetch - jquery element select", () => {
            visit("fetch");

            cy.get("iframe").then(($element) => cy.enableInterceptorInsideIframe($element));

            multipIframeTest("fetch");
        });

        it("Fetch - multiple select", () => {
            cy.wait(1000);

            visit("fetch");

            cy.enableInterceptorInsideIframe("iframe");

            multipIframeTest("fetch");
        });

        it("XHR - single select", () => {
            visit("fetch");

            cy.enableInterceptorInsideIframe(`#${iframeId_1}`);

            singleIframeTest("fetch");
        });

        it("XHR - element single select", () => {
            visit("xhr");

            cy.enableInterceptorInsideIframe(cy.get(`#${iframeId_1}`));

            singleIframeTest("xhr");
        });

        it("XHR - jquery single select", () => {
            visit("xhr");

            cy.get(`#${iframeId_1}`).then(($element) => cy.enableInterceptorInsideIframe($element));

            singleIframeTest("xhr");
        });

        it("XHR - element multiple select", () => {
            visit("xhr");

            cy.enableInterceptorInsideIframe(cy.get("iframe"));

            multipIframeTest("xhr");
        });

        it("XHR - jquery element select", () => {
            visit("xhr");

            cy.get("iframe").then(($element) => cy.enableInterceptorInsideIframe($element));

            multipIframeTest("xhr");
        });

        it("XHR - multiple select", () => {
            cy.wait(1000);

            visit("xhr");

            cy.enableInterceptorInsideIframe("iframe");

            multipIframeTest("xhr");
        });
    });

    describe("Should not fail when changing the url", () => {
        it("Visit an another URL after the test", () => {
            visit("fetch");

            cy.enableInterceptorInsideIframe("iframe");

            cy.waitUntilRequestIsDone();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch_5,
                        type: "fetch"
                    }
                ])
            );

            cy.get("iframe").should("not.exist");

            cy.waitUntilRequestIsDone();

            cy.interceptorStats().then((stats) => {
                expect(stats.length).to.eq(3);
                expect(stats[0].url.pathname.endsWith(testPath_Fetch_1)).to.be.true;
                expect(stats[1].url.pathname.endsWith(testPath_Fetch_2)).to.be.true;
                expect(stats[2].url.pathname.endsWith(testPath_Fetch_5)).to.be.true;
            });
        });
    });
});
