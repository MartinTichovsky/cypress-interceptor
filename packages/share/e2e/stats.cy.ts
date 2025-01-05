import { CallStack } from "cypress-interceptor/src/Interceptor.types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { convertToRequestBody, testCaseDescribe } from "../src/utils";

describe("Stats", () => {
    const testPath_api_1 = "test/api-1";

    const duration = 2000;

    const responseBodyFetch = {
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

    testCaseDescribe("Simple", (resourceType, bodyFormat, responseCatchType, testName) => {
        it(testName("Resource"), () => {
            const body = {
                start: true,
                items: [9, false, "s", -1],
                limit: 999
            };

            const query = {
                custom: "custom"
            };

            const customHeaderKey = "custom-header";
            const customHeaderValue = "custom-value";

            let timeEnd: number;
            let timeStart: number;

            cy.wrap(null).then(() => (timeStart = new Date().getTime()));

            cy.visit(
                getDynamicUrl([
                    {
                        body,
                        bodyFormat,
                        delay: 100,
                        duration,
                        headers: {
                            [customHeaderKey]: customHeaderValue
                        },
                        method: "POST",
                        path: testPath_api_1,
                        responseBody: responseBodyFetch,
                        responseCatchType,
                        query,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.wrap(null).then(() => (timeEnd = new Date().getTime()));

            const testStats = (stats: CallStack) => {
                expect(stats.crossDomain).to.be.false;
                expect(stats.delay).to.be.undefined;
                expect(stats.duration).to.be.gt(duration);
                expect(stats.isPending).to.be.false;
                expect(stats.request.body).to.eq(convertToRequestBody(body, bodyFormat));
                expect(stats.request.headers[customHeaderKey]).to.eq(customHeaderValue);
                expect(stats.request.query).to.deep.eq({
                    ...query,
                    duration: duration.toString(),
                    path: testPath_api_1,
                    responseBody: JSON.stringify(responseBodyFetch)
                });
                expect(stats.request.method).to.eq("POST");
                expect(new Date(stats.timeStart).getTime()).to.be.gt(timeStart);
                expect(stats.resourceType).to.eq(resourceType);
                expect(stats.response).not.to.be.undefined;
                expect(stats.response!.body).to.deep.eq(JSON.stringify(responseBodyFetch));
                expect(stats.response!.statusCode).to.eq(200);
                expect(stats.response!.statusText).to.eq("OK");
                expect(stats.response!.timeEnd).not.to.be.undefined;
                expect(new Date(stats.response!.timeEnd).getTime()).to.be.lt(timeEnd);
                expect(stats.url.pathname.endsWith(testPath_api_1)).to.be.true;
            };

            cy.interceptorStats({ resourceType }).then((stats) => {
                expect(stats.length).to.eq(1);
                testStats(stats[0]);
            });

            cy.interceptorLastRequest({ resourceType }).then((stats) => {
                expect(stats).not.to.be.undefined;
                testStats(stats!);
            });
        });
    });
});
