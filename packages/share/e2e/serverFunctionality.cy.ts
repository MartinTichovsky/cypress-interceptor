import {
    DEFAULT_WAITTIME,
    generateUrl,
    getDelayWait,
    getDynamicUrl
} from "cypress-interceptor-server/src/utils";

import { getLoadedSector, getResponseBody } from "../src/selectors";
import { fireRequest, resourceTypeIt } from "../src/utils";

describe("Testing that the Interceptor logs requests correctly", () => {
    it("With custom options", () => {
        cy.visit(generateUrl("public/"));

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(2));

        cy.interceptorStats().then((stats) => expect(stats.length).to.eq(2));

        cy.interceptorStats({ method: "GET", resourceType: "fetch" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("fetch");
            expect(stats[0].url.toString()).to.eq("http://localhost:3000/fetch");
        });

        cy.interceptorStats({ method: "POST", resourceType: "fetch" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("fetch");
            expect(stats[0].url.toString()).to.eq("http://localhost:3000/fetch");
        });
    });
});

describe("Testing that the server works correctly", () => {
    const testPath1 = "api-1";
    const testPath2 = "api-2";
    const testPath3 = "api-3";
    const testPath4 = "api-4";
    const testPath5 = "api-5";

    resourceTypeIt("Delay", (resourceType) => {
        const delay = 1500;

        cy.visit(
            getDynamicUrl([
                { delay, path: resourceType, type: resourceType, method: "GET" },
                { delay, path: resourceType, type: resourceType, method: "POST" }
            ])
        );

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(0));

        cy.interceptorStats({ resourceType }).then((stats) => expect(stats.length).to.eq(0));

        cy.wait(delay / 2);

        cy.interceptorStats({ resourceType }).then((stats) => expect(stats.length).to.eq(0));

        cy.wait(getDelayWait(delay / 2));
        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
        });
    });

    resourceTypeIt("Duration", (resourceType) => {
        const duration = 5000;

        cy.visit(
            getDynamicUrl([
                { duration, path: resourceType, type: resourceType, method: "GET" },
                { duration, path: resourceType, type: resourceType, method: "POST" }
            ])
        );

        cy.startTiming();

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(2));

        cy.interceptorStats({ resourceType }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].isPending).to.be.true;
            expect(stats[1].isPending).to.be.true;
        });

        cy.wait(duration / 2);

        cy.interceptorStats({ resourceType }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].isPending).to.be.true;
            expect(stats[1].isPending).to.be.true;
        });

        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
            expect(stats[1].duration).to.be.gte(duration);
            expect(stats[1].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    resourceTypeIt("Body and Response - POST", (resourceType) => {
        const query = {
            val1: "value1",
            val2: "123"
        };
        const requestBody = {
            bool: true,
            num: 123,
            object: { arr: [1, 2], bool: false, str: "value" },
            property: "something"
        };
        const responseBody = {
            ...requestBody,
            arr: ["string", 0, 9]
        };

        cy.visit(
            getDynamicUrl([
                {
                    body: requestBody,
                    path: resourceType,
                    query,
                    responseBody,
                    type: resourceType,
                    method: "POST"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.request.query).to.has.property("val1", query.val1);
            expect(stats!.request.query).to.has.property("val2", query.val2);
            expect(stats!.request.body).to.deep.eq(JSON.stringify(requestBody));
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody));
        });
    });

    resourceTypeIt("Body and Response - GET", (resourceType) => {
        const query = {
            val1: "value2",
            val2: "432"
        };
        const responseBody = {
            property: "something",
            num: 321,
            arr: [false, 999, "abc"]
        };

        cy.visit(
            getDynamicUrl([
                {
                    path: resourceType,
                    query,
                    responseBody,
                    type: resourceType,
                    method: "GET"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.request.query).to.has.property("val1", query.val1);
            expect(stats!.request.query).to.has.property("val2", query.val2);
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody));
        });
    });

    it("Response status", () => {
        const fetchGetPath = "fetch-get";
        const fetchGetResponseStatus = 405;
        const fethPostPath = "fetch-post";
        const fetchPostResponseStatus = 301;

        const xhrGetPath = "xhr-get";
        const xhrGetResponseStatus = 202;
        const xhrPostPath = "xhr-post";
        const xhrPostResponseStatus = 204;

        cy.visit(
            getDynamicUrl([
                {
                    path: fetchGetPath,
                    status: fetchGetResponseStatus,
                    type: "fetch",
                    method: "GET"
                },
                {
                    path: fethPostPath,
                    status: fetchPostResponseStatus,
                    type: "fetch",
                    method: "GET"
                },
                {
                    path: xhrGetPath,
                    status: xhrGetResponseStatus,
                    type: "xhr",
                    method: "GET"
                },
                {
                    path: xhrPostPath,
                    status: xhrPostResponseStatus,
                    type: "xhr",
                    method: "POST"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest(`**/${fetchGetPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(fetchGetResponseStatus);
        });

        cy.interceptorLastRequest(`**/${fethPostPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(fetchPostResponseStatus);
        });

        cy.interceptorLastRequest(`**/${xhrGetPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(xhrGetResponseStatus);
        });

        cy.interceptorLastRequest(`**/${xhrPostPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(xhrPostResponseStatus);
        });
    });

    it("Following Requests - Multiple", () => {
        const duration1 = 1000;
        const duration2 = 1500;
        const duration3 = 2500;
        const duration4 = 1400;
        const duration5 = 1200;

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    duration: duration1,
                    method: "POST",
                    path: testPath1,
                    requests: [
                        {
                            duration: duration2,
                            method: "GET",
                            path: testPath2,
                            requests: [
                                {
                                    duration: duration4,
                                    method: "POST",
                                    path: testPath4,
                                    type: "fetch"
                                }
                            ],
                            type: "xhr"
                        },
                        {
                            duration: duration3,
                            path: testPath3,
                            method: "GET",
                            requests: [
                                {
                                    duration: duration5,
                                    method: "POST",
                                    path: testPath5,
                                    type: "xhr"
                                }
                            ],
                            type: "fetch"
                        }
                    ],
                    type: "fetch"
                }
            ])
        );

        cy.startTiming();

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => expect(stats.length).to.eq(5));

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].duration).to.be.gte(duration1);
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].url.pathname.endsWith(testPath1)).to.be.true;

            expect(stats[1].delay).to.be.undefined;
            expect(stats[1].duration).to.be.gte(duration3);
            expect(stats[1].isPending).to.be.false;
            expect(stats[1].url.pathname.endsWith(testPath3)).to.be.true;

            expect(stats[2].delay).to.be.undefined;
            expect(stats[2].duration).to.be.gte(duration4);
            expect(stats[2].isPending).to.be.false;
            expect(stats[2].url.pathname.endsWith(testPath4)).to.be.true;
        });

        cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].duration).to.be.gte(duration2);
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].url.pathname.endsWith(testPath2)).to.be.true;

            expect(stats[1].delay).to.be.undefined;
            expect(stats[1].duration).to.be.gte(duration5);
            expect(stats[1].isPending).to.be.false;
            expect(stats[1].url.pathname.endsWith(testPath5)).to.be.true;
        });

        cy.stopTiming().should(
            "be.gte",
            Math.max(duration1 + duration2 + duration4, duration1 + duration3 + duration5)
        );
    });

    it("Request on Click - No delay", () => {
        const responseBody = { respoonse: "RESPONSE TEXT" };

        cy.visit(
            getDynamicUrl([
                {
                    fireOnClick: true,
                    path: testPath1,
                    method: "GET",
                    type: "fetch"
                },
                {
                    fireOnClick: true,
                    path: testPath2,
                    method: "POST",
                    type: "xhr"
                },
                {
                    fireOnClick: true,
                    method: "POST",
                    path: testPath3,
                    responseBody,
                    type: "fetch"
                }
            ])
        );

        getLoadedSector(testPath1).should("not.exist");

        fireRequest();

        getLoadedSector(testPath1).should("exist");
        getLoadedSector(testPath2).should("not.exist");

        fireRequest();

        getLoadedSector(testPath2).should("exist");
        getLoadedSector(testPath3).should("not.exist");

        fireRequest();

        getLoadedSector(testPath3).should("exist");
        getResponseBody(testPath3).should("deep.equal", responseBody);
    });

    it("Request on Click - with delay", () => {
        const delayDuration1 = 500;
        const delayDuration2 = 1500;
        const delayDuration3 = 2500;

        const responseBody = { respoonse: "RESPONSE TEXT" };

        cy.visit(
            getDynamicUrl([
                {
                    delay: delayDuration1,
                    duration: delayDuration1,
                    fireOnClick: true,
                    method: "GET",
                    path: testPath1,
                    type: "fetch"
                },
                {
                    delay: delayDuration2,
                    duration: delayDuration2,
                    fireOnClick: true,
                    method: "POST",
                    path: testPath2,
                    type: "xhr"
                },
                {
                    delay: delayDuration3,
                    duration: delayDuration3,
                    fireOnClick: true,
                    method: "POST",
                    path: testPath3,
                    responseBody,
                    type: "fetch"
                }
            ])
        );

        getLoadedSector(testPath1).should("not.exist");

        fireRequest();

        cy.interceptorLastRequest(`**/${testPath1}`).should("be.undefined");
        getLoadedSector(testPath1).should("not.exist");

        cy.wait(delayDuration1 / 2);

        cy.interceptorLastRequest(`**/${testPath1}`).should("be.undefined");
        getLoadedSector(testPath1).should("not.exist");

        cy.wait(delayDuration1 / 2);

        cy.interceptorLastRequest(`**/${testPath1}`).should("not.be.undefined");
        getLoadedSector(testPath1).should("not.exist");

        cy.waitUntilRequestIsDone();

        getLoadedSector(testPath1).should("exist");

        // next request

        getLoadedSector(testPath2).should("not.exist");

        fireRequest();

        cy.interceptorLastRequest(`**/${testPath2}`).should("be.undefined");
        getLoadedSector(testPath2).should("not.exist");

        cy.wait(delayDuration2 / 2);

        cy.interceptorLastRequest(`**/${testPath2}`).should("be.undefined");
        getLoadedSector(testPath2).should("not.exist");

        cy.wait(delayDuration2 / 2);

        cy.interceptorLastRequest(`**/${testPath2}`).should("not.be.undefined");
        getLoadedSector(testPath2).should("not.exist");

        cy.waitUntilRequestIsDone();

        getLoadedSector(testPath2).should("exist");

        // next request

        getLoadedSector(testPath3).should("not.exist");

        fireRequest();

        cy.interceptorLastRequest(`**/${testPath3}`).should("be.undefined");
        getLoadedSector(testPath3).should("not.exist");

        cy.wait(delayDuration3 / 2);

        cy.interceptorLastRequest(`**/${testPath3}`).should("be.undefined");
        getLoadedSector(testPath3).should("not.exist");

        cy.wait(delayDuration3 / 2);

        cy.interceptorLastRequest(`**/${testPath3}`).should("not.be.undefined");
        getLoadedSector(testPath3).should("not.exist");

        cy.waitUntilRequestIsDone();

        getLoadedSector(testPath3).should("exist");
        getResponseBody(testPath3).should("deep.equal", responseBody);
    });
});
