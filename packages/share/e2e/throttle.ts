import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { crossDomainScript } from "../src/constants";
import { getResponseDuration } from "../src/selectors";
import { createMatcher, isObject } from "../src/utils";

describe("Throttle Request", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";
    const testPath_Fetch3 = "test/fetch-3";
    const testPath_Script1 = "test/script-1.js";

    const duration = 1500;
    const throttleDelay = duration * 3;

    describe("By resource type", () => {
        it("All", () => {
            cy.throttleInterceptorRequest({ resourceType: "all" }, duration, { times: 0 });

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
                                duration,
                                path: testPath_Script1,
                                type: "script"
                            }
                        ],
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration * 4);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(duration);
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration * 2);

            cy.interceptorLastRequest(`**/${testPath_Script1}`).then((stats) => {
                expect(stats?.delay).to.eq(duration);
            });
        });

        it("Fetch - default once", () => {
            cy.throttleInterceptorRequest({ resourceType: "fetch" }, throttleDelay);

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Fetch - 2 times", () => {
            cy.throttleInterceptorRequest({ resourceType: "fetch" }, throttleDelay, { times: 2 });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_Fetch3,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Fetch - infinitely", () => {
            cy.throttleInterceptorRequest({ resourceType: "fetch" }, throttleDelay, { times: 0 });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_Fetch3,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3).should("be.gt", duration + throttleDelay);
        });

        it("Script", () => {
            cy.throttleInterceptorRequest({ resourceType: "script" }, throttleDelay);

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        path: testPath_Script1,
                        type: "script"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest({ resourceType: "script" }).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
            });
        });
    });

    describe("By url match", () => {
        const config: DynamicRequest[] = [
            {
                delay: 100,
                duration,
                method: "GET",
                path: testPath_Fetch2,
                type: "fetch"
            },
            {
                delay: 150,
                duration,
                method: "POST",
                path: testPath_Fetch1,
                type: "fetch"
            }
        ];

        it("All", () => {
            cy.throttleInterceptorRequest("*", duration, { times: 0 });

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
                                duration,
                                path: testPath_Script1,
                                type: "script"
                            }
                        ],
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration * 4);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(duration);
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration * 2);

            cy.interceptorLastRequest(`**/${testPath_Script1}`).then((stats) => {
                expect(stats?.delay).to.eq(duration);
            });
        });

        it("Fetch - default once", () => {
            cy.throttleInterceptorRequest(`**/${testPath_Fetch1}`, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Fetch - 2 times", () => {
            cy.throttleInterceptorRequest(`**/${testPath_Fetch1}`, throttleDelay, { times: 2 });

            // first load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            // second load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            // third load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming()
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Fetch - infinitely", () => {
            const doCheck = () => {
                cy.stopTiming().should("be.gt", duration + throttleDelay);

                cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                    expect(stats?.delay).to.eq(throttleDelay);
                    expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
                });

                getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

                cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                    expect(stats?.delay).to.be.undefined;
                    expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
                });

                getResponseDuration(testPath_Fetch2)
                    .should("be.gt", duration)
                    .should("be.lt", duration + throttleDelay);
            };

            cy.throttleInterceptorRequest(`**/${testPath_Fetch1}`, throttleDelay, { times: 0 });

            // first load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            doCheck();

            // second load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            doCheck();

            // third load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            doCheck();
        });
    });

    describe("By custom match", () => {
        const body2 = {
            pre: "abRdtD",
            num: 954
        };

        const body3 = {
            arr: [0, "M", -99, false],
            obj: {
                val: "value"
            }
        };

        const headers1 = {
            "custom-header-1": "custom-value-1"
        };

        const headers3 = {
            "custom-header-3": "custom-value-3"
        };

        const query1 = {
            list: "99",
            order: "aaBC",
            state: "true"
        };

        const query2 = {
            page: "99",
            state: query1.state
        };

        const config: DynamicRequest[] = [
            {
                delay: 100,
                duration,
                headers: headers1,
                method: "GET",
                query: query1,
                path: testPath_Fetch1,
                type: "fetch"
            },
            {
                body: body2,
                delay: 150,
                duration,
                method: "POST",
                query: query2,
                path: testPath_Fetch2,
                type: "fetch"
            },
            {
                body: body3,
                delay: 200,
                duration,
                headers: headers3,
                method: "POST",
                query: { ...query1, ...query2 },
                path: testPath_Fetch3,
                type: "fetch"
            },
            {
                delay: 250,
                path: crossDomainScript,
                type: "script"
            }
        ];

        it("Method", () => {
            cy.throttleInterceptorRequest({ method: "POST" }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.request.method).to.eq("GET");
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.request.method).to.eq("POST");
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.request.method).to.eq("POST");
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Query - shallow match", () => {
            // first load
            cy.throttleInterceptorRequest(
                { queryMatcher: createMatcher({ page: query2.page }) },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            // second load
            cy.throttleInterceptorRequest(
                { queryMatcher: createMatcher({ list: query1.list }) },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            // third load
            cy.throttleInterceptorRequest(
                { queryMatcher: createMatcher({ state: query1.state }) },
                throttleDelay,
                {
                    times: 2
                }
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Query - sctrict match - should not match", () => {
            cy.throttleInterceptorRequest(
                { queryMatcher: createMatcher({ page: "99" }, true) },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming()
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.request.method).to.eq("GET");
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.request.method).to.eq("POST");
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.request.method).to.eq("POST");
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Query - sctrict match - should match", () => {
            cy.throttleInterceptorRequest(
                {
                    // url contain extra params generated in getDynamicUrl function
                    queryMatcher: createMatcher(
                        { ...query2, duration: duration.toString(), path: testPath_Fetch2 },
                        true
                    )
                },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Cross domain", () => {
            cy.interceptorOptions({ ingoreCrossDomain: false });
            cy.throttleInterceptorRequest({ crossDomain: true }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(crossDomainScript).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
            });
        });

        it("HTTPS", () => {
            cy.interceptorOptions({ ingoreCrossDomain: false });
            cy.throttleInterceptorRequest({ https: true }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(crossDomainScript).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
            });
        });

        it("URL - ends with", () => {
            cy.throttleInterceptorRequest({ url: `**/${testPath_Fetch2}` }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("URL - contains", () => {
            cy.throttleInterceptorRequest({ url: "**/api/**" }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("URL - RegExp", () => {
            cy.throttleInterceptorRequest({ url: /fetch-2$/i }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Headers", () => {
            cy.throttleInterceptorRequest(
                { headersMatcher: createMatcher(headers3) },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3).should("be.gt", duration + throttleDelay);
        });

        it("Body matcher", () => {
            cy.throttleInterceptorRequest(
                {
                    bodyMatcher: (body) => isObject(body) && "pre" in body && body.pre === body2.pre
                },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
            });

            getResponseDuration(testPath_Fetch1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats?.delay).to.eq(throttleDelay);
                expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
            });

            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats?.delay).to.be.undefined;
                expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
            });

            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });
    });

    it("Remove throttle by id", () => {
        const throttleDelay = 2000;

        const config: DynamicRequest[] = [
            {
                method: "POST",
                path: testPath_Fetch1,
                status: 200,
                type: "fetch"
            },
            {
                method: "GET",
                path: testPath_Fetch2,
                status: 200,
                type: "fetch"
            },
            {
                method: "POST",
                path: testPath_Fetch3,
                status: 200,
                type: "fetch"
            }
        ];

        cy.throttleInterceptorRequest(`**/${testPath_Fetch1}`, throttleDelay, { times: 0 }).then(
            (throttle1Id) => {
                cy.throttleInterceptorRequest(`**/${testPath_Fetch2}`, throttleDelay, {
                    times: 0
                }).then((throttle2Id) => {
                    cy.throttleInterceptorRequest(`**/${testPath_Fetch3}`, throttleDelay, {
                        times: 0
                    }).then((throttle3Id) => {
                        // first load

                        cy.startTiming();

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone().then((interceptor) =>
                            interceptor.removeThrottle(throttle1Id)
                        );

                        cy.stopTiming().should("be.gt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats?.delay).to.eq(throttleDelay);
                            expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch1).should("be.gt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats?.delay).to.eq(throttleDelay);
                            expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch2).should("be.gt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats?.delay).to.eq(throttleDelay);
                            expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch3).should("be.gt", throttleDelay);

                        // second load

                        cy.startTiming();

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone().then((interceptor) =>
                            interceptor.removeThrottle(throttle2Id)
                        );

                        cy.stopTiming().should("be.gt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats?.delay).to.be.undefined;
                            expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch1).should("be.lt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats?.delay).to.eq(throttleDelay);
                            expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch2).should("be.gt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats?.delay).to.eq(throttleDelay);
                            expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch3).should("be.gt", throttleDelay);

                        // third load

                        cy.startTiming();

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone().then((interceptor) =>
                            interceptor.removeThrottle(throttle3Id)
                        );

                        cy.stopTiming().should("be.gt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats?.delay).to.be.undefined;
                            expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch1).should("be.lt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats?.delay).to.be.undefined;
                            expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch2).should("be.lt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats?.delay).to.eq(throttleDelay);
                            expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch3).should("be.gt", throttleDelay);

                        // fourth load

                        cy.startTiming();

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone();

                        cy.stopTiming().should("be.lt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats?.delay).to.be.undefined;
                            expect(stats?.url?.endsWith(testPath_Fetch1)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch1).should("be.lt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats?.delay).to.be.undefined;
                            expect(stats?.url?.endsWith(testPath_Fetch2)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch2).should("be.lt", throttleDelay);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats?.delay).to.be.undefined;
                            expect(stats?.url?.endsWith(testPath_Fetch3)).to.be.true;
                        });

                        getResponseDuration(testPath_Fetch3).should("be.lt", throttleDelay);
                    });
                });
            }
        );
    });
});
