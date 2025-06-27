import { CallStackJson } from "cypress-interceptor/Interceptor.types";
import { getFileNameFromCurrentTest } from "cypress-interceptor/src/utils.cypress";
import { HOST, I_TEST_NAME_HEADER } from "cypress-interceptor-server/src/resources/constants";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { getCounter, resetCounter } from "../src/counter";
import { getResponseBody, getResponseStatus } from "../src/selectors";
import { checkResponseHeaders, objectIncludes, resourceTypeIt } from "../src/utils";

const createJsonStack = (
    entries: {
        delay?: number;
        duration: number;
        method: CallStackJson["request"]["method"];
        resourceType: CallStackJson["resourceType"];
        responseBody: Record<string, unknown> | string;
        responseHeaders: NonNullable<CallStackJson["response"]>["headers"];
        responseStatusCode?: NonNullable<CallStackJson["response"]>["statusCode"];
        responseStatusText?: NonNullable<CallStackJson["response"]>["statusText"];
        url: CallStackJson["url"];
    }[]
): CallStackJson[] =>
    entries.map((entry) => ({
        crossDomain: false,
        delay: entry.delay ?? undefined,
        duration: entry.duration,
        isPending: false,
        request: {
            body: "",
            headers: {},
            method: entry.method,
            query: {}
        },
        resourceType: entry.resourceType,
        response: {
            body:
                typeof entry.responseBody === "object"
                    ? JSON.stringify(entry.responseBody)
                    : entry.responseBody,
            headers: entry.responseHeaders,
            isMock: false,
            statusCode: entry.responseStatusCode ?? 200,
            statusText: entry.responseStatusText ?? "OK",
            timeEnd: new Date().toString()
        },
        timeStart: new Date().toString(),
        url: entry.url
    }));

