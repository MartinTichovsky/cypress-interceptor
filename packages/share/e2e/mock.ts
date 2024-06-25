import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { crossDomainScript } from "../src/constants";
import {
    getResponseBody,
    getResponseDuration,
    getResponseHeaders,
    getResponseStatus
} from "../src/selectors";
import { createMatcher, isObject } from "../src/utils";

describe("Mock Respose", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "api/fetch-2";
    const testPath_Fetch3 = "test/fetch-3";
    const testPath_Script1 = "test/script-1.js";
    const testPath_Script2 = "test/script-2.js";

    const duration = 2000;

    const checkHeaders = (
        headers: { [key: string]: string | string[] } | undefined,
        mockHeaders: { [key: string]: string }
    ) =>
        Object.keys(mockHeaders).every(
            (key) => headers && key in headers && headers[key] === mockHeaders[key]
        );

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
    const responseString = "if (false) {}";

    const scriptResponse = (id: string, body: unknown) =>
        `if (true) { const div = document.createElement("div"); div.setAttribute("data-response-type", "body"); div.innerHTML = '${JSON.stringify(body)}'; document.getElementById("${id}").appendChild(div); }`;

    describe("By resource type", () => {
        it("Fetch - default once", () => {
            const mockResponseStatusCode = 201;

            cy.mockInterceptorResponse(
                { resourceType: "fetch" },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody1,
                        status: 203,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode_origin).to.eq(203);
                }
            );

            getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(responseBody2);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch2).should("eq", 200);
        });

        it("Fetch - times 2", () => {
            const mockResponseStatusCode = 202;

            cy.mockInterceptorResponse(
                { resourceType: "fetch" },
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
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody1,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_Fetch3,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode_origin).to.eq(200);
                }
            );

            getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                    expect(stats!.response!.statusCode_origin).to.eq(200);
                }
            );

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(responseBody2);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
        });

        it("Fetch - infinitely", () => {
            cy.mockInterceptorResponse(
                { resourceType: "fetch" },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                },
                { times: 0 }
            );

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody1,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_Fetch3,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            [testPath_Fetch1, testPath_Fetch2, testPath_Fetch3].forEach((id) => {
                cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${id}` }).then(
                    (stats) => {
                        expect(stats).not.to.be.undefined;
                        expect(stats!.response).not.to.be.undefined;
                        expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                        expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be
                            .true;
                        expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                        expect(stats!.response!.statusCode_origin).to.eq(200);
                    }
                );

                getResponseBody(id).should("deep.equal", mockResponseBody);
                checkResponseHeaders(id, mockResponseHeaders).should("be.true");
                getResponseStatus(id).should("eq", mockResponseStatusCode);
            });

            cy.interceptorLastRequest({ url: `**/${testPath_Fetch1}` }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
            });

            cy.interceptorLastRequest({ url: `**/${testPath_Fetch2}` }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
            });

            cy.interceptorLastRequest({ url: `**/${testPath_Fetch3}` }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
            });
        });

        it("Script - default once", () => {
            const mockResponseStatusCode = 302;

            cy.mockInterceptorResponse(
                { resourceType: "script" },
                {
                    body: scriptResponse(testPath_Script1, mockResponseBody),
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody2,
                        status: 202,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        path: testPath_Script1,
                        responseBody: responseString,
                        status: 200,
                        type: "script"
                    },
                    {
                        delay: 200,
                        duration,
                        path: testPath_Script2,
                        responseBody: scriptResponse(testPath_Script2, responseBody2),
                        status: 200,
                        type: "script"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(responseBody2);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                    expect(stats!.response!.statusCode).to.eq(202);
                }
            );

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 202);

            cy.interceptorLastRequest({
                resourceType: "script",
                url: `**/${testPath_Script1}`
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.eq(
                    scriptResponse(testPath_Script1, mockResponseBody)
                );
                expect(stats!.response!.body_origin).to.eq(responseString);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Script1, false).should("deep.equal", mockResponseBody);

            cy.interceptorLastRequest({
                resourceType: "script",
                url: `**/${testPath_Script2}`
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.eq(
                    scriptResponse(testPath_Script2, responseBody2)
                );
                expect(stats!.response!.body_origin).to.deep.eq(
                    scriptResponse(testPath_Script2, responseBody2)
                );
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Script2, false).should("deep.equal", responseBody2);
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
                responseBody: responseBody1,
                type: "fetch"
            },
            {
                body: body2,
                delay: 150,
                duration,
                method: "POST",
                query: query2,
                path: testPath_Fetch2,
                responseBody: responseBody2,
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
                responseBody: responseBody3,
                type: "fetch"
            },
            {
                delay: 250,
                path: crossDomainScript,
                type: "script"
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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);

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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);

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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
        });

        it("Query - sctrict match - should match", () => {
            cy.mockInterceptorResponse(
                {
                    // url contain extra params generated in getDynamicUrl function
                    queryMatcher: createMatcher(
                        {
                            ...query2,
                            duration: duration.toString(),
                            path: testPath_Fetch2,
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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
        });

        it("Cross domain", () => {
            cy.interceptorOptions({ ingoreCrossDomain: false });
            cy.mockInterceptorResponse(
                { crossDomain: true },
                {
                    body: scriptResponse(crossDomainScript, mockResponseBody),
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);

            cy.interceptorLastRequest({
                resourceType: "script",
                url: crossDomainScript
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(
                    scriptResponse(crossDomainScript, mockResponseBody)
                );
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(crossDomainScript, false).should("deep.equal", mockResponseBody);
        });

        it("HTTPS", () => {
            cy.interceptorOptions({ ingoreCrossDomain: false });
            cy.mockInterceptorResponse(
                { https: true },
                {
                    body: scriptResponse(crossDomainScript, mockResponseBody),
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);

            cy.interceptorLastRequest({
                resourceType: "script",
                url: crossDomainScript
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(
                    scriptResponse(crossDomainScript, mockResponseBody)
                );
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(crossDomainScript, false).should("deep.equal", mockResponseBody);
        });

        it("URL - ends with", () => {
            cy.mockInterceptorResponse(
                { url: `**/${testPath_Fetch2}` },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
        });

        it("URL - RegExp", () => {
            cy.mockInterceptorResponse(
                { url: /fetch-2$/i },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
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

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch2).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch3).should("eq", mockResponseStatusCode);
        });

        it("Body matcher", () => {
            cy.mockInterceptorResponse(
                {
                    bodyMatcher: (body) => isObject(body) && "pre" in body && body.pre === body2.pre
                },
                {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                }
            );

            cy.visit(getDynamicUrl(config));

            cy.waitUntilRequestIsDone();

            cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("GET");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody1);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch1).should("eq", 200);

            cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.method).to.eq("POST");
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(responseBody3);
                expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                expect(stats!.response!.statusCode).to.eq(200);
            });

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
        });
    });

    describe("By throttle request - resource type", () => {
        const duration = 1500;
        const throttleDelay = duration * 3;

        it("Fetch - default once", () => {
            const mockResponseStatusCode = 201;

            cy.throttleInterceptorRequest({ resourceType: "fetch" }, throttleDelay, {
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
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody1,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(responseBody2);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
            getResponseDuration(testPath_Fetch2)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch2).should("eq", 200);
        });

        it("Fetch - 2 times", () => {
            const mockResponseStatusCode = 201;

            cy.throttleInterceptorRequest({ resourceType: "fetch" }, throttleDelay, {
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
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody1,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_Fetch3,
                        responseBody: responseBody3,
                        status: 200,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.be.undefined;
                    expect(stats!.response!.body).to.deep.eq(responseBody3);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.false;
                    expect(stats!.response!.statusCode).to.eq(200);
                }
            );

            getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
            getResponseDuration(testPath_Fetch3)
                .should("be.gt", duration)
                .should("be.lt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.false");
            getResponseStatus(testPath_Fetch3).should("eq", 200);
        });

        it("Fetch - infinitely", () => {
            const mockResponseStatusCode = 201;

            cy.throttleInterceptorRequest({ resourceType: "fetch" }, throttleDelay, {
                mockResponse: {
                    body: mockResponseBody,
                    headers: mockResponseHeaders,
                    statusCode: mockResponseStatusCode
                },
                times: 0
            });

            cy.startTiming();

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody1,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration,
                        method: "POST",
                        path: testPath_Fetch2,
                        responseBody: responseBody2,
                        status: 200,
                        type: "fetch"
                    },
                    {
                        delay: 200,
                        duration,
                        method: "POST",
                        path: testPath_Fetch3,
                        responseBody: responseBody3,
                        status: 200,
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", duration + throttleDelay);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch1}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_Fetch1).should("be.gt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch2}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_Fetch2).should("be.gt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

            cy.interceptorLastRequest({ resourceType: "fetch", url: `**/${testPath_Fetch3}` }).then(
                (stats) => {
                    expect(stats).not.to.be.undefined;
                    expect(stats!.response).not.to.be.undefined;
                    expect(stats!.delay).to.eq(throttleDelay);
                    expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                    expect(stats!.response!.body_origin).to.deep.eq(responseBody3);
                    expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                    expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                }
            );

            getResponseBody(testPath_Fetch3).should("deep.equal", mockResponseBody);
            getResponseDuration(testPath_Fetch3).should("be.gt", duration + throttleDelay);
            checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should("be.true");
            getResponseStatus(testPath_Fetch3).should("eq", mockResponseStatusCode);
        });
    });

    it("Generate body from response", () => {
        const mockResponseStatusCode = 201;

        cy.mockInterceptorResponse(
            { resourceType: "fetch" },
            {
                generateBody: (_req, body) => {
                    expect(body).to.deep.eq(responseBody1);

                    return mockResponseBody;
                },
                headers: mockResponseHeaders,
                statusCode: mockResponseStatusCode
            }
        );

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    responseBody: responseBody1,
                    status: 200,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest({ url: `**/${testPath_Fetch1}` }).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
            expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            expect(stats!.response!.statusCode_origin).to.eq(200);
        });

        getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
        checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
        getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);
    });

    it("Generate body from request", () => {
        const body = { page: 1, next: false, obj: { a: [0, 2, 4] } };
        const mockResponseStatusCode = 202;
        const query = { silent: "true" };

        const customHeaderKey = "custom-header";
        const customHeaderValue = "custom-value";

        cy.mockInterceptorResponse(
            { resourceType: "fetch" },
            {
                generateBody: (req) => {
                    expect(req.body).to.deep.eq(body);
                    expect(req.query).to.deep.eq({
                        ...query,
                        path: testPath_Fetch1,
                        responseBody: JSON.stringify(responseBody1),
                        status: "200"
                    });
                    expect(req.method).to.eq("POST");
                    expect(req.headers[customHeaderKey]).to.eq(customHeaderValue);

                    return mockResponseBody;
                },
                headers: mockResponseHeaders,
                statusCode: mockResponseStatusCode
            }
        );

        cy.visit(
            getDynamicUrl([
                {
                    body,
                    delay: 100,
                    headers: {
                        [customHeaderKey]: customHeaderValue
                    },
                    method: "POST",
                    path: testPath_Fetch1,
                    responseBody: responseBody1,
                    query,
                    status: 200,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest({ url: `**/${testPath_Fetch1}` }).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
            expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to.be.true;
            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            expect(stats!.response!.statusCode_origin).to.eq(200);
        });

        getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
        checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should("be.true");
        getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);
    });

    it("Remove mock by id", () => {
        const config: DynamicRequest[] = [
            {
                method: "POST",
                path: testPath_Fetch1,
                responseBody: responseBody1,
                status: 200,
                type: "fetch"
            },
            {
                method: "GET",
                path: testPath_Fetch2,
                responseBody: responseBody2,
                status: 200,
                type: "fetch"
            },
            {
                method: "POST",
                path: testPath_Fetch3,
                responseBody: responseBody3,
                status: 200,
                type: "fetch"
            }
        ];

        const mock = {
            body: mockResponseBody,
            headers: mockResponseHeaders,
            statusCode: mockResponseStatusCode
        };

        cy.mockInterceptorResponse({ url: `**/${testPath_Fetch1}` }, mock, { times: 0 }).then(
            (mock1Id) => {
                cy.mockInterceptorResponse({ url: `**/${testPath_Fetch2}` }, mock, {
                    times: 0
                }).then((mock2Id) => {
                    cy.mockInterceptorResponse({ url: `**/${testPath_Fetch3}` }, mock, {
                        times: 0
                    }).then((mock3Id) => {
                        // first load

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone().then((interceptor) => {
                            expect(interceptor.removeMock(mock1Id)).to.be.true;
                            expect(interceptor.removeMock(mock1Id)).to.be.false;
                        });

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                            expect(stats!.response!.body_origin).to.deep.eq(responseBody1);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.true;
                            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                        });

                        getResponseBody(testPath_Fetch1).should("deep.equal", mockResponseBody);
                        checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should(
                            "be.true"
                        );
                        getResponseStatus(testPath_Fetch1).should("eq", mockResponseStatusCode);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                            expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.true;
                            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                        });

                        getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
                        checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should(
                            "be.true"
                        );
                        getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                            expect(stats!.response!.body_origin).to.deep.eq(responseBody3);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.true;
                            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                        });

                        getResponseBody(testPath_Fetch3).should("deep.equal", mockResponseBody);
                        checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should(
                            "be.true"
                        );
                        getResponseStatus(testPath_Fetch3).should("eq", mockResponseStatusCode);

                        // second load

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone().then((interceptor) => {
                            expect(interceptor.removeMock(mock2Id)).to.be.true;
                            expect(interceptor.removeMock(mock2Id)).to.be.false;
                        });

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(responseBody1);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.false;
                            expect(stats!.response!.statusCode).to.eq(200);
                        });

                        getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
                        checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should(
                            "be.false"
                        );
                        getResponseStatus(testPath_Fetch1).should("eq", 200);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                            expect(stats!.response!.body_origin).to.deep.eq(responseBody2);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.true;
                            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                        });

                        getResponseBody(testPath_Fetch2).should("deep.equal", mockResponseBody);
                        checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should(
                            "be.true"
                        );
                        getResponseStatus(testPath_Fetch2).should("eq", mockResponseStatusCode);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                            expect(stats!.response!.body_origin).to.deep.eq(responseBody3);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.true;
                            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                        });

                        getResponseBody(testPath_Fetch3).should("deep.equal", mockResponseBody);
                        checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should(
                            "be.true"
                        );
                        getResponseStatus(testPath_Fetch3).should("eq", mockResponseStatusCode);

                        // third load

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone().then((interceptor) => {
                            expect(interceptor.removeMock(mock3Id)).to.be.true;
                            expect(interceptor.removeMock(mock3Id)).to.be.false;
                        });

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(responseBody1);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.false;
                            expect(stats!.response!.statusCode).to.eq(200);
                        });

                        getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
                        checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should(
                            "be.false"
                        );
                        getResponseStatus(testPath_Fetch1).should("eq", 200);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(responseBody2);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.false;
                            expect(stats!.response!.statusCode).to.eq(200);
                        });

                        getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
                        checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should(
                            "be.false"
                        );
                        getResponseStatus(testPath_Fetch2).should("eq", 200);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(mockResponseBody);
                            expect(stats!.response!.body_origin).to.deep.eq(responseBody3);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.true;
                            expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
                        });

                        getResponseBody(testPath_Fetch3).should("deep.equal", mockResponseBody);
                        checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should(
                            "be.true"
                        );
                        getResponseStatus(testPath_Fetch3).should("eq", mockResponseStatusCode);

                        // fourth load

                        cy.visit(getDynamicUrl(config));

                        cy.waitUntilRequestIsDone();

                        cy.interceptorLastRequest(`**/${testPath_Fetch1}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(responseBody1);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.false;
                            expect(stats!.response!.statusCode).to.eq(200);
                        });

                        getResponseBody(testPath_Fetch1).should("deep.equal", responseBody1);
                        checkResponseHeaders(testPath_Fetch1, mockResponseHeaders).should(
                            "be.false"
                        );
                        getResponseStatus(testPath_Fetch1).should("eq", 200);

                        cy.interceptorLastRequest(`**/${testPath_Fetch2}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(responseBody2);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.false;
                            expect(stats!.response!.statusCode).to.eq(200);
                        });

                        getResponseBody(testPath_Fetch2).should("deep.equal", responseBody2);
                        checkResponseHeaders(testPath_Fetch2, mockResponseHeaders).should(
                            "be.false"
                        );
                        getResponseStatus(testPath_Fetch2).should("eq", 200);

                        cy.interceptorLastRequest(`**/${testPath_Fetch3}`).then((stats) => {
                            expect(stats).not.to.be.undefined;
                            expect(stats!.response).not.to.be.undefined;
                            expect(stats!.response!.body).to.deep.eq(responseBody3);
                            expect(checkHeaders(stats!.response!.headers, mockResponseHeaders)).to
                                .be.false;
                            expect(stats!.response!.statusCode).to.eq(200);
                        });

                        getResponseBody(testPath_Fetch3).should("deep.equal", responseBody3);
                        checkResponseHeaders(testPath_Fetch3, mockResponseHeaders).should(
                            "be.false"
                        );
                        getResponseStatus(testPath_Fetch3).should("eq", 200);
                    });
                });
            }
        );
    });
});
