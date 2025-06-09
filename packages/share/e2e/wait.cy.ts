import { IRequestInit } from "cypress-interceptor/Interceptor.types";
import { crossDomainFetch, HOST } from "cypress-interceptor-server/src/resources/constants";
import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { fireRequest, testCaseDescribe, testCaseIt, toRegExp } from "../src/utils";

describe("Wait For Requests", () => {
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "test/api-2";
    const testPath_api_3 = "test/api-3";
    const testPath_api_4 = "test/api-4";

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
                        path: testPath_api_1,
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
                        path: testPath_api_1,
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
            let error: Error;
            let init: IRequestInit;

            const spy = {
                func(_init: IRequestInit, _error: Error) {
                    init = _init;
                    error = _error;
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
                        path: testPath_api_1,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: "fetch" }).then(() => {
                expect(spy.func).to.be.calledOnce;
                expect(spy.func).to.be.called;
                expect(init).not.to.be.undefined;
                expect(init.url.toString()).to.eq(
                    `http://${HOST}/${testPath_api_1}?duration=1500&path=${encodeURIComponent(testPath_api_1)}`
                );
                expect(error).not.to.be.undefined;
            });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].requestError).not.to.be.undefined;
            });
        });

        testCaseIt("POST request", (resourceType, bodyFormat, responseCatchType) => {
            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        cancelIn: duration / 2,
                        body: { data: 5 },
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: { response: "some" },
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType });

            cy.interceptorStats({ resourceType }).then((stats) => {
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
                        path: testPath_api_1,
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

            cy.interceptorRequestCalls({ resourceType: "xhr" }).should("eq", 2);
        });

        it("Refresh during Fetch request", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
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
                        path: testPath_api_1,
                        type: "fetch"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        type: "fetch"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        type: "xhr"
                    },
                    {
                        cancelIn: 100,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        type: "xhr"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "GET",
                        path: testPath_api_3,
                        type: "fetch"
                    },
                    {
                        cancelIn: 100,
                        delay: 150,
                        duration,
                        method: "GET",
                        path: testPath_api_3,
                        type: "fetch"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "GET",
                        path: testPath_api_4,
                        type: "xhr"
                    },
                    {
                        cancelIn: 100,
                        delay: 150,
                        duration,
                        method: "GET",
                        path: testPath_api_4,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: ["fetch", "xhr"] });

            cy.stopTiming().should("be.gte", duration);
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
                        fetchObjectInit: true,
                        jsonResponse: false,
                        method: "POST",
                        path: testPath_api_1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        fetchObjectInit: true,
                        jsonResponse: false,
                        method: "POST",
                        path: testPath_api_2,
                        type: "fetch"
                    },
                    {
                        cancelIn: duration / 2,
                        delay: 100,
                        duration,
                        fetchObjectInit: true,
                        jsonResponse: false,
                        method: "POST",
                        path: testPath_api_3,
                        type: "xhr"
                    },
                    {
                        delay: 150,
                        duration,
                        fetchObjectInit: true,
                        jsonResponse: false,
                        method: "POST",
                        path: testPath_api_4,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ resourceType: ["fetch", "xhr"] });

            cy.stopTiming().should("be.gte", duration);

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

            cy.interceptorRequestCalls({ resourceType: "fetch" }).should("eq", 2);
            cy.interceptorRequestCalls({ resourceType: "xhr" }).should("eq", 2);
            cy.interceptorRequestCalls({ resourceType: ["fetch", "xhr"] }).should("eq", 4);
        });
    });

    describe("Enforce check = false", () => {
        it("By resource type", () => {
            const timeout = 5000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        duration: timeout * 2,
                        method: "POST",
                        path: testPath_api_1,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ enforceCheck: false, resourceType: "xhr", timeout });

            cy.stopTiming().should("be.lt", timeout);

            cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
                expect(stats.length).to.eq(0);
            });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.true;
            });
        });

        it("By URL match", () => {
            const timeout = 5000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 150,
                        duration: timeout * 2,
                        method: "POST",
                        path: testPath_api_1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration: timeout * 2,
                        method: "POST",
                        path: testPath_api_2,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({
                enforceCheck: false,
                url: `**/${testPath_api_3}`,
                timeout: timeout
            });

            cy.stopTiming().should("be.lt", timeout);

            cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
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
                        path: testPath_api_1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        type: "xhr"
                    }
                ])
            );

            cy.waitUntilRequestIsDone({
                enforceCheck: false,
                url: `**/${testPath_api_2}`
            });

            cy.stopTiming().should("be.gte", duration);

            cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.true;
            });
        });
    });

    testCaseDescribe("Enforce check = true", (resourceType, bodyFormat, responseCatchType) => {
        it("With following request - auto", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: tripleDuration,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_api_2}`);

            cy.stopTiming().should("be.gte", delay + duration + tripleDuration);

            cy.interceptorStats({ resourceType }).then((stats) => {
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
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: tripleDuration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_api_1}`);

            cy.stopTiming().should("be.gte", duration);

            cy.interceptorStats({ resourceType: resourceType }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone(`**/${testPath_api_2}`);

            cy.stopTiming().should("be.gte", delay + tripleDuration);

            cy.interceptorStats({ resourceType }).then((stats) => {
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
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: tripleDuration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        method: "POST",
                        path: testPath_api_2,
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone(
                {
                    url: new RegExp(
                        `(${toRegExp(testPath_api_1)})|(${toRegExp(testPath_api_2)})$`,
                        "gi"
                    )
                },
                "waitUntilRequestIsDone with RegExp"
            );

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.resetInterceptorWatch();

            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone(`**/${testPath_api_2}`);

            cy.stopTiming().should("be.gte", delay + tripleDuration);

            cy.interceptorStats({ resourceType }).then((stats) => {
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
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: tripleDuration,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        duration: tripleDuration * 2,
                        method: "POST",
                        path: testPath_api_1,
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 200,
                        duration: tripleDuration * 3,
                        method: "POST",
                        path: testPath_api_3,
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_api_2}`);

            cy.stopTiming().should("be.gte", delay + tripleDuration);

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(4);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].url.pathname.endsWith(testPath_api_1)).to.be.true;
                expect(stats[1].isPending).to.be.true;
                expect(stats[1].url.pathname.endsWith(testPath_api_1)).to.be.true;
                expect(stats[2].isPending).to.be.true;
                expect(stats[2].url.pathname.endsWith(testPath_api_3)).to.be.true;
                expect(stats[3].isPending).to.be.false;
                expect(stats[3].url.pathname.endsWith(testPath_api_2)).to.be.true;
            });
        });

        it("With requests in progress - by click (resetInterceptorWatch)", () => {
            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: tripleDuration,
                                fireOnClick: true,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        duration: tripleDuration * 2,
                        method: "POST",
                        path: testPath_api_2,
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 200,
                        duration: tripleDuration * 2,
                        method: "POST",
                        path: testPath_api_2,
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 250,
                        duration: tripleDuration * 3,
                        method: "POST",
                        path: testPath_api_3,
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 300,
                        duration: tripleDuration * 3,
                        method: "POST",
                        path: testPath_api_3,
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone(`**/${testPath_api_1}`);

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(5);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].url.pathname.endsWith(testPath_api_1)).to.be.true;
                expect(stats[1].isPending).to.be.true;
                expect(stats[1].url.pathname.endsWith(testPath_api_2)).to.be.true;
                expect(stats[2].isPending).to.be.true;
                expect(stats[2].url.pathname.endsWith(testPath_api_2)).to.be.true;
                expect(stats[3].isPending).to.be.true;
                expect(stats[3].url.pathname.endsWith(testPath_api_3)).to.be.true;
                expect(stats[4].isPending).to.be.true;
                expect(stats[4].url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            cy.resetInterceptorWatch();

            fireRequest();

            cy.waitUntilRequestIsDone(`**/${testPath_api_2}`);

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(6);
                expect(stats[0].isPending).to.be.false;
                expect(stats[0].url.pathname.endsWith(testPath_api_1)).to.be.true;
                expect(stats[1].isPending).to.be.true;
                expect(stats[1].url.pathname.endsWith(testPath_api_2)).to.be.true;
                expect(stats[2].isPending).to.be.true;
                expect(stats[2].url.pathname.endsWith(testPath_api_2)).to.be.true;
                expect(stats[3].isPending).to.be.true;
                expect(stats[3].url.pathname.endsWith(testPath_api_3)).to.be.true;
                expect(stats[4].isPending).to.be.true;
                expect(stats[4].url.pathname.endsWith(testPath_api_3)).to.be.true;
                expect(stats[5].isPending).to.be.false;
                expect(stats[5].url.pathname.endsWith(testPath_api_2)).to.be.true;
            });
        });

        it("Ignore Cross Domain request", () => {
            cy.interceptorOptions({ ignoreCrossDomain: true });
            cy.throttleInterceptorRequest(crossDomainFetch, duration * 3);

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        delay: 250,
                        method: "GET",
                        path: crossDomainFetch,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming()
                .should("be.gte", duration)
                .should("be.lt", duration * 3);

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].crossDomain).to.be.false;
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].crossDomain).to.be.true;
                expect(stats[1].isPending).to.be.false;
                expect(stats[1].response).to.be.undefined;
            });

            cy.interceptorRequestCalls({ method: "POST" }).should("eq", 1);
            cy.interceptorRequestCalls({ method: "GET" }).should("eq", 1);
        });
    });

    testCaseDescribe("Wait Options", (resourceType, bodyFormat, responseCatchType) => {
        it("With following request - will not wait to the second request", () => {
            const delay = 4000;

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: doubleDuration,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.lt", delay + duration + doubleDuration);

            cy.interceptorStats({ resourceType }).then((stats) => {
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
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: doubleDuration,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ waitForNextRequest: delay });

            cy.stopTiming().should("be.gte", delay + duration + doubleDuration);

            cy.interceptorStats({ resourceType }).then((stats) => {
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
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                bodyFormat,
                                delay,
                                duration: doubleDuration,
                                method: "POST",
                                path: testPath_api_2,
                                responseCatchType,
                                type: resourceType
                            }
                        ],
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ waitForNextRequest: 0 });

            cy.stopTiming().should("be.gte", duration).should("be.lt", delay);

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });
        });

        it("Do not wait for Cross Domain request", () => {
            cy.throttleInterceptorRequest(crossDomainFetch, duration * 3);

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        delay: 250,
                        method: "GET",
                        path: crossDomainFetch,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone({ crossDomain: false });

            cy.stopTiming()
                .should("be.gte", duration)
                .should("be.lt", duration * 3);

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].crossDomain).to.be.false;
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].crossDomain).to.be.true;
                expect(stats[1].isPending).to.be.true;
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

            throw new Error(error.message);
        };

        after(() => {
            Cypress.off("fail", listener);
        });

        before(() => {
            Cypress.on("fail", listener);
        });

        let envTimeout: unknown;
        let expectedDuration: number | undefined;

        beforeEach(() => {
            expectedDuration = undefined;
            cy.startTiming();
            envTimeout = Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");
        });

        afterEach(() => {
            cy.stopTiming().then((duration) => {
                if (expectedDuration !== undefined) {
                    expect(duration).to.be.gte(expectedDuration);
                }
            });
            Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT", envTimeout);
        });

        testCaseIt("Max wait", (resourceType, bodyFormat, responseCatchType) => {
            const duration = 9999;

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            expectedErrorMessage = `${errMessage} (${duration / 2}ms)`;

            cy.waitUntilRequestIsDone({ timeout: duration / 2 }, errMessage);

            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Default functionality", () => {
            expectedDuration = Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage =
                "A wait timed out when waiting for requests to be done (20000ms)";

            cy.waitUntilRequestIsDone({ resourceType: "fetch" });

            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Enforce check", () => {
            expectedDuration = 5000;

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (5000ms)`;

            cy.waitUntilRequestIsDone({ resourceType: "fetch", timeout: 5000 }, errMessage);

            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Default timeout", () => {
            expectedDuration = 10000;

            Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT", undefined);

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (10000ms)`;

            cy.waitUntilRequestIsDone({ resourceType: "fetch" }, errMessage);

            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Env timeout", () => {
            expectedDuration = Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (20000ms)`;

            cy.waitUntilRequestIsDone({ resourceType: "fetch" }, errMessage);

            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Action chainable", () => {
            expectedDuration = Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (20000ms)`;

            cy.waitUntilRequestIsDone(() => cy.wrap(null), { resourceType: "fetch" }, errMessage);

            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });

        it("Action void", () => {
            expectedDuration = Cypress.env("INTERCEPTOR_REQUEST_TIMEOUT");

            cy.visit(getDynamicUrl([]));

            expectedErrorMessage = `${errMessage} (20000ms)`;

            cy.waitUntilRequestIsDone(
                () => {
                    (() => {
                        return 123;
                    })();
                },
                { resourceType: "fetch" },
                errMessage
            );

            cy.wrap(null).then(() => {
                throw new Error("This line should not be reached");
            });
        });
    });

    testCaseDescribe("Providing action", (resourceType, bodyFormat, responseCatchType) => {
        const config: DynamicRequest[] = [
            {
                bodyFormat,
                delay: 100,
                method: "POST",
                path: testPath_api_1,
                requests: [
                    {
                        bodyFormat,
                        delay,
                        duration: tripleDuration,
                        fireOnClick: true,
                        method: "POST",
                        path: testPath_api_1,
                        responseCatchType,
                        type: resourceType
                    }
                ],
                responseCatchType,
                type: resourceType
            }
        ];

        it("Providing chainable action", () => {
            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            // let the page to load
            cy.wait(2000);

            cy.startTiming();

            const anyReturnObject = { anything: 123 };

            cy.waitUntilRequestIsDone(
                () => fireRequest().then(() => cy.wrap(anyReturnObject)),
                `**/${testPath_api_1}`
            ).then((passedReturn) => {
                expect(passedReturn).to.eq(anyReturnObject);
            });

            cy.stopTiming().should("be.gte", tripleDuration);

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });
        });

        it("Providing void action", () => {
            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            // let the page to load
            cy.wait(2000);

            cy.startTiming();

            cy.waitUntilRequestIsDone(() => {
                fireRequest();
            }, `**/${testPath_api_1}`).then((result) => {
                cy.stopTiming().should("be.gte", tripleDuration);

                expect(result).to.be.undefined;

                cy.interceptor().then((interceptor) => {
                    const stats = interceptor.getStats({ resourceType });

                    expect(stats.length).to.eq(2);
                    expect(stats[0].isPending).to.be.false;
                    expect(stats[1].isPending).to.be.false;
                });
            });
        });

        it("Providing not chainable action", () => {
            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            // let the page to load
            cy.wait(2000);

            cy.startTiming();

            const anyReturnObject = { anything: true, then: 1 };

            cy.waitUntilRequestIsDone(() => {
                fireRequest();

                return anyReturnObject;
            }, `**/${testPath_api_1}`).then((result) => {
                cy.stopTiming().should("be.gte", tripleDuration);

                expect(result).to.eq(anyReturnObject);

                cy.interceptor().then((interceptor) => {
                    const stats = interceptor.getStats({ resourceType });

                    expect(stats.length).to.eq(2);
                    expect(stats[0].isPending).to.be.false;
                    expect(stats[1].isPending).to.be.false;
                });
            });
        });
    });
});
