import { CallStack } from "cypress-interceptor/Interceptor.types";
import { createNetworkReport } from "cypress-interceptor/report";
import { generateReport } from "cypress-interceptor/src/generateReport";
import {
    ReportClassName,
    ReportTestId,
    ReportTestIdPrefix
} from "cypress-interceptor/src/generateReport.template";
import { getFilePath } from "cypress-interceptor/src/utils.cypress";
import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { mockNodeEnvironment, mockRequire, removeNodeEnvironment } from "../../src/mock";
import { checkBarColor } from "../../src/report";
import { byDataTestId } from "../../src/selectors";
import { validateReportTemplate } from "../../src/validateReportTemplate";

const networkReportOutputDir = "_network_report";
const statsOutputDir = "_stats";

const expectBodyToBeFormatted = (id: string, type: "request" | "response") => {
    // 1. Expand the row
    cy.get(byDataTestId(ReportTestIdPrefix.EXPAND_BTN, id)).first().click();

    // 2. Get the request body content
    cy.get(
        byDataTestId(
            type === "request"
                ? ReportTestIdPrefix.REQUEST_BODY_CONTENT
                : ReportTestIdPrefix.RESPONSE_BODY_CONTENT,
            id
        )
    )
        .first()
        .invoke("text")
        .then((bodyText) => {
            // 3. Check for newlines (pretty-printing)
            expect(bodyText, `${type} body should be formatted`).to.include("\n");

            // 4. Check for indentation (lines starting with spaces)
            const lines = bodyText.split("\n");
            const hasIndentedLine = lines.some((line) => /^ {2,}/.test(line));

            expect(hasIndentedLine, `${type} body should have indented lines`).to.be.true;
        });
};

/**
 * Generates random HTTP status codes
 */
const getRandomStatus = (): number => {
    const statusCodes = [200, 201, 400, 401, 403, 404, 500, 502, 503];

    return statusCodes[Math.floor(Math.random() * statusCodes.length)];
};

/**
 * Generates random request body data
 */
const getRandomBody = (index: number): Record<string, unknown> => {
    const bodyTypes = [
        { action: "create", userId: Math.floor(Math.random() * 1000) },
        { email: `test${index}@example.com`, name: `Test User ${index}` },
        { data: `Sample data ${index}`, timestamp: Date.now() },
        { active: Math.random() > 0.5, id: index, value: Math.random() * 100 },
        { filters: { category: "test", limit: 10 }, query: `search term ${index}` }
    ];

    return bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
};

/**
 * Generates random request headers
 */
