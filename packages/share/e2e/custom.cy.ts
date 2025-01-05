import { CallStack } from "cypress-interceptor/src/Interceptor.types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { convertToRequestBody, testCaseIt } from "../src/utils";

// TODO: create max length of the file name test

describe("Custom", () => {
    it("Interceptor options", () => {
        cy.interceptorOptions().then((options) => {
            expect(options).to.deep.eq({
                ingoreCrossDomain: false
            });
        });
    });

    it("Stats to file - name auto generated", () => {
        const testPath_Fetch1 = "stats/fetch-1";
        const outDir = "_stats/";

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(outDir);

            cy.readFile(
                `${outDir}index.cy.ts (Custom - Stats to file - name auto generated).stats.json`
            ).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(
                    stats.every((entry) => new URL(entry.url).pathname.endsWith(testPath_Fetch1))
                ).to.be.true;
            });
        });
    });

    it("Stats to file - strict name", () => {
        const testPath_Fetch1 = "stats/fetch-1";
        const fileName = "FILE_NAME_STATS";
        const outDir = "_logs";

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(outDir, { fileName });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(
                    stats.every((entry) => new URL(entry.url).pathname.endsWith(testPath_Fetch1))
                ).to.be.true;
            });
        });
    });

    testCaseIt(
        "Stats to file - matcher, filter, mapper",
        (resourceType, bodyFormat, responseCatchType) => {
            const testPath_Fetch1 = "stats/fetch-1";
            const testPath_Fetch2 = "stats/fetch-2";
            const fileName = "FILE_NAME_FILTER";
            const outDir = "_logs";

            const customHeader = (source: string) => ({
                "custom-header": source
            });

            const requestBody = (source: string) => ({
                requestSource: source,
                someValue: "any",
                num: 123,
                bool: true
            });

            const requestQuery = (source: string) => ({
                requestSource: source,
                someValue: "any",
                num: "123",
                bool: "true"
            });

            const responseBody = (source: string) => ({
                responseSource: source,
                someValue: "value",
                num: 987,
                bool: false
            });

            const testPath_Fetch1_Headers = customHeader(testPath_Fetch1);
            const testPath_Fetch2_Headers = customHeader(testPath_Fetch2);

            cy.visit(
                getDynamicUrl([
                    {
                        body: requestBody(testPath_Fetch1),
                        bodyFormat,
                        delay: 100,
                        headers: testPath_Fetch1_Headers,
                        method: "POST",
                        path: testPath_Fetch1,
                        responseBody: responseBody(testPath_Fetch1),
                        responseCatchType,
                        type: resourceType
                    },
                    {
                        delay: 200,
                        headers: testPath_Fetch2_Headers,
                        method: "GET",
                        path: testPath_Fetch2,
                        query: requestQuery(testPath_Fetch2),
                        responseBody: responseBody(testPath_Fetch2),
                        responseCatchType,
                        type: resourceType
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.interceptor().then((intereptor) => {
                intereptor.writeStatsToLog(outDir, {
                    fileName,
                    prettyOutput: true
                });

                cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                    expect(stats.length).to.eq(2);
                });

                intereptor.writeStatsToLog(outDir, {
                    fileName,
                    prettyOutput: true,
                    routeMatcher: { resourceType }
                });

                cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                    expect(stats.length).to.eq(2);
                    expect(stats.every((entry) => entry.resourceType === resourceType)).to.be.true;
                    Object.entries(testPath_Fetch1_Headers).every(([key, value]) => {
                        expect(stats[0].request.headers[key]).to.eq(value);
                    });
                    Object.entries(testPath_Fetch2_Headers).every(([key, value]) => {
                        expect(stats[1].request.headers[key]).to.eq(value);
                    });
                    expect(stats[0].request.body).to.eq(
                        convertToRequestBody(requestBody(testPath_Fetch1), bodyFormat)
                    );
                    expect(stats[1].request.body).to.eq("");
                    expect(stats[1].request.query).to.deep.eq({
                        ...requestQuery(testPath_Fetch2),
                        path: testPath_Fetch2,
                        responseBody: JSON.stringify(responseBody(testPath_Fetch2))
                    });
                    expect(stats[0].response!.body).to.eq(
                        JSON.stringify(responseBody(testPath_Fetch1))
                    );
                    expect(stats[1].response!.body).to.eq(
                        JSON.stringify(responseBody(testPath_Fetch2))
                    );
                    expect(Object.entries(stats[0].response?.headers ?? {}).length).to.be.above(0);
                    expect(Object.entries(stats[1].response?.headers ?? {}).length).to.be.above(2);
                });

                intereptor.writeStatsToLog(outDir, {
                    fileName,
                    routeMatcher: { method: "GET", resourceType: [resourceType] }
                });

                cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                    expect(stats.length).to.eq(1);
                    expect(stats.every((entry) => entry.request.method === "GET")).to.be.true;
                });

                intereptor.writeStatsToLog(outDir, {
                    fileName,
                    filter: (callStack) => callStack.url.pathname.endsWith(testPath_Fetch1)
                });

                cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                    expect(stats.length).to.eq(1);
                    expect(new URL(stats[0].url).pathname.endsWith(testPath_Fetch1)).to.be.true;
                });

                intereptor.writeStatsToLog(outDir, {
                    fileName,
                    mapper: (callStack) => ({ isPending: callStack.isPending, url: callStack.url })
                });

                cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                    expect(stats.length).to.eq(2);
                    expect(
                        stats.every(
                            (entry) =>
                                entry.isPending === false &&
                                entry.url !== undefined &&
                                Object.keys(entry).length === 2
                        )
                    ).to.be.true;
                });
            });
        }
    );

    it("stopTiming", () => {
        cy.stopTiming().should("be.undefined");
    });
});
