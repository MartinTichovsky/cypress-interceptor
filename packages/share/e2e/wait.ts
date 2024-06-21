import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { fireRequest, toRegExp } from "../src/utils";

describe("Wait For Requests", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";
    const testPath_Fetch3 = "test/fetch-3";
    const testPath_Fetch4 = "api/fetch-4";

    const testPath_Script1 = "sources/script-1.js";
    const testPath_Script2 = "sources/script-2.js";

    const delay = 1000;
    const duration = 1500;
    const doubleDuration = duration * 2;
    const tripleDuration = duration * 3;

    describe("Canceled requests", () => {
        it("POST request without body", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        cancelIn: duration / 2,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: "fetch" });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
            });
        });

        it("POST request with body", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        body: { anythingHere: 2, obj: { page: "yes", end: false } },
                        cancelIn: duration / 2,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: "fetch" });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
            });
        });

        it("GET request", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        cancelIn: duration / 2,
                        delay: 100,
                        duration,
                        method: "GET",
                        path: testPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: "fetch" });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
            });
        });

        it("On fetch error", () => {
            let input: RequestInfo | URL | string | undefined;
            let init: RequestInit | undefined | string;
            let onrejected:
                | ((reason: unknown) => unknown)
                | undefined
                | null
                | ProgressEvent<EventTarget>;

            const spy = {
                func<TResult = never>(
                    [_input, _init]:
                        | [input: RequestInfo | URL, init?: RequestInit | undefined]
                        | [url: string | URL | undefined, method: string | undefined],
                    _ev:
                        | ((reason: unknown) => TResult | PromiseLike<TResult>)
                        | undefined
                        | null
                        | ProgressEvent<EventTarget>
                ) {
                    input = _input;
                    init = _init;
                    onrejected = _ev;
                }
            };

            cy.spy(spy, "func");

            cy.interceptor().then((interceptor) => {
                interceptor.onRequestError(spy.func);
            });

            cy.visit(
                getDynamicUrl([
                    {
                        cancelIn: 1000,
                        delay: 100,
                        duration,
                        method: "GET",
                        path: testPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: "fetch" }).then(() => {
                expect(spy.func).to.be.calledOnce;
                expect(spy.func).to.be.called;
                expect(input).not.to.be.undefined;
                expect(input).to.eq(
                    "http://localhost:3000/test/fetch-1?duration=1500&path=test%2Ffetch-1"
                );
                expect(init).not.to.be.undefined;
                expect(onrejected).not.to.be.undefined;
            });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
            });
        });

        it("XHR", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        cancelIn: duration / 2,
                        body: { data: 5 },
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: { response: "some" },
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: "xhr" });

            cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
            });
        });

        it("Refresh during XHR request", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "xhr"
                    }
                ])
            );

            cy.wait(duration / 2);

            cy.reload();

            cy.waitUntilRequestIsDone({ resourceType: "xhr" });

            cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
                expect(stats[1].isPending).to.be.false;
                expect(stats[1].requestError).to.be.undefined;
            });
        });

        it("Refresh during Fetch request", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.wait(duration / 2);

            cy.reload();

            cy.waitUntilRequestIsDone({ resourceType: "fetch" });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
                expect(stats[1].isPending).to.be.false;
                expect(stats[1].requestError).to.be.undefined;
            });
        });

        it("Multiple requests - fast cancel", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        cancelIn: 100,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "xhr"
                    },
                    {
                        cancelIn: 100,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "xhr"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "GET",
                        path: testPath_Fetch3,
                        type: "fetch"
                    },
                    {
                        cancelIn: 100,
                        delay: 150,
                        duration,
                        method: "GET",
                        path: testPath_Fetch3,
                        type: "fetch"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "GET",
                        path: testPath_Fetch4,
                        type: "xhr"
                    },
                    {
                        cancelIn: 100,
                        delay: 150,
                        duration,
                        method: "GET",
                        path: testPath_Fetch4,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: ["fetch", "xhr"] });

            cy.stopTiming().should("be.gt", duration);
        });

        it("Multiple requests - slow cancel", () => {
            const duration = 3000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        cancelIn: duration / 2,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: "pre/fetch-1",
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: "pre/fetch-2",
                        type: "fetch"
                    },
                    {
                        cancelIn: duration / 2,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: "pre/xhr-1",
                        type: "xhr"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: "pre/xhr-2",
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: ["fetch", "xhr"] });

            cy.stopTiming().should("be.gt", duration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
                expect(stats[0].resourceType).to.eq("fetch");
                expect(stats[1].isPending).to.be.false;
                expect(stats[1].requestError).to.be.undefined;
                expect(stats[1].resourceType).to.eq("fetch");
            });

            cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
                expect(stats[0].resourceType).to.eq("xhr");
                expect(stats[1].isPending).to.be.false;
                expect(stats[1].requestError).to.be.undefined;
                expect(stats[1].resourceType).to.eq("xhr");
            });
        });
    });

    describe("Enforce check = true", () => {
        it("With following request - auto", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: tripleDuration,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_Fetch2}`);

            cy.stopTiming().should("be.gt", delay + duration + tripleDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });
        });

        it("With following request - by click", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: tripleDuration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_Fetch1}`);

            cy.stopTiming().should("be.gt", duration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone(`**/${testPath_Fetch2}`);

            cy.stopTiming().should("be.gt", delay + tripleDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });
        });

        it("With following repetitive request - by click (resetInterceptorWatch)", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: tripleDuration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone(
                {
                    url: new RegExp(
                        `(${toRegExp(testPath_Fetch1)})|(${toRegExp(testPath_Fetch2)})$`,
                        "gi"
                    )
                },
                "waitUntilRequestIsDone with RegExp"
            );

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.resetInterceptorWatch();

            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone(`**/${testPath_Fetch2}`);

            cy.stopTiming().should("be.gt", delay + tripleDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(3);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
                expect(stats[2].isPending).to.be.false;
            });
        });

        it("With requests in progress - auto", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: tripleDuration,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration: tripleDuration * 2,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration: tripleDuration * 3,
                        method: "POST",
                        path: testPath_Fetch3,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_Fetch2}`);

            cy.stopTiming().should("be.gt", delay + tripleDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(4);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].url.endsWith(testPath_Fetch1)).to.be.true;
                expect(stats[1].isPending).to.be.true;
                expect(stats[1].url.endsWith(testPath_Fetch1)).to.be.true;
                expect(stats[2].isPending).to.be.true;
                expect(stats[2].url.endsWith(testPath_Fetch3)).to.be.true;
                expect(stats[3].isPending).to.be.false;
                expect(stats[3].url.endsWith(testPath_Fetch2)).to.be.true;
            });
        });

        it("With requests in progress - by click (resetInterceptorWatch)", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: tripleDuration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration: tripleDuration * 2,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration: tripleDuration * 2,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "fetch"
                    },
                    {
                        delay: 250,
                        duration: tripleDuration * 3,
                        method: "POST",
                        path: testPath_Fetch3,
                        type: "fetch"
                    },
                    {
                        delay: 300,
                        duration: tripleDuration * 3,
                        method: "POST",
                        path: testPath_Fetch3,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_Fetch1}`);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(5);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].url.endsWith(testPath_Fetch1)).to.be.true;
                expect(stats[1].isPending).to.be.true;
                expect(stats[1].url.endsWith(testPath_Fetch2)).to.be.true;
                expect(stats[2].isPending).to.be.true;
                expect(stats[2].url.endsWith(testPath_Fetch2)).to.be.true;
                expect(stats[3].isPending).to.be.true;
                expect(stats[3].url.endsWith(testPath_Fetch3)).to.be.true;
                expect(stats[4].isPending).to.be.true;
                expect(stats[4].url.endsWith(testPath_Fetch3)).to.be.true;
            });

            cy.resetInterceptorWatch();

            fireRequest();

            cy.waitUntilRequestIsDone(`**/${testPath_Fetch2}`);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(6);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].url.endsWith(testPath_Fetch1)).to.be.true;
                expect(stats[1].isPending).to.be.true;
                expect(stats[1].url.endsWith(testPath_Fetch2)).to.be.true;
                expect(stats[2].isPending).to.be.true;
                expect(stats[2].url.endsWith(testPath_Fetch2)).to.be.true;
                expect(stats[3].isPending).to.be.true;
                expect(stats[3].url.endsWith(testPath_Fetch3)).to.be.true;
                expect(stats[4].isPending).to.be.true;
                expect(stats[4].url.endsWith(testPath_Fetch3)).to.be.true;
                expect(stats[5].isPending).to.be.false;
                expect(stats[5].url.endsWith(testPath_Fetch2)).to.be.true;
            });
        });
    });

    describe("Enforce check = false", () => {
        it("By resource type", () => {
            const waitTimeout = 5000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        duration: waitTimeout * 2,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ enforceCheck: false, resourceType: "script", waitTimeout });

            cy.stopTiming().should("be.lt", waitTimeout);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(0);
            });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.true;
            });
        });

        it("By URL match", () => {
            const waitTimeout = 5000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        duration: waitTimeout * 2,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration: waitTimeout * 2,
                        path: testPath_Script1,
                        type: "script"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({
                enforceCheck: false,
                url: `**/${testPath_Script2}`,
                waitTimeout
            });

            cy.stopTiming().should("be.lt", waitTimeout);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.true;
            });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.true;
            });
        });

        it("Must wait for the pending request", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        duration: doubleDuration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        path: testPath_Script1,
                        type: "script"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({
                enforceCheck: false,
                url: `**/${testPath_Script1}`
            });

            cy.stopTiming().should("be.gt", duration);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.true;
            });
        });
    });

    describe("Wait Options", () => {
        it("With following request - will not wait to the second request", () => {
            const delay = 4000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: doubleDuration,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.lt", delay + duration + doubleDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });
        });

        it("With following request - will wait to the second request", () => {
            const delay = 3000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: doubleDuration,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ waitForNextRequest: delay });

            cy.stopTiming().should("be.gt", delay + duration + doubleDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });
        });

        it("With following request - do not wait", () => {
            const delay = 3000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        requests: [
                            {
                                delay,
                                duration: doubleDuration,
                                method: "POST",
                                path: testPath_Fetch2,
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ waitForNextRequest: 0 });

            cy.stopTiming().should("be.gt", duration).should("be.lt", delay);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });
        });
    });

    describe("Expected fail", () => {
        const errMessage = "<EXPECTED ERROR>";
        let expectedErrorMessage = errMessage;

        const listener = (error: Error) => {
            if (error.message === expectedErrorMessage) {
                return;
            }

            /* istanbul ignore next */
            throw new Error(error.message);
        };

        after(() => {
            Cypress.off("fail", listener);
        });

        before(() => {
            Cypress.on("fail", listener);
        });

        let envTimeout: unknown;

        beforeEach(() => {
            envTimeout = Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");
        });

        afterEach(() => {
            Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT", envTimeout);
        });

        it("Max wait", () => {
            const duration = 9999;

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            expectedErrorMessage = `${errMessage} (${duration / 2}ms)`;

            cy.waitUntilRequestIsDone({ waitTimeout: duration / 2 }, errMessage);

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Enforce check", () => {
            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (5000ms)`;

            cy.waitUntilRequestIsDone({ resourceType: "script", waitTimeout: 5000 }, errMessage);

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Default timeout", () => {
            Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT", undefined);

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (10000ms)`;

            cy.waitUntilRequestIsDone({ resourceType: "script" }, errMessage);

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Env timeout", () => {
            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (20000ms)`;

            cy.waitUntilRequestIsDone({ resourceType: "script" }, errMessage);

            /* istanbul ignore next */
            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });
    });
});
