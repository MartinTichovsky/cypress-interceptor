import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { convertToRequestBody, objectIncludes, testCaseDescribe } from "../src/utils";

const testPath_api_1 = "test/api-1";
const testPath_api_2 = "test/api-2";
const testPath_api_3 = "test/api-3";
const testPath_api_4 = "test/api-4";

const customHeaderKey = "custom-header";
const customHeaderValue = "custom-value";

const duration = 2000;

const body1 = {
    start: true,
    items: [9, false, "s", -1],
    limit: 999
};

const body2 = {
    start: false,
    items: [0, "e", true, 1],
    limit: 777
};

const body3 = {
    e: false,
    o: { e: false, o: 1 },
    i: ["u", 0, true, -1]
};

const body4 = {
    p: {
        o: [-7, false, "p"]
    }
};

const headers = {
    [customHeaderKey]: customHeaderValue
};

const query = {
    custom: "custom"
};

const mockResponseBody = {
    response: {
        val: "value"
    }
};

const mockResponseHeaders = {
    custom: "value"
};

const mockResponseStatusCode = 203;

const responseBody1a = {
    arr: [0, "h", "g", 9, -9, true],
    bool: false,
    obj: {
        arr: [-1, 1, "s", false],
        b: true,
        e: 5,
        s: ""
    },
    num: -159,
    str: "string"
};

const responseBody1b = {
    arr: [0, "h", "g", 9, -9, false],
    bool: true,
    obj: {
        arr: [-1, 1, "s", true],
        b: false,
        e: 7,
        s: ""
    },
    num: -189,
    str: "string 0"
};

const responseBody2 = {
    obje: {
        arr: [1, "s", false],
        b: false,
        e: 5,
        s: "t"
    },
    num: -158,
    str: "string 1"
};

const responseBody3 = {
    arr: [0, "h", "g", 9, -9, true],
    bool: false,
    obj: {
        arr: [-1, 1, "s", false],
        b: true,
        e: 5,
        s: ""
    },
    num: -1590
};

const responseBody4 = {
    arr: [10, "g", 19, -19, true],
    obj: {
        bt: true,
        et: 5,
        st: "tre"
    },
    nume: -1590
};

const throttleDelay = duration * 2;

testCaseDescribe(
    "Working together with Cypress.intercept",
    (resourceType, bodyFormat, responseCatchType, testName) => {
        const requestUrl: string[] = [];
        const responseUrl: string[] = [];

        beforeEach(() => {
            cy.intercept("/test/api*", (req) => {
                requestUrl.push(req.url);

                req.on("response", (res) => {
                    responseUrl.push(req.url);

                    res.send();
                });
            });
        });

        it(testName("Complex testing"), () => {
            cy.throttleInterceptorRequest(`**/${testPath_api_2}`, throttleDelay);

            cy.mockInterceptorResponse(`**/${testPath_api_3}`, {
                body: mockResponseBody,
                headers: mockResponseHeaders,
                statusCode: mockResponseStatusCode
            });

            cy.mockInterceptorResponse(`**/${testPath_api_4}`, {
                headers: mockResponseHeaders,
                statusCode: mockResponseStatusCode
            });

            cy.visit(
                getDynamicUrl([
                    {
                        body: body1,
                        bodyFormat,
                        delay: 100,
                        duration,
                        headers,
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBody1a,
                        responseCatchType,
                        query,
                        type: resourceType
                    },
                    {
                        bodyFormat,
                        delay: 150,
                        duration,
                        headers,
                        method: "GET",
                        path: testPath_api_1,
                        responseBody: responseBody1b,
                        responseCatchType,
                        query,
                        type: resourceType
                    },
                    {
                        body: body2,
                        bodyFormat,
                        delay: 200,
                        duration,
                        headers,
                        method: "POST",
                        path: testPath_api_2,
                        responseBody: responseBody2,
                        responseCatchType,
                        query,
                        type: resourceType
                    },
                    {
                        body: body3,
                        bodyFormat,
                        delay: 250,
                        duration,
                        headers,
                        method: "POST",
                        path: testPath_api_3,
                        responseBody: responseBody3,
                        responseCatchType,
                        query,
                        type: resourceType
                    },
                    {
                        body: body4,
                        bodyFormat,
                        delay: 250,
                        duration,
                        headers,
                        method: "POST",
                        path: testPath_api_4,
                        responseBody: responseBody4,
                        responseCatchType,
                        query,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone().then(() => {
                // the 5th request is mocked
                expect(requestUrl).to.have.length(4);
                expect(responseUrl).to.have.length(4);
            });

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(5);

                stats.forEach((stat) => {
                    expect(stat.isPending).to.be.false;
                    expect(stat.response).not.to.be.undefined;
                });
            });

            cy.interceptorLastRequest({
                method: "POST",
                url: `**/${testPath_api_1}`
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.body).to.be.eq(convertToRequestBody(body1, bodyFormat));
                expect(objectIncludes(stats!.request.headers, headers)).to.be.true;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1a));
            });

            cy.interceptorLastRequest({
                method: "GET",
                url: `**/${testPath_api_1}`
            }).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.request.query).to.deep.eq({
                    ...query,
                    duration: duration.toString(),
                    path: testPath_api_1,
                    responseBody: JSON.stringify(responseBody1b)
                });
                expect(objectIncludes(stats!.request.headers, headers)).to.be.true;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody1b));
            });

            cy.interceptorLastRequest(`**/${testPath_api_2}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.delay).to.be.eq(throttleDelay);
                expect(stats!.duration).to.be.gte(throttleDelay);
                expect(stats!.request.body).to.be.eq(convertToRequestBody(body2, bodyFormat));
                expect(objectIncludes(stats!.request.headers, headers)).to.be.true;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody2));
            });

            cy.interceptorLastRequest(`**/${testPath_api_3}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(mockResponseBody));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });

            cy.interceptorLastRequest(`**/${testPath_api_4}`).then((stats) => {
                expect(stats).not.to.be.undefined;
                expect(stats!.response).not.to.be.undefined;
                expect(stats!.response!.body).to.deep.eq(JSON.stringify(responseBody4));
                expect(stats!.response!.isMock).to.be.true;
                expect(objectIncludes(stats!.response!.headers, mockResponseHeaders)).to.be.true;
                expect(stats!.response!.statusCode).to.eq(mockResponseStatusCode);
            });
        });
    }
);
