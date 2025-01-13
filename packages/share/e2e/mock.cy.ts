import { crossDomainFetch } from "cypress-interceptor-server/src/resources/constants";
import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import {
    getResponseBody,
    getResponseDuration,
    getResponseHeaders,
    getResponseStatus
} from "../src/selectors";
import {
    convertToRequestBody,
    createMatcher,
    isObject,
    objectIncludes,
    testCaseDescribe
} from "../src/utils";

describe("Mock Respose", () => {
    const testPath_api_1 = "test/api-1";
    const testPath_api_2 = "api/api-2";
    const testPath_api_3 = "test/api-3";

    const checkResponseHeaders = (id: string, mockHeaders: { [key: string]: string }) =>
        getResponseHeaders(id).then((headers: [[string, string]] | undefined) =>
            cy.wrap(
                headers &&
                    Object.keys(mockHeaders).every((key) =>
                        headers.find(
                            ([headerKey, headerValue]) =>
                                headerKey === key && headerValue === mockHeaders[key]
                        )
                    )
            )
        );

    const mockResponseBody = {
        response: {
            val: "value"
        }
    };
    const mockResponseHeaders = {
        custom: "value"
    };
    const mockResponseStatusCode = 203;

    const responseBody1 = { anyProp: "value-1" };
    const responseBody2 = { anyProp: "value-2" };
    const responseBody3 = { anyProp: "value-3" };

    const body1 = {
        arr: [3, 2, 1],
        bool: true,
        str: "string",
        num: 123,
        obj: {
            content: "some content"
        }
    };

    const headers1 = {
        mycustom: "some value"
    };

    const query1 = {
        page: "55",
        type: "request"
    };

    const scriptResponse = (id: string, body: unknown) =>
        `if (true) { const div = document.createElement("div"); div.setAttribute("data-response-type", "body"); div.innerHTML = '${JSON.stringify(body)}'; document.getElementById("${id}").appendChild(div); }`;

    testCaseDescribe("By resource type", (resourceType, bodyFormat, responseCatchType) => {
        const duration = 2000;

        it("Default once", () => {
            const mockResponseStatusCode = 201;

            cy.mockInterceptorResponse(
                { resourceType },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBody1,
                        responseCatchType,
                        status: 203,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        responseBody: responseBody2,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);
        });

        it("Times 2", () => {
            const mockResponseStatusCode = 202;

            cy.mockInterceptorResponse(
                { resourceType },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                },
                { times: 2 }
            );

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBody1,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        responseBody: responseBody2,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_api_3,
                        responseBody: responseBody3,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Infinitely", () => {
            cy.mockInterceptorResponse(
                { resourceType },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                },
                { times: Number.POSITIVE_INFINITY }
            );

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBody1,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_api_2,
                        responseBody: responseBody2,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_api_3,
                        responseBody: responseBody3,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            [testPath_api_1, testPath_api_2, testPath_api_3].forEach((id) => {
                cy.interceptorLastRequest({ resourceType, url: `**/${id}` }).then((stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                });

                getResponseBody(id).should("deep.equal", mockResponseBody);
                checkResponseHeaders(id, mockResponseHeaders).should("be.true");
                getResponseStatus(id).should("eq", mockResponseStatusCode);
            });

            cy.interceptorLastRequest({ url: `**/${testPath_api_1}` }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
            });

            cy.interceptorLastRequest({ url: `**/${testPath_api_2}` }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
            });

            cy.interceptorLastRequest({ url: `**/${testPath_api_3}` }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
            });
        });
    });

    testCaseDescribe("Partial mock", (resourceType, bodyFormat, responseCatchType) => {
        const throttleDelay = 4500;

        const config: DynamicRequest[] = [
            {
                body: body1,
                bodyFormat,
                delay: 100,
                headers: headers1,
                query: query1,
                method: "POST",
                path: testPath_api_1,
                responseBody: responseBody1,
                responseCatchType,
                status: 200,
                type: resourceType
            },
            {
                bodyFormat,
                delay: 150,
                method: "POST",
                path: testPath_api_2,
                responseBody: responseBody2,
                responseCatchType,
                status: 200,
                type: resourceType
            },
            {
                bodyFormat,
                delay: 200,
                method: "POST",
                path: testPath_api_3,
                responseBody: responseBody3,
                responseCatchType,
                status: 200,
                type: resourceType
            }
        ];

        const mockResponseStatusCode = 202;
        const mockResponseStatusText = "_MOCK_STATUS_TEXT";

        it("Only Body", () => {
            cy.mockInterceptorResponse(
                { resourceType },
                {
                    body: mockResponseBody
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("not.eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only Body With Throttle", () => {
            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                mockResponse: {
                    body: mockResponseBody
                }
            });

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("not.eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            getResponseDuration(testPath_api_3).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only GenerateBody", () => {
            cy.mockInterceptorResponse(
                { resourceType },
                {
                    generateBody: ({ body, headers, method, query }) => {
                        expect(body).to.eq(convertToRequestBody(body1, bodyFormat));
                        expect(objectIncludes(headers, headers1)).to.be.true;
                        expect(method).to.eq("POST");
                        expect(objectIncludes(query, query1)).to.be.true;

                        return mockResponseBody;
                    }
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("not.eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only GenerateBody With Throttle", () => {
            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                mockResponse: {
                    generateBody: ({ body, headers, method, query }) => {
                        expect(body).to.eq(convertToRequestBody(body1, bodyFormat));
                        expect(objectIncludes(headers, headers1)).to.be.true;
                        expect(method).to.eq("POST");
                        expect(objectIncludes(query, query1)).to.be.true;

                        return mockResponseBody;
                    }
                }
            });

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("not.eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            getResponseDuration(testPath_api_3).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only Headers", () => {
            cy.mockInterceptorResponse(
                { resourceType },
                {
                    headers: mockResponseHeaders
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("not.eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only Headers With Throttle", () => {
            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                mockResponse: {
                    headers: mockResponseHeaders
                }
            });

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("not.eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            getResponseDuration(testPath_api_3).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only Status Code", () => {
            cy.mockInterceptorResponse(
                { resourceType },
                {
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only Status Code With Throttle", () => {
            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                mockResponse: {
                    statusCode: mockResponseStatusCode
                }
            });

            cy.startTiming();

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Only Status Text", () => {
            cy.mockInterceptorResponse(
                { resourceType },
                {
                    statusText: mockResponseStatusText
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                    expect(stats!.response!.statusText).to.eq(mockResponseStatusText);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("not.eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                    expect(stats!.response!.statusText).not.to.eq(mockResponseStatusText);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).not.to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode).to.eq(200);
                    expect(stats!.response!.statusText).not.to.eq(mockResponseStatusText);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });
    });

    testCaseDescribe("By custom match", (resourceType, bodyFormat, responseCatchType) => {
        const duration = 2000;

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
                bodyFormat,
                delay: 100,
                duration,
                headers: headers1,
                method: "GET",
                query: query1,
                path: testPath_api_1,
                responseBody: responseBody1,
                responseCatchType,
                type: resourceType
            },
            {
                body: body2,
                bodyFormat,
                delay: 150,
                duration,
                method: "POST",
                query: query2,
                path: testPath_api_2,
                responseBody: responseBody2,
                responseCatchType,
                type: resourceType
            },
            {
                body: body3,
                bodyFormat,
                delay: 200,
                duration,
                headers: headers3,
                method: "POST",
                query: { ...query1, ...query2 },
                path: testPath_api_3,
                responseBody: responseBody3,
                responseCatchType,
                type: resourceType
            },
            {
                delay: 250,
                method: "GET",
                path: crossDomainFetch,
                type: resourceType
            }
        ];

        it("Method", () => {
            cy.mockInterceptorResponse(
                { method: "POST" },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Query - shallow match", () => {
            // first load
            cy.mockInterceptorResponse(
                { queryMatcher: createMatcher({ page: query2.page }) },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);

            // second load
            cy.mockInterceptorResponse(
                { queryMatcher: createMatcher({ list: query1.list }) },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);

            // third load
            cy.mockInterceptorResponse(
                { queryMatcher: createMatcher({ state: query1.state }) },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                },
                { times: 2 }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Query - sctrict match - should not match", () => {
            cy.mockInterceptorResponse(
                { queryMatcher: createMatcher({ page: "99" }, true) },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Query - sctrict match - should match", () => {
            cy.mockInterceptorResponse(
                {
                    // url contain extra params generated in getDynamicUrl function
                    queryMatcher: createMatcher(
                        {
                            ...query2,
                            duration: duration.toString(),
                            path: testPath_api_2,
                            responseBody: JSON.stringify(responseBody2)
                        },
                        true
                    )
                },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Cross domain", () => {
            cy.mockInterceptorResponse(
                { crossDomain: true },
                {
                    body: scriptResponse(crossDomainFetch, mockResponseBody),
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);

            cy.interceptorLastRequest({
                resourceType,
                url: crossDomainFetch
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(
                    scriptResponse(crossDomainFetch, mockResponseBody)
                );
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(crossDomainFetch, true).should(
                "deep.equal",
                scriptResponse(crossDomainFetch, mockResponseBody)
            );
        });

        it("HTTPS", () => {
            cy.mockInterceptorResponse(
                { https: true },
                {
                    body: scriptResponse(crossDomainFetch, mockResponseBody),
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);

            cy.interceptorLastRequest({
                resourceType,
                url: crossDomainFetch
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(
                    scriptResponse(crossDomainFetch, mockResponseBody)
                );
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(crossDomainFetch, true).should(
                "deep.equal",
                scriptResponse(crossDomainFetch, mockResponseBody)
            );
        });

        it("URL - ends with", () => {
            cy.mockInterceptorResponse(
                { url: `**/${testPath_api_2}` },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("URL - contains", () => {
            cy.mockInterceptorResponse(
                { url: "**/api/**" },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("URL - RegExp", () => {
            cy.mockInterceptorResponse(
                { url: /api-2$/i },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Headers", () => {
            cy.mockInterceptorResponse(
                { headersMatcher: createMatcher(headers3) },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_3).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_3).should("eq", mockResponseStatusCode);
        });

        it("Body matcher", () => {
            cy.mockInterceptorResponse(
                {
                    bodyMatcher: (bodyString) => {
                        if (
                            bodyFormat === "document" &&
                            bodyString === convertToRequestBody(body2, bodyFormat)
                        ) {
                            return true;
                        }

                        try {
                            const body = JSON.parse(bodyString);

                            return isObject(body) && "pre" in body && body.pre === body2.pre;
                        } catch {
                            return false;
                        }
                    }
                },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                expect(stats!.response!.isMock).to.be.false;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });
    });

    testCaseDescribe("By throttle request", (resourceType, bodyFormat, responseCatchType) => {
        const throttleDelay = 4500;

        it("Default once", () => {
            const mockResponseStatusCode = 201;

            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                mockResponse: {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBody1,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        method: "POST",
                        path: testPath_api_2,
                        responseBody: responseBody2,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
            getResponseDuration(testPath_api_2).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_2).should("eq", 200);
        });

        it("2 times", () => {
            const mockResponseStatusCode = 201;

            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                mockResponse: {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                },
                times: 2
            });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBody1,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        method: "POST",
                        path: testPath_api_2,
                        responseBody: responseBody2,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 200,
                        method: "POST",
                        path: testPath_api_3,
                        responseBody: responseBody3,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_2).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                    expect(stats!.response!.isMock).to.be.false;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
            getResponseDuration(testPath_api_3).should("be.lt", throttleDelay);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_api_3).should("eq", 200);
        });

        it("Infinitely", () => {
            const mockResponseStatusCode = 201;

            cy.throttleInterceptorRequest({ resourceType }, throttleDelay, {
                mockResponse: {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                },
                times: Number.POSITIVE_INFINITY
            });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        bodyFormat,
                        delay: 100,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBody1,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        method: "POST",
                        path: testPath_api_2,
                        responseBody: responseBody2,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 200,
                        method: "POST",
                        path: testPath_api_3,
                        responseBody: responseBody3,
                        responseCatchType,
                        status: 200,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gte", throttleDelay);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_1).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_2).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType, url: `**/${testPath_api_3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                    expect(stats!.response!.isMock).to.be.true;
                    expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                        .true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_api_3).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_api_3).should("be.gte", throttleDelay);
            checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_api_3).should("eq", mockResponseStatusCode);
        });
    });

    it("Remove mock by id", () => {
        const config: DynamicRequest[] = [
            {
                method: "POST",
                path: testPath_api_1,
                responseBody: responseBody1,
                status: 200,
                type: "fetch"
            },
            {
                method: "GET",
                path: testPath_api_2,
                responseBody: responseBody2,
                status: 200,
                type: "fetch"
            },
            {
                method: "POST",
                path: testPath_api_3,
                responseBody: responseBody3,
                status: 200,
                type: "xhr"
            }
        ];

        const mock = {
            body: mockResponseBody,
            headers: mockResponseHeaders,
            statusCode: mockResponseStatusCode
        };

        cy.mockInterceptorResponse({ url: `**/${testPath_api_1}` }, mock, {
            times: Number.POSITIVE_INFINITY
        }).then((mock1Id) => {
            cy.mockInterceptorResponse({ url: `**/${testPath_api_2}` }, mock, {
                times: Number.POSITIVE_INFINITY
            }).then((mock2Id) => {
                cy.mockInterceptorResponse({ url: `**/${testPath_api_3}` }, mock, {
                    times: Number.POSITIVE_INFINITY
                }).then((mock3Id) => {
                    // first load

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone().then((interceptor) => {
                        expect(interceptor.removeMock(mock1Id)).to.be.true;
                        expect(interceptor.removeMock(mock1Id)).to.be.false;
                    });

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                        expect(stats!.response!.isMock).to.be.true;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .true;
                        expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    });

                    getResponseBody(testPath_api_1).should("deep.equal", mockResponseBody);
                    checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.true");
                    getResponseStatus(testPath_api_1).should("eq", mockResponseStatusCode);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                        expect(stats!.response!.isMock).to.be.true;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .true;
                        expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    });

                    getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
                    checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
                    getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                        expect(stats!.response!.isMock).to.be.true;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .true;
                        expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    });

                    getResponseBody(testPath_api_3).should("deep.equal", mockResponseBody);
                    checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.true");
                    getResponseStatus(testPath_api_3).should("eq", mockResponseStatusCode);

                    // second load

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone().then((interceptor) => {
                        expect(interceptor.removeMock(mock2Id)).to.be.true;
                        expect(interceptor.removeMock(mock2Id)).to.be.false;
                    });

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                        expect(stats!.response!.isMock).to.be.false;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .false;
                        expect(stats!.response!.statusCode).to.eq(200);
                    });

                    getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
                    checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
                    getResponseStatus(testPath_api_1).should("eq", 200);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                        expect(stats!.response!.isMock).to.be.true;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .true;
                        expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    });

                    getResponseBody(testPath_api_2).should("deep.equal", mockResponseBody);
                    checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.true");
                    getResponseStatus(testPath_api_2).should("eq", mockResponseStatusCode);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                        expect(stats!.response!.isMock).to.be.true;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .true;
                        expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    });

                    getResponseBody(testPath_api_3).should("deep.equal", mockResponseBody);
                    checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.true");
                    getResponseStatus(testPath_api_3).should("eq", mockResponseStatusCode);

                    // third load

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone().then((interceptor) => {
                        expect(interceptor.removeMock(mock3Id)).to.be.true;
                        expect(interceptor.removeMock(mock3Id)).to.be.false;
                    });

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                        expect(stats!.response!.isMock).to.be.false;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .false;
                        expect(stats!.response!.statusCode).to.eq(200);
                    });

                    getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
                    checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
                    getResponseStatus(testPath_api_1).should("eq", 200);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                        expect(stats!.response!.isMock).to.be.false;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .false;
                        expect(stats!.response!.statusCode).to.eq(200);
                    });

                    getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
                    checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
                    getResponseStatus(testPath_api_2).should("eq", 200);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                        expect(stats!.response!.isMock).to.be.true;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .true;
                        expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    });

                    getResponseBody(testPath_api_3).should("deep.equal", mockResponseBody);
                    checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.true");
                    getResponseStatus(testPath_api_3).should("eq", mockResponseStatusCode);

                    // fourth load

                    cy.visit(getDynamicUrl(config));

                    cy.waitUntilRequestIsDone();

                    cy.interceptorLastRequest(`**/${testPath_api_1}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1));
                        expect(stats!.response!.isMock).to.be.false;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .false;
                        expect(stats!.response!.statusCode).to.eq(200);
                    });

                    getResponseBody(testPath_api_1).should("deep.equal", responseBody1);
                    checkResponseHeaders(testPath_api_1, mockResponseHeaders).should("be.false");
                    getResponseStatus(testPath_api_1).should("eq", 200);

                    cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
                        expect(stats!.response!.isMock).to.be.false;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .false;
                        expect(stats!.response!.statusCode).to.eq(200);
                    });

                    getResponseBody(testPath_api_2).should("deep.equal", responseBody2);
                    checkResponseHeaders(testPath_api_2, mockResponseHeaders).should("be.false");
                    getResponseStatus(testPath_api_2).should("eq", 200);

                    cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody3));
                        expect(stats!.response!.isMock).to.be.false;
                        expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be
                            .false;
                        expect(stats!.response!.statusCode).to.eq(200);
                    });

                    getResponseBody(testPath_api_3).should("deep.equal", responseBody3);
                    checkResponseHeaders(testPath_api_3, mockResponseHeaders).should("be.false");
                    getResponseStatus(testPath_api_3).should("eq", 200);
                });
            });
        });
    });
});
