import { CallStack } from "cypress-interceptor/src/interceptor";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { HOST } from "../src/constants";

describe("Stats", () => {
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Script1 = "test/script-1.js";

    const duration = 2000;

    describe("Simple", () => {
        it("Fetch", () => {
            const body = {
                start: true,
                items: [9, false, "s", -1],
                limit: 999
            };

            const query = {
                custom: "custom"
            };

            const responseBody = {
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

            const customHeaderKey = "custom-header";
            const customHeaderValue = "custom-value";

            let timeEnd: number;
            let timeStart: number;

            cy.wrap(null).then(() => (timeStart = new Date().getTime()));

            cy.visit(
                getDynamicUrl([
                    {
                        body,
                        delay: 100,
                        duration,
                        headers: {
                            [customHeaderKey]: customHeaderValue
                        },
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody,
                        query,
                        type: "fetch"
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
                expect(stats.request.body).to.deep.eq(body);
                expect(stats.request.headers["host"]).to.eq(HOST);
                expect(stats.request.headers[customHeaderKey]).to.eq(customHeaderValue);
                expect(stats.request.query).to.deep.eq({
                    ...query,
                    duration: duration.toString(),
                    path: testPath_Fetch1,
                    responseBody: JSON.stringify(responseBody)
                });
                expect(stats.request.method).to.eq("POST");
                expect(new Date(stats.timeStart).getTime()).to.be.gt(timeStart);
                expect(stats.resourceType).to.eq("fetch");
                expect(stats.response).not.to.be.undefined;
                expect(stats.response!.body).to.deep.eq(responseBody);
                expect(stats.response!.statusCode).to.eq(200);
                expect(stats.response!.statusMessage).to.eq("OK");
                expect(stats.response!.timeEnd).not.to.be.undefined;
                expect(new Date(stats.response!.timeEnd).getTime()).to.be.lt(timeEnd);
                expect(stats.url.endsWith(testPath_Fetch1)).to.be.true;
            };

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                testStats(stats[0]);
            });

            cy.interceptorLastRequest({ resourceType: "fetch" }).then((stats) => {
                expect(stats).not.to.be.undefined;
                testStats(stats!);
            });
        });

        it("Script", () => {
            const responseBody = "if (true){ }";

            let timeEnd: number;
            let timeStart: number;

            cy.wrap(null).then(() => (timeStart = new Date().getTime()));

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        path: testPath_Script1,
                        responseBody,
                        type: "script"
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
                expect(stats.request.body).to.eq("");
                expect(stats.request.headers["host"]).to.eq(HOST);
                expect(stats.request.query).to.deep.eq({
                    duration: duration.toString(),
                    path: testPath_Script1,
                    responseBody: responseBody
                });
                expect(stats.request.method).to.eq("GET");
                expect(new Date(stats.timeStart).getTime()).to.be.gt(timeStart);
                expect(stats.resourceType).to.eq("script");
                expect(stats.response).not.to.be.undefined;
                expect(stats.response!.body).to.eq(responseBody);
                expect(stats.response!.statusCode).to.eq(200);
                expect(stats.response!.statusMessage).to.eq("OK");
                expect(stats.response!.timeEnd).not.to.be.undefined;
                expect(new Date(stats.response!.timeEnd).getTime()).to.be.lt(timeEnd);
                expect(stats.url.endsWith(testPath_Script1)).to.be.true;
            };

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(1);
                testStats(stats[0]);
            });

            cy.interceptorLastRequest({ resourceType: "script" }).then((stats) => {
                expect(stats).not.to.be.undefined;
                testStats(stats!);
            });
        });
    });
});