describe("Reproduce Network Communication", () => {
    const testPath1 = "/test/api-test-1";
    const testPath2 = "/test/api-test-2";
    const testPath3 = "/test/api-test-3";
    const testPath4 = "/test/api-test-4";

    it("Should reproduce single request", () => {
        const iTestName = getFileNameFromCurrentTest();
        const testPath = "/test/api-test";

        resetCounter(iTestName);

        const reproduceResponseBody = {
            something: "else"
        };
        const reproduceResponseHeaders = {
            "my-custom-header": "my-custom-value"
        };
        const reproduceResponseStatus = 201;
        const reproduceResponseStatusText = "Sts";

        const reproduceDuration = 2000;

        cy.reproduceNetCom(
            createJsonStack([
                {
                    duration: reproduceDuration,
                    method: "POST",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody,
                    responseHeaders: reproduceResponseHeaders,
                    responseStatusCode: reproduceResponseStatus,
                    responseStatusText: reproduceResponseStatusText,
                    url: `http://${HOST}${testPath}`
                }
            ])
        );

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "POST",
                    path: testPath,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats).to.have.length(1);
        });

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.body).to.eq(JSON.stringify(reproduceResponseBody));
            expect(stats!.response!.isMock).to.be.true;
            expect(objectIncludes(stats!.response!.headers, reproduceResponseHeaders)).to.be.true;
            expect(stats!.response!.statusCode).to.eq(reproduceResponseStatus);
            expect(stats!.response!.statusText).to.eq(reproduceResponseStatusText);
            expect(stats!.duration).to.be.greaterThan(reproduceDuration);
        });

        getResponseBody(testPath).should("deep.equal", reproduceResponseBody);
        checkResponseHeaders(testPath, reproduceResponseHeaders).should("be.true");
        getResponseStatus(testPath).should("eq", reproduceResponseStatus);

        getCounter(iTestName).then((res) => {
            expect(res.body).to.have.length(0);
        });
    });

    it("Should change the protocol", () => {
        const iTestName = getFileNameFromCurrentTest();

        resetCounter(iTestName);

        const reproduceResponseBody1 = {
            num: 1
        };
        const reproduceResponseBody2 = {
            num: 2
        };
        const reproduceResponseHeaders1 = {
            "my-custom-header-1": "my-custom-value-1"
        };
        const reproduceResponseHeaders2 = {
            "my-custom-header-2": "my-custom-value-2"
        };
        const reproduceResponseStatus1 = 201;
        const reproduceResponseStatusText1 = "N1";
        const reproduceResponseStatus2 = 202;
        const reproduceResponseStatusText2 = "N2";

        const reproduceDuration1 = 2000;
        const reproduceDuration2 = 1000;

        cy.reproduceNetCom(
            createJsonStack([
                {
                    duration: reproduceDuration1,
                    method: "POST",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody1,
                    responseHeaders: reproduceResponseHeaders1,
                    responseStatusCode: reproduceResponseStatus1,
                    responseStatusText: reproduceResponseStatusText1,
                    url: `https://${HOST}${testPath1}`
                },
                {
                    duration: reproduceDuration2,
                    method: "GET",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody2,
                    responseHeaders: reproduceResponseHeaders2,
                    responseStatusCode: reproduceResponseStatus2,
                    responseStatusText: reproduceResponseStatusText2,
                    url: `https://${HOST}${testPath2}`
                }
            ]),
            {
                protocol: "http"
            }
        );

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "POST",
                    path: testPath1,
                    type: "fetch"
                },
                {
                    delay: 200,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "GET",
                    path: testPath2,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats).to.have.length(2);

            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].response).not.to.be.undefined;
            expect(stats[0].response!.body).to.eq(JSON.stringify(reproduceResponseBody1));
            expect(stats[0].response!.isMock).to.be.true;
            expect(objectIncludes(stats[0].response!.headers, reproduceResponseHeaders1)).to.be
                .true;
            expect(stats[0].response!.statusCode).to.eq(reproduceResponseStatus1);
            expect(stats[0].response!.statusText).to.eq(reproduceResponseStatusText1);
            expect(stats[0].duration).to.be.greaterThan(reproduceDuration1);

            expect(stats[1]).not.to.be.undefined;
            expect(stats[1].response).not.to.be.undefined;
            expect(stats[1].response!.body).to.eq(JSON.stringify(reproduceResponseBody2));
            expect(stats[1].response!.isMock).to.be.true;
            expect(objectIncludes(stats[1].response!.headers, reproduceResponseHeaders2)).to.be
                .true;
            expect(stats[1].response!.statusCode).to.eq(reproduceResponseStatus2);
            expect(stats[1].response!.statusText).to.eq(reproduceResponseStatusText2);
            expect(stats[1].duration).to.be.greaterThan(reproduceDuration2);
        });

        getResponseBody(testPath1).should("deep.equal", reproduceResponseBody1);
        checkResponseHeaders(testPath1, reproduceResponseHeaders1).should("be.true");
        getResponseStatus(testPath1).should("eq", reproduceResponseStatus1);

        getResponseBody(testPath2).should("deep.equal", reproduceResponseBody2);
        checkResponseHeaders(testPath2, reproduceResponseHeaders2).should("be.true");
        getResponseStatus(testPath2).should("eq", reproduceResponseStatus2);

        getCounter(iTestName).then((res) => {
            expect(res.body).to.have.length(0);
        });
    });

    it("Should work with custom urlMatch without onlyUrlMatch", () => {
        const iTestName = getFileNameFromCurrentTest();

        resetCounter(iTestName);

        const reproduceResponseBody1 = {
            num: 1
        };
        const reproduceResponseBody2 = {
            num: 2
        };
        const reproduceResponseBody3 = {
            num: 3
        };
        const reproduceResponseHeaders1 = {
            "my-custom-header-1": "my-custom-value-1"
        };
        const reproduceResponseHeaders2 = {
            "my-custom-header-2": "my-custom-value-2"
        };
        const reproduceResponseHeaders3 = {
            "my-custom-header-3": "my-custom-value-3"
        };
        const reproduceResponseStatus1 = 201;
        const reproduceResponseStatusText1 = "N1";
        const reproduceResponseStatus2 = 202;
        const reproduceResponseStatusText2 = "N2";
        const reproduceResponseStatus3 = 203;
        const reproduceResponseStatusText3 = "N3";

        const reproduceDuration1 = 2000;
        const reproduceDuration2 = 1000;
        const reproduceDuration3 = 1500;

        cy.reproduceNetCom(
            createJsonStack([
                {
                    duration: reproduceDuration1,
                    method: "GET",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody1,
                    responseHeaders: reproduceResponseHeaders1,
                    responseStatusCode: reproduceResponseStatus1,
                    responseStatusText: reproduceResponseStatusText1,
                    url: `http://${HOST}${testPath1}`
                },
                {
                    duration: reproduceDuration2,
                    method: "GET",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody2,
                    responseHeaders: reproduceResponseHeaders2,
                    responseStatusCode: reproduceResponseStatus2,
                    responseStatusText: reproduceResponseStatusText2,
                    url: `https://${HOST}${testPath2}`
                },
                {
                    duration: reproduceDuration3,
                    method: "POST",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody3,
                    responseHeaders: reproduceResponseHeaders3,
                    responseStatusCode: reproduceResponseStatus3,
                    responseStatusText: reproduceResponseStatusText3,
                    url: `https://${HOST}${testPath3}`
                }
            ]),
            {
                protocol: "http",
                urlMatch: (requestUrl, reproduceEntry) => {
                    if (
                        requestUrl.pathname === testPath2 &&
                        reproduceEntry.url.pathname === testPath2
                    ) {
                        return true;
                    }

                    return false;
                }
            }
        );

        const responseBody1 = {
            str: "string 1"
        };
        const responseBody2 = {
            str: "string 2"
        };
        const responseBody3 = {
            str: "string 3"
        };

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "POST",
                    path: testPath1,
                    responseBody: responseBody1,
                    type: "fetch"
                },
                {
                    delay: 200,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "GET",
                    path: testPath2,
                    responseBody: responseBody2,
                    type: "fetch"
                },
                {
                    delay: 300,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "POST",
                    path: testPath3,
                    responseBody: responseBody3,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats).to.have.length(3);

            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].response).not.to.be.undefined;
            expect(stats[0].response!.body).to.eq(JSON.stringify(responseBody1));
            expect(stats[0].response!.isMock).to.be.false;
            expect(objectIncludes(stats[0].response!.headers, reproduceResponseHeaders1)).to.be
                .false;
            expect(stats[0].response!.statusCode).to.eq(200);
            expect(stats[0].response!.statusText).to.eq("OK");
            expect(stats[0].duration).to.be.lessThan(reproduceDuration1);

            expect(stats[1]).not.to.be.undefined;
            expect(stats[1].response).not.to.be.undefined;
            expect(stats[1].response!.body).to.eq(JSON.stringify(reproduceResponseBody2));
            expect(stats[1].response!.isMock).to.be.true;
            expect(objectIncludes(stats[1].response!.headers, reproduceResponseHeaders2)).to.be
                .true;
            expect(stats[1].response!.statusCode).to.eq(reproduceResponseStatus2);
            expect(stats[1].response!.statusText).to.eq(reproduceResponseStatusText2);
            expect(stats[1].duration).to.be.greaterThan(reproduceDuration2);

            expect(stats[2]).not.to.be.undefined;
            expect(stats[2].response).not.to.be.undefined;
            expect(stats[2].response!.body).to.eq(JSON.stringify(reproduceResponseBody3));
            expect(stats[2].response!.isMock).to.be.true;
            expect(objectIncludes(stats[2].response!.headers, reproduceResponseHeaders3)).to.be
                .true;
            expect(stats[2].response!.statusCode).to.eq(reproduceResponseStatus3);
            expect(stats[2].response!.statusText).to.eq(reproduceResponseStatusText3);
            expect(stats[2].duration).to.be.greaterThan(reproduceDuration3);
        });

        getResponseBody(testPath1).should("deep.equal", responseBody1);
        checkResponseHeaders(testPath1, reproduceResponseHeaders1).should("be.false");
        getResponseStatus(testPath1).should("eq", 200);

        getResponseBody(testPath2).should("deep.equal", reproduceResponseBody2);
        checkResponseHeaders(testPath2, reproduceResponseHeaders2).should("be.true");
        getResponseStatus(testPath2).should("eq", reproduceResponseStatus2);

        getResponseBody(testPath3).should("deep.equal", reproduceResponseBody3);
        checkResponseHeaders(testPath3, reproduceResponseHeaders3).should("be.true");
        getResponseStatus(testPath3).should("eq", reproduceResponseStatus3);

        getCounter(iTestName).then((res) => {
            expect(res.body).to.have.length(1);
            expect(res.body[0]).to.eq(`http://${HOST}${testPath1}`);
        });
    });

    it("Should work with custom urlMatch with onlyUrlMatch", () => {
        const iTestName = getFileNameFromCurrentTest();

        resetCounter(iTestName);

        const reproduceResponseBody1 = {
            num: 10
        };
        const reproduceResponseBody2 = {
            num: 20
        };
        const reproduceResponseBody3 = {
            num: 30
        };
        const reproduceResponseHeaders1 = {
            "my-custom-header-10": "my-custom-value-10"
        };
        const reproduceResponseHeaders2 = {
            "my-custom-header-20": "my-custom-value-20"
        };
        const reproduceResponseHeaders3 = {
            "my-custom-header-30": "my-custom-value-30"
        };

        const reproduceDuration1 = 2500;
        const reproduceDuration2 = 1500;
        const reproduceDuration3 = 2000;

        cy.reproduceNetCom(
            createJsonStack([
                {
                    duration: reproduceDuration1,
                    method: "POST",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody1,
                    responseHeaders: reproduceResponseHeaders1,
                    url: `http://${HOST}${testPath1}`
                },
                {
                    duration: reproduceDuration2,
                    method: "POST",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody2,
                    responseHeaders: reproduceResponseHeaders2,
                    url: `https://${HOST}${testPath2}`
                },
                {
                    duration: reproduceDuration3,
                    method: "GET",
                    resourceType: "fetch",
                    responseBody: reproduceResponseBody3,
                    responseHeaders: reproduceResponseHeaders3,
                    url: `https://${HOST}${testPath3}`
                }
            ]),
            {
                onlyUrlMatch: true,
                protocol: "http",
                urlMatch: (requestUrl, reproduceEntry) => {
                    if (
                        requestUrl.pathname === testPath3 &&
                        reproduceEntry.url.pathname === testPath3
                    ) {
                        return true;
                    }

                    return false;
                }
            }
        );

        const responseBody1 = {
            str: "string 10"
        };
        const responseBody2 = {
            str: "string 20"
        };
        const responseBody3 = {
            str: "string 30"
        };

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "POST",
                    path: testPath1,
                    responseBody: responseBody1,
                    type: "fetch"
                },
                {
                    delay: 200,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "POST",
                    path: testPath2,
                    responseBody: responseBody2,
                    type: "fetch"
                },
                {
                    delay: 300,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "GET",
                    path: testPath3,
                    responseBody: responseBody3,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats).to.have.length(3);

            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].response).not.to.be.undefined;
            expect(stats[0].response!.body).to.eq(JSON.stringify(responseBody1));
            expect(stats[0].response!.isMock).to.be.false;
            expect(objectIncludes(stats[0].response!.headers, reproduceResponseHeaders1)).to.be
                .false;
            expect(stats[0].response!.statusCode).to.eq(200);
            expect(stats[0].response!.statusText).to.eq("OK");
            expect(stats[0].duration).to.be.lessThan(reproduceDuration1);

            expect(stats[1]).not.to.be.undefined;
            expect(stats[1].response).not.to.be.undefined;
            expect(stats[1].response!.body).to.eq(JSON.stringify(responseBody2));
            expect(stats[1].response!.isMock).to.be.false;
            expect(objectIncludes(stats[1].response!.headers, reproduceResponseHeaders2)).to.be
                .false;
            expect(stats[1].response!.statusCode).to.eq(200);
            expect(stats[1].response!.statusText).to.eq("OK");
            expect(stats[1].duration).to.be.lessThan(reproduceDuration2);

            expect(stats[2]).not.to.be.undefined;
            expect(stats[2].response).not.to.be.undefined;
            expect(stats[2].response!.body).to.eq(JSON.stringify(reproduceResponseBody3));
            expect(stats[2].response!.isMock).to.be.true;
            expect(objectIncludes(stats[2].response!.headers, reproduceResponseHeaders3)).to.be
                .true;
            expect(stats[1].response!.statusCode).to.eq(200);
            expect(stats[1].response!.statusText).to.eq("OK");
            expect(stats[2].duration).to.be.greaterThan(reproduceDuration3);
        });

        getResponseBody(testPath1).should("deep.equal", responseBody1);
        checkResponseHeaders(testPath1, reproduceResponseHeaders1).should("be.false");
        getResponseStatus(testPath1).should("eq", 200);

        getResponseBody(testPath2).should("deep.equal", responseBody2);
        checkResponseHeaders(testPath2, reproduceResponseHeaders2).should("be.false");
        getResponseStatus(testPath2).should("eq", 200);

        getResponseBody(testPath3).should("deep.equal", reproduceResponseBody3);
        checkResponseHeaders(testPath3, reproduceResponseHeaders3).should("be.true");
        getResponseStatus(testPath3).should("eq", 200);

        getCounter(iTestName).then((res) => {
            expect(res.body).to.have.length(2);
            expect(res.body[0]).to.eq(`http://${HOST}${testPath1}`);
            expect(res.body[1]).to.eq(`http://${HOST}${testPath2}`);
        });
    });

    resourceTypeIt("Should reproduce multiple requests", (resourceType) => {
        const iTestName = getFileNameFromCurrentTest();

        resetCounter(iTestName);

        const reproduceResponseBody1 = {
            another: "else",
            num: 1
        };
        const reproduceResponseBody2 = {
            another: "value",
            id: 123,
            name: "test",
            status: true
        };
        const reproduceResponseBody3 = {
            message: "Hello",
            name: "John"
        };
        const reproduceResponseBody4 = "Hello reproduce";

        const reproduceResponseHeaders1 = {
            "first-header": "first-value",
            "second-header": "second-value"
        };
        const reproduceResponseHeaders2 = {
            "third-header": "third-value",
            "fourth-header": "fourth-value"
        };
        const reproduceResponseHeaders3 = {
            "fifth-header": "fifth-value",
            "sixth-header": "sixth-value"
        };
        const reproduceResponseHeaders4 = {
            "seventh-header": "seventh-value",
            "eighth-header": "eighth-value"
        };

        const reproduceResponseStatus1 = 202;
        const reproduceResponseStatus2 = 203;
        const reproduceResponseStatus3 = 200;
        const reproduceResponseStatus4 = 201;

        const reproduceResponseStatusText1 = "Sta";
        const reproduceResponseStatusText2 = "Stb";
        const reproduceResponseStatusText3 = "Stc";
        const reproduceResponseStatusText4 = "Std";

        const reproduceDuration1 = 1500;
        const reproduceDuration2 = 750;
        const reproduceDuration3 = 1000;
        const reproduceDuration4 = 100;

        cy.reproduceNetCom(
            createJsonStack([
                {
                    duration: reproduceDuration1,
                    method: "POST",
                    resourceType,
                    responseBody: reproduceResponseBody1,
                    responseHeaders: reproduceResponseHeaders1,
                    responseStatusCode: reproduceResponseStatus1,
                    responseStatusText: reproduceResponseStatusText1,
                    url: `http://${HOST}${testPath1}`
                },
                {
                    duration: reproduceDuration2,
                    method: "GET",
                    resourceType,
                    responseBody: reproduceResponseBody2,
                    responseHeaders: reproduceResponseHeaders2,
                    responseStatusCode: reproduceResponseStatus2,
                    responseStatusText: reproduceResponseStatusText2,
                    url: `http://${HOST}${testPath2}`
                },
                {
                    duration: reproduceDuration3,
                    method: "GET",
                    resourceType,
                    responseBody: reproduceResponseBody3,
                    responseHeaders: reproduceResponseHeaders3,
                    responseStatusCode: reproduceResponseStatus3,
                    responseStatusText: reproduceResponseStatusText3,
                    url: `http://${HOST}${testPath3}`
                },
                {
                    duration: reproduceDuration4,
                    method: "POST",
                    resourceType,
                    responseBody: reproduceResponseBody4,
                    responseHeaders: reproduceResponseHeaders4,
                    responseStatusCode: reproduceResponseStatus4,
                    responseStatusText: reproduceResponseStatusText4,
                    url: `http://${HOST}${testPath4}`
                }
            ])
        );

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "POST",
                    path: testPath1,
                    type: resourceType
                },
                {
                    delay: 200,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "GET",
                    path: testPath2,
                    type: resourceType
                },
                {
                    delay: 300,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    method: "GET",
                    path: testPath3,
                    type: resourceType
                },
                {
                    delay: 400,
                    headers: {
                        [I_TEST_NAME_HEADER]: iTestName
                    },
                    jsonResponse: false,
                    method: "POST",
                    path: testPath4,
                    type: resourceType
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats).to.have.length(4);

            expect(stats[0].response).not.to.be.undefined;
            expect(stats[0].response!.body).to.eq(JSON.stringify(reproduceResponseBody1));
            expect(stats[0].response!.isMock).to.be.true;
            expect(objectIncludes(stats[0].response!.headers, reproduceResponseHeaders1)).to.be
                .true;
            expect(stats[0].response!.statusCode).to.eq(reproduceResponseStatus1);
            expect(stats[0].response!.statusText).to.eq(reproduceResponseStatusText1);
            expect(stats[0].duration).to.be.greaterThan(reproduceDuration1);

            expect(stats[1].response).not.to.be.undefined;
            expect(stats[1].response!.body).to.eq(JSON.stringify(reproduceResponseBody2));
            expect(stats[1].response!.isMock).to.be.true;
            expect(objectIncludes(stats[1].response!.headers, reproduceResponseHeaders2)).to.be
                .true;
            expect(stats[1].response!.statusCode).to.eq(reproduceResponseStatus2);
            expect(stats[1].response!.statusText).to.eq(reproduceResponseStatusText2);
            expect(stats[1].duration).to.be.greaterThan(reproduceDuration2);

            expect(stats[2].response).not.to.be.undefined;
            expect(stats[2].response!.body).to.eq(JSON.stringify(reproduceResponseBody3));
            expect(stats[2].response!.isMock).to.be.true;
            expect(objectIncludes(stats[2].response!.headers, reproduceResponseHeaders3)).to.be
                .true;
            expect(stats[2].response!.statusCode).to.eq(reproduceResponseStatus3);
            expect(stats[2].response!.statusText).to.eq(reproduceResponseStatusText3);
            expect(stats[2].duration).to.be.greaterThan(reproduceDuration3);

            expect(stats[3].response).not.to.be.undefined;
            expect(stats[3].response!.body).to.eq(reproduceResponseBody4);
            expect(stats[3].response!.isMock).to.be.true;
            expect(objectIncludes(stats[3].response!.headers, reproduceResponseHeaders4)).to.be
                .true;
            expect(stats[3].response!.statusCode).to.eq(reproduceResponseStatus4);
            expect(stats[3].response!.statusText).to.eq(reproduceResponseStatusText4);
            expect(stats[3].duration).to.be.greaterThan(reproduceDuration4);
        });

        getResponseBody(testPath1).should("deep.equal", reproduceResponseBody1);
        checkResponseHeaders(testPath1, reproduceResponseHeaders1).should("be.true");
        getResponseStatus(testPath1).should("eq", reproduceResponseStatus1);

        getResponseBody(testPath2).should("deep.equal", reproduceResponseBody2);
        checkResponseHeaders(testPath2, reproduceResponseHeaders2).should("be.true");
        getResponseStatus(testPath2).should("eq", reproduceResponseStatus2);

        getResponseBody(testPath3).should("deep.equal", reproduceResponseBody3);
        checkResponseHeaders(testPath3, reproduceResponseHeaders3).should("be.true");
        getResponseStatus(testPath3).should("eq", reproduceResponseStatus3);

        getResponseBody(testPath4, true).should("deep.equal", reproduceResponseBody4);
        checkResponseHeaders(testPath4, reproduceResponseHeaders4).should("be.true");
        getResponseStatus(testPath4).should("eq", reproduceResponseStatus4);

        getCounter(iTestName).then((res) => {
            expect(res.body).to.have.length(0);
        });
    });
});
