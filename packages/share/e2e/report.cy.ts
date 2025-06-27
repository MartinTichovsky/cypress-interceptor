import { createNetworkReport } from "cypress-interceptor/report";
import { generateReport } from "cypress-interceptor/src/generateReport";
import { ReportTestId } from "cypress-interceptor/src/generateReport.template";
import { getFilePath } from "cypress-interceptor/src/utils.cypress";
import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { mockNodeEnvironment, mockRequire } from "../src/mock";
import { byDataTestId } from "../src/selectors";
import { validateReportTemplate } from "../src/validateReportTemplate";

const networkReportOutputDir = "_network_report";
const statsOutputDir = "_stats";

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

describe("Report", () => {
    describe("With default settings", () => {
        before(() => {
            cy.task("clearLogs", [networkReportOutputDir]);
        });

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
        before(() => {
            cy.task("clearLogs", [networkReportOutputDir]);
        });

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
        before(() => {
            cy.task("clearLogs", [networkReportOutputDir, statsOutputDir]);
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
                console.log(outputFilePath);
                cy.visit(`/fixtures/${outputFilePath.replaceAll("\\", "/").split("/").pop()}`);

                cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD))
                    .invoke("text")
                    .then((text) => {
                        expect(parseInt(text)).to.eq(3);
                    });
            });
        });
    });

    describe("generateReport", () => {
        beforeEach(() => {
            cy.task("clearLogs", [networkReportOutputDir]);
        });

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

        it("Should throw an error", () => {
            mockNodeEnvironment();

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
            mockNodeEnvironment();

            const { mockFs } = mockRequire({
                existsSync: false,
                readFileSync: JSON.stringify([])
            });

            generateReport("file.json", "report.html");

            expect(mockFs.mkdirSync).to.have.been.calledOnce;
        });
    });
});
