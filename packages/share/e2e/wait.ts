import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { fireRequest, toRegExp } from "../src/utils";

describe("Wait For Requests", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";
    const testPath_Fetch3 = "test/fetch-3";

    const delay = 1000;
    const duration = 1500;
    const doubleDuration = duration * 2;
    const tripleDuration = duration * 3;

    describe("Enforce check", () => {
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

            cy.waitUntilRequestIsDone({ enforceCheck: true, url: `**/${testPath_Fetch2}` });

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

            cy.waitUntilRequestIsDone({ enforceCheck: true, url: `**/${testPath_Fetch1}` });

            cy.stopTiming().should("be.gt", duration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.startTiming();

            fireRequest();

            cy.waitUntilRequestIsDone({ enforceCheck: true, url: `**/${testPath_Fetch2}` });

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
                    enforceCheck: true,
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

            cy.waitUntilRequestIsDone({ enforceCheck: true, url: `**/${testPath_Fetch2}` });

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

            cy.waitUntilRequestIsDone({ enforceCheck: true, url: `**/${testPath_Fetch2}` });

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

            cy.waitUntilRequestIsDone({ enforceCheck: true, url: `**/${testPath_Fetch1}` });

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

            cy.waitUntilRequestIsDone({ enforceCheck: true, url: `**/${testPath_Fetch2}` });

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

            cy.waitUntilRequestIsDone({ waitBetweenRequests: delay });

            cy.stopTiming().should("be.gt", delay + duration + doubleDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });
        });
    });

    describe("Expected fail", () => {
        const errMessage = "<EXPECTED ERROR>";

        before(() => {
            Cypress.on("fail", (error) => {
                if (error.message === errMessage) {
                    return;
                }

                throw new Error(error.message);
            });
        });

        it("Max wait", () => {
            const duration = 9999;

            cy.startTiming();

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

            cy.waitUntilRequestIsDone({ waitTimeout: duration / 2 }, errMessage);

            cy.wrap(null).then(() => {
                throw new Error("This line should be reached");
            });
        });
    });
});
