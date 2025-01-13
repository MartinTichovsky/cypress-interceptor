import { crossDomainFetch } from "cypress-interceptor-server/src/resources/constants";
import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { getResponseDuration } from "../src/selectors";
import { createMatcher, resourceTypeDescribe, resourceTypeIt } from "../src/utils";

describe("Throttle Request", () => {
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "api/api-2";
    const testPath_api_3 = "test/api-3";

    const duration = 1500;
    const throttleDelay = duration * 4;

    resourceTypeDescribe("By resource type", (resourceType, resourceTypeSecondary) => {
        it("All", () => {
            cy.throttleInterceptorRequest({ resourceType: "all" }, duration, {
                times: Number.POSITIVE_INFINITY
            });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                duration,
                                method: "GET",
                                path: testPath_api_2,
                                type: resourceTypeSecondary
                            }
                        ],
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration * 4);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(duration);
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration * 2);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(duration);
            });
        });

        it("Default once", () => {
            cy.throttleInterceptorRequest({ resourceType }, throttleDelay);

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        type: resourceType
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("2 times", () => {
            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, { times: 2 });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        type: resourceType
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        type: resourceType
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_api_3,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Infinitely", () => {
            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                times: Number.POSITIVE_INFINITY
            });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        type: resourceType
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        type: resourceType
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_api_3,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3).should("be.gt", duration + throttleDelay);
        });
    });

    resourceTypeDescribe("By url match", (resourceType, resourceTypeSecondary) => {
        const config: DynamicRequest[] = [
            {
                delay: 100,
                duration,
                method: "GET",
                path: testPath_api_2,
                type: resourceType
            },
            {
                delay: 150,
                duration,
                method: "POST",
                path: testPath_api_1,
                type: resourceType
            }
        ];

        it("All", () => {
            cy.throttleInterceptorRequest("*", duration, { times: Number.POSITIVE_INFINITY });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_api_1,
                        requests: [
                            {
                                duration,
                                method: "GET",
                                path: testPath_api_2,
                                type: resourceTypeSecondary
                            }
                        ],
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration * 4);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(duration);
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration * 2);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(duration);
            });
        });

        it("Default once", () => {
            cy.throttleInterceptorRequest(`**/${testPath_api_1}`, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("2 times", () => {
            cy.throttleInterceptorRequest(`**/${testPath_api_1}`, throttleDelay, { times: 2 });

            // first load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            // second load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            // third load

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming()
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Infinitely", () => {
            const doCheck = () => {
                cy.stopTiming().should("be.gte", duration + throttleDelay);

                cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
                });

                getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

                cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
                });

                getResponseDuration(testPath_api_2)
                    .should("be.gt", duration)
                    .should("be.lt", duration + throttleDelay);
            };

            cy.throttleInterceptorRequest(`**/${testPath_api_1}`, throttleDelay, {
                times: Number.POSITIVE_INFINITY
            });

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

    resourceTypeDescribe("By custom match", (resourceType, resourceTypeSecondary) => {
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
                path: testPath_api_1,
                type: resourceType
            },
            {
                body: body2,
                delay: 150,
                duration,
                method: "POST",
                query: query2,
                path: testPath_api_2,
                type: resourceType
            },
            {
                body: body3,
                delay: 200,
                duration,
                headers: headers3,
                method: "POST",
                query: { ...query1, ...query2 },
                path: testPath_api_3,
                type: resourceType
            },
            {
                delay: 250,
                method: "GET",
                path: crossDomainFetch,
                type: resourceTypeSecondary
            }
        ];

        it("Method", () => {
            cy.throttleInterceptorRequest({ method: "POST" }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
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

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
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

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
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

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
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

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Query - sctrict match - should match", () => {
            cy.throttleInterceptorRequest(
                {
                    // url contain extra params generated in getDynamicUrl function
                    queryMatcher: createMatcher(
                        { ...query2, duration: duration.toString(), path: testPath_api_2 },
                        true
                    )
                },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("Cross domain", () => {
            cy.throttleInterceptorRequest({ crossDomain: true }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", throttleDelay);

            cy.interceptorLastRequest(crossDomainFetch).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.response).not.to.be.undefined;
            });
        });

        it("Igore Cross domain", () => {
            cy.throttleInterceptorRequest({ crossDomain: false }, throttleDelay, {
                times: Number.POSITIVE_INFINITY
            });

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gte", throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3).should("be.gte", throttleDelay);

            cy.interceptorLastRequest(crossDomainFetch).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
            });
        });

        it("HTTP", () => {
            cy.throttleInterceptorRequest({ resourceType, https: false }, throttleDelay, {
                times: Number.POSITIVE_INFINITY
            });

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.request.method).to.eq("GET");
            });

            getResponseDuration(testPath_api_1).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.request.method).to.eq("POST");
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.request.method).to.eq("POST");
            });

            getResponseDuration(testPath_api_3).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(crossDomainFetch).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
            });
        });

        it("HTTPS", () => {
            cy.throttleInterceptorRequest({ https: true }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(crossDomainFetch).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
            });
        });

        it("URL - ends with", () => {
            cy.throttleInterceptorRequest({ url: `**/${testPath_api_2}` }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("URL - contains", () => {
            cy.throttleInterceptorRequest({ url: "**/api/**" }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });

        it("URL - RegExp", () => {
            cy.throttleInterceptorRequest({ url: /api-2$/i }, throttleDelay);

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
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

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3).should("be.gt", duration + throttleDelay);
        });

        it("Body matcher", () => {
            cy.throttleInterceptorRequest(
                {
                    bodyMatcher: (bodyString) => {
                        try {
                            const body = JSON.parse(bodyString);

                            return "pre" in body && body.pre === body2.pre;
                        } catch {
                            return false;
                        }
                    }
                },
                throttleDelay
            );

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
            });

            getResponseDuration(testPath_api_1)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.eq(throttleDelay);
                expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
            });

            getResponseDuration(testPath_api_2).should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.undefined;
                expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
            });

            getResponseDuration(testPath_api_3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
        });
    });

    resourceTypeIt("Remove throttle by id", (resourceType) => {
        const throttleDelay = 2000;

        const config: DynamicRequest[] = [
            {
                method: "POST",
                path: testPath_api_1,
                status: 200,
                type: resourceType
            },
            {
                method: "GET",
                path: testPath_api_2,
                status: 200,
                type: resourceType
            },
            {
                method: "POST",
                path: testPath_api_3,
                status: 200,
                type: resourceType
            }
        ];

        cy.throttleInterceptorRequest(`**/${testPath_api_1}`, throttleDelay, {
            times: Number.POSITIVE_INFINITY
        }).then((throttle1Id) => {
            cy.throttleInterceptorRequest(`**/${testPath_api_2}`, throttleDelay, {
                times: Number.POSITIVE_INFINITY
            }).then((throttle2Id) => {
                cy.throttleInterceptorRequest(`**/${testPath_api_3}`, throttleDelay, {
                    times: Number.POSITIVE_INFINITY
                }).then((throttle3Id) => {
                    // first load

                    cy.startTiming();

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone().then((interceptor) => {
                        expect(interceptor.removeThrottle(throttle1Id)).to.be.true;
                        expect(interceptor.removeThrottle(throttle1Id)).to.be.false;
                    });

                    cy.stopTiming().should("be.gte", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.eq(throttleDelay);
                        expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
                    });

                    getResponseDuration(testPath_api_1).should("be.gt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.eq(throttleDelay);
                        expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
                    });

                    getResponseDuration(testPath_api_2).should("be.gt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.eq(throttleDelay);
                        expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
                    });

                    getResponseDuration(testPath_api_3).should("be.gt", throttleDelay);

                    // second load

                    cy.startTiming();

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone().then((interceptor) => {
                        expect(interceptor.removeThrottle(throttle2Id)).to.be.true;
                        expect(interceptor.removeThrottle(throttle2Id)).to.be.false;
                    });

                    cy.stopTiming().should("be.gte", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.be.undefined;
                        expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
                    });

                    getResponseDuration(testPath_api_1).should("be.lt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.eq(throttleDelay);
                        expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
                    });

                    getResponseDuration(testPath_api_2).should("be.gt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.eq(throttleDelay);
                        expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
                    });

                    getResponseDuration(testPath_api_3).should("be.gt", throttleDelay);

                    // third load

                    cy.startTiming();

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone().then((interceptor) => {
                        expect(interceptor.removeThrottle(throttle3Id)).to.be.true;
                        expect(interceptor.removeThrottle(throttle3Id)).to.be.false;
                    });

                    cy.stopTiming().should("be.gte", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.be.undefined;
                        expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
                    });

                    getResponseDuration(testPath_api_1).should("be.lt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.be.undefined;
                        expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
                    });

                    getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.eq(throttleDelay);
                        expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
                    });

                    getResponseDuration(testPath_api_3).should("be.gt", throttleDelay);

                    // fourth load

                    cy.startTiming();

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone();

                    cy.stopTiming().should("be.lt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.be.undefined;
                        expect(stats!.url.pathname.endsWith(testPath_api_1)).to.be.true;
                    });

                    getResponseDuration(testPath_api_1).should("be.lt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.be.undefined;
                        expect(stats!.url.pathname.endsWith(testPath_api_2)).to.be.true;
                    });

                    getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.delay).to.be.undefined;
                        expect(stats!.url.pathname.endsWith(testPath_api_3)).to.be.true;
                    });

                    getResponseDuration(testPath_api_3).should("be.lt", throttleDelay);
                });
            });
        });
    });
});