const getRandomHeaders = (): Record<string, string> => {
    const headerSets: Record<string, string>[] = [
        { Authorization: "Bearer token123", "Content-Type": "application/json" },
        { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": "api-key-456" },
        { Accept: "application/json", "Content-Type": "application/json", "X-User-ID": "user789" },
        { Authorization: "Basic dGVzdDp0ZXN0", "User-Agent": "TestClient/1.0" },
        { "Content-Type": "multipart/form-data", "X-Request-ID": `req-${Date.now()}` }
    ];

    return headerSets[Math.floor(Math.random() * headerSets.length)];
};

/**
 * Generates random response body data
 */
const getRandomResponseBody = (index: number): Record<string, unknown> => {
    const responseBodies = [
        { data: { id: index, message: "Operation completed" }, success: true },
        {
            count: Math.floor(Math.random() * 50),
            error: false,
            result: `Result for request ${index}`
        },
        {
            items: Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Item ${i}` })),
            status: "ok"
        },
        { message: "Success", payload: { balance: Math.random() * 1000, userId: index } },
        { code: 404, data: null, error: "Not found" }
    ];

    return responseBodies[Math.floor(Math.random() * responseBodies.length)];
};

/**
 * Generates network request entries with calculated delays and random durations
 *
 * @param count - Number of entries to generate
 * @returns Array of network request configurations
 */
const generateNetworkEntries = (count: number, highDuration: number = 3000) => {
    const entries: DynamicRequest[] = [];

    // Randomly select 2 positions for the special entries
    const specialDurationIndices = new Set<number>();

    while (specialDurationIndices.size < 2) {
        specialDurationIndices.add(Math.floor(Math.random() * count));
    }

    for (let i = 0; i < count; i++) {
        const duration = specialDurationIndices.has(i)
            ? highDuration
            : Math.floor(Math.random() * (1500 - 100 + 1)) + 100;

        // Calculate delay based on previous item's duration + delay
        let delay = 100;

        if (i > 0) {
            const previousItem = entries[i - 1];

            delay =
                (previousItem.delay ?? 0) +
                ((previousItem && "duration" in previousItem ? previousItem.duration : 0) ?? 0);
        }

        // Random method selection
        const method = Math.random() > 0.5 ? "POST" : "GET";

        // Randomly decide which optional properties to include (0-100% chance for each)
        const includeStatus = Math.random() > 0.3; // 70% chance
        const includeBody = Math.random() > 0.4 && method === "POST"; // 60% chance, only for POST
        const includeHeaders = Math.random() > 0.2; // 80% chance
        const includeResponseBody = Math.random() > 0.25; // 75% chance

        const entry: DynamicRequest = {
            delay,
            duration,
            method,
            path: `/api/test${i + 1}`,
            type: "fetch",
            ...(includeBody && { body: getRandomBody(i + 1) }),
            ...(includeHeaders && { headers: getRandomHeaders() }),
            ...(includeResponseBody && { responseBody: getRandomResponseBody(i + 1) }),
            ...(includeStatus && { status: getRandomStatus() })
        };

        entries.push(entry);
    }

    return entries;
};

// Helper to generate a large random object
const generateLargeRandomObject = (minLength: number, depth = 0): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};
    let i = 0;
    const maxDepth = 2;

    while (JSON.stringify(obj).length < minLength) {
        const key = `key_${i}_${Math.random().toString(36).substring(2, 8)}`;
        const randomType = Math.random();
        let value: unknown;

        if (randomType < 0.5 || depth >= maxDepth) {
            // Flat value
            value =
                Math.random() > 0.5
                    ? Math.random()
                          .toString(36)
                          .repeat(Math.floor(Math.random() * 10) + 1)
                    : Math.floor(Math.random() * 1000000);
        } else if (randomType < 0.75) {
            // Nested object
            value = generateLargeRandomObject(Math.floor(minLength / 10), depth + 1);
        } else {
            // Array of random values or objects
            const arrLength = Math.floor(Math.random() * 3) + 2;

            value = Array.from({ length: arrLength }, () => {
                if (Math.random() > 0.5 && depth < maxDepth) {
                    return generateLargeRandomObject(Math.floor(minLength / 20), depth + 1);
                }

                return Math.random() > 0.5
                    ? Math.random()
                          .toString(36)
                          .repeat(Math.floor(Math.random() * 5) + 1)
                    : Math.floor(Math.random() * 1000000);
            });
        }

        obj[key] = value;
        i++;
    }

    return obj;
};

describe("Report", () => {
    beforeEach(() => {
        cy.task("clearLogs", [networkReportOutputDir]);
    });

    describe("With default settings", () => {
        let fileName = "";
        const testName = "Should create a report after the test";

        after(() => {
            createNetworkReport({
                outputDir: networkReportOutputDir
            });

            cy.task("copyToFixtures", fileName).then((htmlName) => {
                cy.visit(`/fixtures/${htmlName}`);

                validateReportTemplate();

                cy.get("body").contains(testName).should("be.visible");
            });
        });

        it(testName, () => {
            cy.visit(getDynamicUrl(generateNetworkEntries(20)));

            cy.waitUntilRequestIsDone({
                timeout: 60000
            });

            fileName = getFilePath(undefined, networkReportOutputDir, undefined, "html");
        });
    });

    describe("With custom settings", () => {
        let fileName = "";
        const testName = "Should create a report with custom settings";

        after(() => {
            createNetworkReport({
                highDuration: 5000,
                outputDir: networkReportOutputDir
            });

            cy.task("copyToFixtures", fileName).then((htmlName) => {
                cy.visit(`/fixtures/${htmlName}`);

                validateReportTemplate(false);

                cy.get("body").contains(testName).should("be.visible");
            });
        });

        it(testName, () => {
            cy.visit(getDynamicUrl(generateNetworkEntries(10, 1000)));

            cy.waitUntilRequestIsDone();

            fileName = getFilePath(undefined, networkReportOutputDir, undefined, "html");
        });
    });

    describe("createNetworkReportFromFile", () => {
        beforeEach(() => {
            cy.task("clearLogs", [statsOutputDir]);
        });

        it("Should create a report from a file", () => {
            const outputFileName = getFilePath(undefined, statsOutputDir, "stats");

            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        method: "POST",
                        path: "/api/test1",
                        requests: [
                            {
                                duration: 200,
                                method: "GET",
                                path: "/api/test3",
                                type: "fetch"
                            }
                        ],
                        type: "fetch"
                    },
                    {
                        delay: 150,
                        duration: 1000,
                        method: "POST",
                        path: "/api/test2",
                        type: "fetch"
                    }
                ])
            );

            cy.waitUntilRequestIsDone();

            cy.writeInterceptorStatsToLog(statsOutputDir);

            cy.task("doesFileExist", outputFileName).should("be.true");

            cy.task<string>("createNetworkReportFromFile", {
                filePath: outputFileName,
                outputDir: networkReportOutputDir
            }).then((outputFilePath) => {
                cy.task("doesFileExist", outputFilePath).should("be.true");

                cy.task("copyToFixtures", outputFilePath);

                cy.visit(`/fixtures/${outputFilePath.replaceAll("\\", "/").split("/").pop()}`);

                cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD))
                    .invoke("text")
                    .then((text) => {
                        expect(parseInt(text)).to.eq(3);
                    });
            });
        });
    });

    describe("generateReport - with node environment", () => {
        afterEach(() => {
            removeNodeEnvironment();
        });

        beforeEach(() => {
            mockNodeEnvironment();
        });

        it("Should throw an error", () => {
            mockRequire({
                readFileSync: JSON.stringify([
                    {
                        crossDomain: false,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: { duration: "1000", path: "/api/test2" }
                        },
                        resourceType: "fetch",
                        timeStart: new Date().toISOString(),
                        url: "http://localhost:3000/api/test1"
                    }
                ]),
                writeFileSync: () => {
                    throw new Error("test");
                }
            });

            expect(() => generateReport("file.json", "report.html")).to.throw("test");
        });

        it("Should create a directory if it doesn't exist", () => {
            const { mockFs } = mockRequire({
                existsSync: false,
                readFileSync: JSON.stringify([])
            });

            generateReport("file.json", "report.html");

            expect(mockFs.mkdirSync).to.have.been.calledOnce;
        });
    });

    describe("generateReport - without node environment", () => {
        it("Should filter the entries by url", () => {
            const apiTest1 = new URL("http://localhost:3000/api/test1");
            const apiTest2 = new URL("http://localhost:3000/api/test2");

            const outputFileName = "report.html";
            const outputFilePath = `${networkReportOutputDir}/${outputFileName}`;

            cy.task("doesFileExist", outputFilePath).should("be.false");

            generateReport(
                [
                    {
                        crossDomain: false,
                        duration: 1000,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: { duration: "1000", path: "/api/test2" }
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest1
                    },
                    {
                        crossDomain: false,
                        duration: 1000,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: { duration: "1000", path: "/api/test2" }
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest2
                    }
                ],
                outputFilePath,
                {
                    filter: (dataPoint) => dataPoint.url.pathname === apiTest1.pathname
                }
            );

            cy.task("doesFileExist", outputFilePath).should("be.true");
            cy.task("copyToFixtures", outputFilePath);

            cy.visit(`/fixtures/${outputFileName}`);

            cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD))
                .invoke("text")
                .then((text) => {
                    expect(parseInt(text)).to.eq(1);
                });
        });

        it("Should load report from file", () => {
            mockRequire({
                readFileSync: JSON.stringify([
                    {
                        crossDomain: false,
                        duration: 1000,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: { duration: "1000", path: "/api/test2" }
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date().toISOString()
                        },
                        timeStart: new Date().toISOString(),
                        url: "http://localhost:3000/api/test1"
                    }
                ])
            });

            const outputFileName = "report-from-file.html";
            const outputFilePath = `${networkReportOutputDir}/${outputFileName}`;

            cy.task("doesFileExist", outputFilePath).should("be.false");

            generateReport("file.json", outputFilePath);

            cy.task("doesFileExist", outputFilePath).should("be.true");
            cy.task("copyToFixtures", outputFilePath);

            cy.visit(`/fixtures/${outputFilePath.replaceAll("\\", "/").split("/").pop()}`);

            cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD))
                .invoke("text")
                .then((text) => {
                    expect(parseInt(text)).to.eq(1);
                });
        });

        it("Should filter out the entries with no duration", () => {
            mockRequire({
                readFileSync: JSON.stringify([
                    {
                        crossDomain: false,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: { duration: "1000", path: "/api/test2" }
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date().toISOString()
                        },
                        timeStart: new Date().toISOString(),
                        url: "http://localhost:3000/api/test1"
                    }
                ])
            });

            const outputFileName = "report-from-file-with-no-duration.html";
            const outputFilePath = `${networkReportOutputDir}/${outputFileName}`;

            cy.task("doesFileExist", outputFilePath).should("be.false");

            generateReport("file.json", outputFilePath);

            cy.task("doesFileExist", outputFilePath).should("be.true");
            cy.task("copyToFixtures", outputFilePath);

            cy.visit(`/fixtures/${outputFilePath.replaceAll("\\", "/").split("/").pop()}`);

            cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD))
                .invoke("text")
                .then((text) => {
                    expect(parseInt(text)).to.eq(0);
                });
        });

        it("Should not fail if the response is not defined", () => {
            mockRequire({
                readFileSync: JSON.stringify([
                    {
                        crossDomain: false,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: { duration: "1000", path: "/api/test2" }
                        },
                        resourceType: "fetch",
                        timeStart: new Date().toISOString(),
                        url: "http://localhost:3000/api/test1"
                    }
                ])
            });

            const outputFileName = "report-from-file-with-no-response.html";
            const outputFilePath = `${networkReportOutputDir}/${outputFileName}`;

            cy.task("doesFileExist", outputFilePath).should("be.false");

            generateReport("file.json", outputFilePath);

            cy.task("doesFileExist", outputFilePath).should("be.true");
            cy.task("copyToFixtures", outputFilePath);

            cy.visit(`/fixtures/${outputFilePath.replaceAll("\\", "/").split("/").pop()}`);

            cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD))
                .invoke("text")
                .then((text) => {
                    expect(parseInt(text)).to.eq(0);
                });
        });

        it("Should filter the entries by url and highlight the slow ones", () => {
            const apiTest1 = new URL("http://localhost:3000/api/test-1");
            const apiTest2 = new URL("http://localhost:3000/api/test-2");
            const apiTest3 = new URL("http://localhost:3000/api/test-3");

            const outputFileName = "report-with-highlight.html";
            const outputFilePath = `${networkReportOutputDir}/${outputFileName}`;

            cy.task("doesFileExist", outputFilePath).should("be.false");

            generateReport(
                [
                    {
                        crossDomain: false,
                        duration: 1500,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: {}
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest1
                    },
                    {
                        crossDomain: false,
                        duration: 1500,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: {}
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest2
                    },
                    {
                        crossDomain: false,
                        duration: 1500,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: {}
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest3
                    }
                ],
                outputFilePath,
                {
                    highDuration: (url) => {
                        if (url.pathname === apiTest1.pathname) {
                            return 1000;
                        }

                        if (url.pathname === apiTest3.pathname) {
                            return 2000;
                        }

                        return 0;
                    }
                }
            );

            cy.task("doesFileExist", outputFilePath).should("be.true");
            cy.task("copyToFixtures", outputFilePath);

            cy.visit(`/fixtures/${outputFileName}`);

            cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD))
                .invoke("text")
                .then((text) => {
                    expect(parseInt(text)).to.eq(3);
                });

            cy.get(byDataTestId(ReportTestId.LEGEND_SLOW)).should("contain.text", "Custom");

            // Check that the duration cell for apiTest1 (index 0) is highlighted as slow (red)
            cy.get(byDataTestId("duration-cell", "0")).should(
                "have.class",
                ReportClassName.DURATION_SLOW
            );
            cy.get(byDataTestId("duration-cell", "1")).should(
                "have.class",
                ReportClassName.DURATION_FAST
            );
            cy.get(byDataTestId("duration-cell", "2")).should(
                "have.class",
                ReportClassName.DURATION_FAST
            );

            checkBarColor(0, "red");
            checkBarColor(1, "green");
            checkBarColor(2, "green");
        });

        it("Should filter the bodies", () => {
            const apiTest1 = new URL("http://localhost:3000/api/test-a");
            const apiTest2 = new URL("http://localhost:3000/api/test-b");
            const apiTest3 = new URL("http://localhost:3000/api/test-c");

            const outputFileName1 = "report-with-limited-body-1.html";
            const outputFilePath1 = `${networkReportOutputDir}/${outputFileName1}`;

            const outputFileName2 = "report-with-limited-body-2.html";
            const outputFilePath2 = `${networkReportOutputDir}/${outputFileName2}`;

            const outputFileName3 = "report-with-limited-body-3.html";
            const outputFilePath3 = `${networkReportOutputDir}/${outputFileName3}`;

            const outputFileName4 = "report-with-limited-body-4.html";
            const outputFilePath4 = `${networkReportOutputDir}/${outputFileName4}`;

            const largeRequestBody1 = JSON.stringify(generateLargeRandomObject(1500));
            const largeResponseBody1 = JSON.stringify(generateLargeRandomObject(1500));
            const largeRequestBody2 = JSON.stringify(generateLargeRandomObject(1500));
            const largeResponseBody2 = JSON.stringify(generateLargeRandomObject(1500));
            const largeRequestBody3 = JSON.stringify(generateLargeRandomObject(1500));
            const largeResponseBody3 = JSON.stringify(generateLargeRandomObject(1500));

            const callStack: CallStack[] = [
                {
                    crossDomain: false,
                    duration: 1500,
                    isPending: false,
                    request: {
                        body: largeRequestBody1,
                        headers: { "content-type": "application/json" },
                        method: "POST",
                        query: {}
                    },
                    resourceType: "fetch",
                    response: {
                        body: largeResponseBody1,
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: new Date()
                    },
                    timeStart: new Date(),
                    url: apiTest1
                },
                {
                    crossDomain: false,
                    duration: 1500,
                    isPending: false,
                    request: {
                        body: largeRequestBody2,
                        headers: { "content-type": "application/json" },
                        method: "POST",
                        query: {}
                    },
                    resourceType: "fetch",
                    response: {
                        body: largeResponseBody2,
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: new Date()
                    },
                    timeStart: new Date(),
                    url: apiTest2
                },
                {
                    crossDomain: false,
                    duration: 1500,
                    isPending: false,
                    request: {
                        body: largeRequestBody3,
                        headers: { "content-type": "application/json" },
                        method: "POST",
                        query: {}
                    },
                    resourceType: "fetch",
                    response: {
                        body: largeResponseBody3,
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: new Date()
                    },
                    timeStart: new Date(),
                    url: apiTest3
                }
            ];

            context(
                "includeRequestBody: undefined, includeResponseBody: undefined, the text should be cut",
                () => {
                    cy.task("doesFileExist", outputFilePath1).should("be.false");

                    generateReport(callStack, outputFilePath1);

                    cy.task("doesFileExist", outputFilePath1).should("be.true");
                    cy.task("copyToFixtures", outputFilePath1);

                    cy.visit(`/fixtures/${outputFileName1}`);

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("0", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("1", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("2", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("0", "response");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("1", "response");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("2", "response");
                }
            );

            context(
                "includeRequestBody: false, includeResponseBody: false, the text should be cut",
                () => {
                    cy.task("doesFileExist", outputFilePath2).should("be.false");

                    generateReport(callStack, outputFilePath2);

                    cy.task("doesFileExist", outputFilePath2).should("be.true");
                    cy.task("copyToFixtures", outputFilePath2);

                    cy.visit(`/fixtures/${outputFileName2}`);

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("0", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("1", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("2", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("0", "response");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("1", "response");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    expectBodyToBeFormatted("2", "response");
                }
            );

            context(
                "includeRequestBody: true, includeResponseBody: true, the text should not be cut",
                () => {
                    cy.task("doesFileExist", outputFilePath3).should("be.false");

                    generateReport(callStack, outputFilePath3, {
                        includeRequestBody: true,
                        includeResponseBody: true
                    });

                    cy.task("doesFileExist", outputFilePath3).should("be.true");
                    cy.task("copyToFixtures", outputFilePath3);

                    cy.visit(`/fixtures/${outputFileName3}`);

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeRequestBody1);
                        });

                    expectBodyToBeFormatted("0", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeRequestBody2);
                        });

                    expectBodyToBeFormatted("1", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeRequestBody3);
                        });

                    expectBodyToBeFormatted("2", "request");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeResponseBody1);
                        });

                    expectBodyToBeFormatted("0", "response");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeResponseBody2);
                        });

                    expectBodyToBeFormatted("1", "response");

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeResponseBody3);
                        });

                    expectBodyToBeFormatted("2", "response");
                }
            );

            context(
                "includeRequestBody: undefined, includeResponseBody: undefined, the text should be cut only for some requests",
                () => {
                    cy.task("doesFileExist", outputFilePath4).should("be.false");

                    generateReport(callStack, outputFilePath4, {
                        includeRequestBody: (url) => url.pathname === apiTest1.pathname,
                        includeResponseBody: (url) => url.pathname === apiTest3.pathname
                    });

                    cy.task("doesFileExist", outputFilePath4).should("be.true");
                    cy.task("copyToFixtures", outputFilePath4);

                    cy.visit(`/fixtures/${outputFileName4}`);

                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeRequestBody1);
                        });
                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });
                    cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });

                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "0"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });
                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "1"))
                        .invoke("text")
                        .then((text) => {
                            expect(text.endsWith("...")).to.be.true;
                        });
                    cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, "2"))
                        .invoke("text")
                        .then((text) => {
                            const body = JSON.parse(text);

                            expect(JSON.stringify(body)).to.eq(largeResponseBody3);
                        });
                }
            );
        });
    });

    describe("cy.writeFile timeout", () => {
        let originalWriteFile: typeof cy.writeFile;
        const timeout = 20000;
        let timeOutReceived: number;

        after(() => {
            // Restore cy.writeFile after the test
            cy.writeFile = originalWriteFile;
        });

        before(() => {
            originalWriteFile = cy.writeFile;

            cy.writeFile = (...args) => {
                const options = args[2] as Cypress.Timeoutable;

                timeOutReceived = options.timeout;

                return originalWriteFile(...(args as Parameters<typeof cy.writeFile>));
            };
        });

        it("Setting the timeout should work", () => {
            const apiTest1 = new URL("http://localhost:3000/api/test-z1");
            const apiTest2 = new URL("http://localhost:3000/api/test-z2");
            const apiTest3 = new URL("http://localhost:3000/api/test-z3");

            const outputFileName = "report-with-timeout.html";
            const outputFilePath = `${networkReportOutputDir}/${outputFileName}`;

            cy.task("doesFileExist", outputFilePath).should("be.false");

            generateReport(
                [
                    {
                        crossDomain: false,
                        duration: 1500,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: {}
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest1
                    },
                    {
                        crossDomain: false,
                        duration: 1500,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: {}
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest2
                    },
                    {
                        crossDomain: false,
                        duration: 1500,
                        isPending: false,
                        request: {
                            body: "",
                            headers: { "content-type": "application/json" },
                            method: "POST",
                            query: {}
                        },
                        resourceType: "fetch",
                        response: {
                            body: "{}",
                            headers: {},
                            isMock: false,
                            statusCode: 200,
                            statusText: "OK",
                            timeEnd: new Date()
                        },
                        timeStart: new Date(),
                        url: apiTest3
                    }
                ],
                outputFilePath,
                {
                    writeOptions: {
                        timeout
                    }
                }
            );

            expect(timeOutReceived).to.eq(timeout);

            cy.task("doesFileExist", outputFilePath).should("be.true");
            cy.task("copyToFixtures", outputFilePath);
        });
    });
});
