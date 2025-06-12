import { convertInputBodyToString } from "cypress-interceptor/convert/convert";
import { CallStack } from "cypress-interceptor/Interceptor.types";
import { getFilePath } from "cypress-interceptor/src/utils.cypress";
import { HOST } from "cypress-interceptor-server/src/resources/constants";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { testCaseIt } from "../src/utils";

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
                ignoreCrossDomain: false
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

        cy.writeInterceptorStatsToLog(`${outputDir}/`).then(() => {
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

        cy.writeInterceptorStatsToLog(outputDir, { fileName }).then(() => {
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

            cy.writeInterceptorStatsToLog(outputDir, {
                fileName,
                prettyOutput: true
            });

            cy.readFile(createOutputFileName(outputDir, fileName)).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(2);
            });

            cy.writeInterceptorStatsToLog(outputDir, {
                fileName,
                prettyOutput: true,
                routeMatcher: { resourceType }
            });

            cy.readFile(createOutputFileName(outputDir, fileName)).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(2);
                expect(stats.every((entry) => entry.resourceType === resourceType)).to.be.true;
                Object.entries(testPath_Fetch1_Headers).every(([key, value]) => {
                    expect(stats[0].request.headers[key]).to.eq(value);
                });
                Object.entries(testPath_Fetch2_Headers).every(([key, value]) => {
                    expect(stats[1].request.headers[key]).to.eq(value);
                });
                expect(stats[0].request.body).to.eq(JSON.stringify(requestBody(testPath_Fetch1)));
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

            cy.writeInterceptorStatsToLog(outputDir, {
                fileName,
                routeMatcher: { method: "GET", resourceType: [resourceType] }
            });

            cy.readFile(createOutputFileName(outputDir, fileName)).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(1);
                expect(stats.every((entry) => entry.request.method === "GET")).to.be.true;
            });

            cy.writeInterceptorStatsToLog(outputDir, {
                fileName,
                filter: (callStack) => callStack.url.pathname.endsWith(testPath_Fetch1)
            });

            cy.readFile(createOutputFileName(outputDir, fileName)).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(1);
                expect(new URL(stats[0].url).pathname.endsWith(testPath_Fetch1)).to.be.true;
            });

            cy.writeInterceptorStatsToLog(outputDir, {
                fileName,
                mapper: (callStack) => ({ isPending: callStack.isPending, url: callStack.url })
            });

            cy.readFile(createOutputFileName(outputDir, fileName)).then((stats: CallStack[]) => {
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

        cy.writeInterceptorStatsToLog(outputDir).then(() => {
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

    it("Catch error in mock 1 - fetch", () => {
        cy.mockInterceptorResponse("**", {
            headers: 123 as unknown as Record<string, string>,
            statusCode: "ea" as unknown as number
        });

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

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.requestError).not.to.be.undefined;
        });
    });

    it("Catch error in mock 2 - fetch", () => {
        cy.mockInterceptorResponse("**", {
            generateBody: () => {
                throw "Error";
            }
        });

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

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.requestError).not.to.be.undefined;
        });
    });

    describe("convertToString", () => {
        const testObject = { key: "value" };
        const xpectString = JSON.stringify(testObject);

        let win: Cypress.AUTWindow;

        before(() => {
            cy.window().then((window) => {
                win = window;
            });
        });

        it("should convert Document to string", async () => {
            const doc = new win.DOMParser().parseFromString(
                "<root><key>value</key></root>",
                "application/xml"
            );
            const result = await convertInputBodyToString(doc, win);

            expect(result).to.equal(xpectString);
        });

        it("should return string as is", async () => {
            const input = "test string";
            const result = await convertInputBodyToString(input, win);

            expect(result).to.equal(input);
        });

        it("should convert Blob to string", async () => {
            const blob = new win.Blob(["test blob"], { type: "text/plain" });
            const result = await convertInputBodyToString(blob, win);

            expect(result).to.equal("test blob");
        });

        it("should convert FormData to JSON string", async () => {
            const formData = new win.FormData();

            formData.append("key", "value");

            const result = await convertInputBodyToString(formData, win);

            expect(result).to.equal(xpectString);
        });

        it("should convert URLSearchParams to JSON string", async () => {
            const params = new win.URLSearchParams(testObject);
            const result = await convertInputBodyToString(params, win);

            expect(result).to.equal(xpectString);
        });

        it("should convert ArrayBuffer to string", async () => {
            const buffer = new win.TextEncoder().encode("test buffer").buffer;
            const result = await convertInputBodyToString(buffer, win);

            expect(result).to.equal("test buffer");
        });

        it("should convert object to JSON string", async () => {
            const result = await convertInputBodyToString(testObject as unknown as BodyInit, win);

            expect(result).to.equal(xpectString);
        });

        it("should return empty string for null input", async () => {
            const result = await convertInputBodyToString(null, win);

            expect(result).to.equal("");
        });

        it("should return empty string for undefined input", async () => {
            const result = await convertInputBodyToString(undefined, win);

            expect(result).to.equal("");
        });

        it("should reject if FileReader throw an error", async () => {
            class MockFileReader {
                public error: Error = new Error("read error");
                public onerror: (() => void) | null = null;
                public onload: (() => void) | null = null;

                readAsText() {
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror();
                        }
                    }, 0);
                }
            }

            window.FileReader = MockFileReader as unknown as typeof window.FileReader;

            const blob = new window.Blob(["test"]);

            return convertInputBodyToString(blob, win).then(
                () => {
                    throw new Error("Promise should have been rejected");
                },
                (err) => {
                    expect(err).to.exist;
                    expect(err.message).to.eq("read error");
                }
            );
        });
    });

    it("Should return null when log is empty", () => {
        cy.writeInterceptorStatsToLog("_logs").then((result) => {
            expect(result).to.be.null;
        });
    });

    it("destroy and recreate interceptor - fetch", () => {
        cy.visit("/");

        cy.window().then((win) => {
            expect("originFetch" in win).to.eq(true);
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(0);
        });

        const testUrl1 = `http://${HOST}/test-1`;

        cy.window().then((win) => {
            return new Promise((resolve) => {
                win.fetch(testUrl1).then((res) => {
                    expect(res.status).to.eq(200);
                    resolve(null);
                });
            });
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl1);
        });

        // it will destroy the interceptor from the window but the latest interceptor is still available
        cy.destroyInterceptor();

        cy.window().then((win) => {
            expect("originFetch" in win).to.eq(false);
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl1);
        });

        const testUrl2 = `http://${HOST}/test-2`;

        cy.window().then((win) => {
            return new Promise((resolve) => {
                win.fetch(testUrl2).then((res) => {
                    expect(res.status).to.eq(200);
                    resolve(null);
                });
            });
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl1);
        });

        // the interceptor is recreated from scratch
        cy.recreateInterceptor();

        cy.window().then((win) => {
            expect("originFetch" in win).to.eq(true);
        });

        const testUrl3 = `http://${HOST}/test-3`;

        cy.window().then((win) => {
            return new Promise((resolve) => {
                win.fetch(testUrl3).then((res) => {
                    expect(res.status).to.eq(200);
                    resolve(null);
                });
            });
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl3);
        });
    });

    it("destroy and recreate interceptor - XMLHttpRequest", () => {
        cy.visit("/");

        cy.window().then((win) => {
            expect("originXMLHttpRequest" in win).to.eq(true);
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(0);
        });

        const testUrl1 = `http://${HOST}/test-1`;

        cy.window().then((win) => {
            return new Promise((resolve) => {
                const xhr = new win.XMLHttpRequest();

                xhr.open("GET", testUrl1);
                xhr.onload = () => {
                    expect(xhr.status).to.eq(200);
                    resolve(null);
                };
                xhr.send();
            });
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl1);
        });

        // it will destroy the interceptor from the window but the latest interceptor is still available
        cy.destroyInterceptor();

        cy.window().then((win) => {
            expect("originXMLHttpRequest" in win).to.eq(false);
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl1);
        });

        const testUrl2 = `http://${HOST}/test-2`;

        cy.window().then((win) => {
            return new Promise((resolve) => {
                const xhr = new win.XMLHttpRequest();

                xhr.open("GET", testUrl2);
                xhr.onload = () => {
                    expect(xhr.status).to.eq(200);
                    resolve(null);
                };
                xhr.send();
            });
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl1);
        });

        // the interceptor is recreated from scratch
        cy.recreateInterceptor();

        cy.window().then((win) => {
            expect("originXMLHttpRequest" in win).to.eq(true);
        });

        const testUrl3 = `http://${HOST}/test-3`;

        cy.window().then((win) => {
            return new Promise((resolve) => {
                const xhr = new win.XMLHttpRequest();

                xhr.open("GET", testUrl3);
                xhr.onload = () => {
                    expect(xhr.status).to.eq(200);
                    resolve(null);
                };
                xhr.send();
            });
        });

        cy.interceptor().then((interceptor) => {
            expect(interceptor.callStack.length).to.eq(1);
            expect(interceptor.callStack[0].url.toString()).to.eq(testUrl3);
        });
    });
});
