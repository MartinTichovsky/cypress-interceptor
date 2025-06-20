import { CallStack } from "../Interceptor.types";
import { writeFileSync } from "./envUtils";
import { getHtmlTemplate } from "./generateReport.template";

type CallStackWithDuration = CallStack & {
    duration: number;
};

interface GenerateReportOptions {
    highDuration?: number;
    filter?: (dataPoint: CallStack) => boolean;
    title?: string;
}

/**
 * Formats a Date object to "hours:minutes:seconds milliseconds" format
 */
const formatDateTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

    return `${hours}:${minutes}:${seconds}s ${milliseconds}ms`;
};

/**
 * Generates an HTML report with a column chart showing duration over time
 *
 * @param statsFilePath Path to the stats file. The file must be sorted by timeStart
 * and the function must be called from node (not from cypress)
 * @param outputFileName Path where the HTML file will be created
 * @param options Options
 */
export async function generateReport(
    statsFilePath: string,
    outputFileName: string,
    options?: GenerateReportOptions
): Promise<void>;
/**
 * Generates an HTML report with a column chart showing duration over time
 *
 * @param data The call stack data
 * @param outputFileName Path where the HTML file will be created
 * @param options Options
 */
export async function generateReport(
    data: CallStack[],
    filePath: string,
    options?: GenerateReportOptions
): Promise<void>;
export async function generateReport(
    dataOrFilePath: CallStack[] | string,
    filePath: string,
    options: GenerateReportOptions = {}
): Promise<void> {
    try {
        const { highDuration = 3000, filter } = options;

        let data = typeof dataOrFilePath === "string" ? loadStats(dataOrFilePath) : dataOrFilePath;

        if (filter) {
            data = data.filter(filter);
        }

        // filter out the ones with no duration
        const dataWithDuration: CallStackWithDuration[] = data.filter(
            (item): item is CallStackWithDuration => item.duration !== undefined
        );

        // Prepare data for the chart
        const labels = dataWithDuration.map((item) => formatDateTime(item.timeStart));
        const durations = dataWithDuration.map((item) => item.duration);

        // Calculate statistics
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
        const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
        const avgDuration =
            durations.length > 0
                ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
                : 0;

        // Generate HTML using the template function
        const html = getHtmlTemplate({
            avgDuration: avgDuration.toFixed(2),
            dataCount: dataWithDuration.length,
            durations: JSON.stringify(durations),
            generationDate: new Date().toLocaleString(),
            highDuration: highDuration.toString(),
            labels: JSON.stringify(labels),
            maxDuration: maxDuration.toFixed(2),
            minDuration: minDuration.toFixed(2),
            tableData: JSON.stringify(
                dataWithDuration.map((item) => ({
                    duration: item.duration,
                    time: formatDateTime(item.timeStart),
                    url: item.url,
                    method: item.request?.method || "GET",
                    query: item.request?.query || {},
                    headers: item.request?.headers || {},
                    body: item.request?.body || "",
                    responseBody: item.response?.body || "",
                    responseHeaders: item.response?.headers || {},
                    statusCode: item.response?.statusCode || 0
                }))
            ),
            title: options?.title,
            totalRequests: dataWithDuration.length
        });

        // Write the HTML file
        writeFileSync(filePath, html);

        console.log(`✅ Report generated successfully at: ${filePath}`);
    } catch (error) {
        console.error("❌ Error generating report:", error);
        throw error;
    }
}

const loadStats = (filePath: string): CallStack[] => {
    let data: CallStack[] = [];

    try {
        const requireFn = eval("require");
        const fs = requireFn("fs");

        const fileContent = fs.readFileSync(filePath, "utf8");
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error("❌ Error loading stats:", error);
        throw error;
    }

    if (!Array.isArray(data)) {
        throw new Error("Invalid stats file format: expected array");
    }

    if (
        !data.every(
            (entry) =>
                "timeStart" in entry &&
                "url" in entry &&
                typeof entry.timeStart === "string" &&
                !isNaN(Date.parse(entry.timeStart)) &&
                typeof entry.url === "string"
        )
    ) {
        throw new Error(
            "Invalid stats file format: expected array of objects with time, duration, and url properties"
        );
    }

    return data.map((item) => ({
        ...item,
        timeStart: new Date(item.timeStart)
    }));
};
