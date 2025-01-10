import { CallStack } from "cypress-interceptor/src/Interceptor.types";
import { getFilePath } from "cypress-interceptor/src/utils";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { convertToRequestBody, testCaseIt } from "../src/utils";

function createOutputFileName(outputDir: string, fileName?: string) {
    const type = "stats";

    return fileName
        ? `${outputDir}/${fileName}.${type}.json`
        : getFilePath(undefined, outputDir, type);
}

const outputDir = "_stats";
const testPath_Fetch_1 = "stats/fetch-1";

before(() => {
    cy.task("clearLogs", [outputDir]);
});

describe("Custom", () => {
    it("Interceptor options", () => {
        cy.interceptorOptions().then((options) => {
            expect(options).to.deep.eq({
                ingoreCrossDomain: false
            });
        });
    });

    it("Stats to file - name auto generated", () => {
        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch_1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(`${outputDir}/`);

            cy.readFile(createOutputFileName(outputDir)).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(
                    stats.every((entry) => new URL(entry.url).pathname.endsWith(testPath_Fetch_1))
                ).to.be.true;
            });
        });
    });

    it("Stats to file - strict name", () => {
        const fileName = "FILE_NAME_STATS";

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch_1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(outputDir, { fileName });

            cy.readFile(createOutputFileName(outputDir, fileName)).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(
                    stats.every((entry) => new URL(entry.url).pathname.endsWith(testPath_Fetch_1))
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
            const outputDir = "_logs";

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
                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    prettyOutput: true
                });

                cy.readFile(createOutputFileName(outputDir, fileName)).then(
                    (stats: CallStack[]) => {
                        expect(stats.length).to.eq(2);
                    }
                );

                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    prettyOutput: true,
                    routeMatcher: { resourceType }
                });

                cy.readFile(createOutputFileName(outputDir, fileName)).then(
                    (stats: CallStack[]) => {
                        expect(stats.length).to.eq(2);
                        expect(stats.every((entry) => entry.resourceType === resourceType)).to.be
                            .true;
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
                        expect(Object.entries(stats[0].response?.headers ?? {}).length).to.be.above(
                            0
                        );
                        expect(Object.entries(stats[1].response?.headers ?? {}).length).to.be.above(
                            2
                        );
                    }
                );

                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    routeMatcher: { method: "GET", resourceType: [resourceType] }
                });

                cy.readFile(createOutputFileName(outputDir, fileName)).then(
                    (stats: CallStack[]) => {
                        expect(stats.length).to.eq(1);
                        expect(stats.every((entry) => entry.request.method === "GET")).to.be.true;
                    }
                );

                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    filter: (callStack) => callStack.url.pathname.endsWith(testPath_Fetch1)
                });

                cy.readFile(createOutputFileName(outputDir, fileName)).then(
                    (stats: CallStack[]) => {
                        expect(stats.length).to.eq(1);
                        expect(new URL(stats[0].url).pathname.endsWith(testPath_Fetch1)).to.be.true;
                    }
                );

                intereptor.writeStatsToLog(outputDir, {
                    fileName,
                    mapper: (callStack) => ({ isPending: callStack.isPending, url: callStack.url })
                });

                cy.readFile(createOutputFileName(outputDir, fileName)).then(
                    (stats: CallStack[]) => {
                        expect(stats.length).to.eq(2);
                        expect(
                            stats.every(
                                (entry) =>
                                    entry.isPending === false &&
                                    entry.url !== undefined &&
                                    Object.keys(entry).length === 2
                            )
                        ).to.be.true;
                    }
                );
            });
        }
    );

    it("This is a very long test name that is designed to have a length of exactly three hundred characters. It is important to ensure that the length of this string is exactly three hundred characters so that it can be used in tests that require such a long string. This string should be long enough to meet the requirement.", () => {
        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch_1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(outputDir);

            const fileName = createOutputFileName(outputDir);

            expect(fileName).to.have.length.be.lte(255);

            cy.readFile(createOutputFileName(outputDir)).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(
                    stats.every((entry) => new URL(entry.url).pathname.endsWith(testPath_Fetch_1))
                ).to.be.true;
            });
        });
    });

    it("stopTiming", () => {
        cy.stopTiming().should("be.undefined");
    });
});
