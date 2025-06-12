import { createNetworkReport } from "cypress-interceptor/report";
import { getFilePath } from "cypress-interceptor/src/utils.cypress";
import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { validateReportTemplate } from "../src/validateReportTemplate";

const outputDir = "_network_report";

// Universal configuration constant - adjust this to change the number of entries
const ENTRY_COUNT = 20;

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
        { userId: Math.floor(Math.random() * 1000), action: "create" },
        { name: `Test User ${index}`, email: `test${index}@example.com` },
        { data: `Sample data ${index}`, timestamp: Date.now() },
        { id: index, value: Math.random() * 100, active: Math.random() > 0.5 },
        { query: `search term ${index}`, filters: { category: "test", limit: 10 } }
    ];
    return bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
};

/**
 * Generates random request headers
 */
const getRandomHeaders = (): Record<string, string> => {
    const headerSets: Record<string, string>[] = [
        { "Content-Type": "application/json", Authorization: "Bearer token123" },
        { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": "api-key-456" },
        { "Content-Type": "application/json", "X-User-ID": "user789", Accept: "application/json" },
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
        { success: true, data: { id: index, message: "Operation completed" } },
        {
            error: false,
            result: `Result for request ${index}`,
            count: Math.floor(Math.random() * 50)
        },
        {
            status: "ok",
            items: Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Item ${i}` }))
        },
        { message: "Success", payload: { userId: index, balance: Math.random() * 1000 } },
        { data: null, error: "Not found", code: 404 }
    ];
    return responseBodies[Math.floor(Math.random() * responseBodies.length)];
};

/**
 * Generates network request entries with calculated delays and random durations
 *
 * @param count - Number of entries to generate
 * @returns Array of network request configurations
 */
const generateNetworkEntries = (count: number) => {
    const entries: DynamicRequest[] = [];

    // Randomly select 2 positions for the special 3200ms duration entries
    const specialDurationIndices = new Set<number>();
    while (specialDurationIndices.size < 2) {
        specialDurationIndices.add(Math.floor(Math.random() * count));
    }

    for (let i = 0; i < count; i++) {
        // Set duration: either 3200ms for special entries or random between 100-1500ms
        const duration = specialDurationIndices.has(i)
            ? 3200
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
            method,
            path: `/api/test${i + 1}`,
            type: "fetch",
            duration,
            ...(includeStatus && { status: getRandomStatus() }),
            ...(includeBody && { body: getRandomBody(i + 1) }),
            ...(includeHeaders && { headers: getRandomHeaders() }),
            ...(includeResponseBody && { responseBody: getRandomResponseBody(i + 1) })
        };

        entries.push(entry);
    }

    return entries;
};

describe("Report", () => {
    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    let fileName = "";
    const testName = "Should create a report after the test";

    after(() => {
        createNetworkReport({
            outputDir
        });

        cy.task("copyToFixtures", fileName).then((htmlName) => {
            cy.visit(`/fixtures/${htmlName}`);

            validateReportTemplate();

            cy.get("body").contains(testName).should("be.visible");
        });
    });

    it(testName, () => {
        // Generate network entries using the universal logic
        const networkEntries = generateNetworkEntries(ENTRY_COUNT);

        cy.visit(getDynamicUrl(networkEntries));

        cy.waitUntilRequestIsDone({
            timeout: 60000
        });

        fileName = getFilePath(undefined, outputDir, undefined, "html");
    });
});
