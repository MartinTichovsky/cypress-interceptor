import { getFs, getPath } from "./src/envUtils";
import { generateReport } from "./src/generateReport";
import { getFileNameFromCurrentTest, getFilePath } from "./src/utils.cypress";

export interface ReportHtmlOptions {
    /**
     * The name of the file to save the report to.
     * If not provided, the report will be saved to the current test name.
     */
    fileName?: string;

    /**
     * The duration of the request to be considered as high and highlighted in the report.
     * If a function is provided, it will be called with the URL of each request.
     */
    highDuration?: number | ((url: URL) => number);

    /**
     * The directory to save the report to.
     */
    outputDir: string;
}

/**
 * Creates a network report HTML file from the current test and its network requests.
 *
 * @param options The options for the report.
 */
export const createNetworkReport = (options: ReportHtmlOptions) => {
    const { fileName, highDuration, outputDir } = options;

    cy.interceptor().then((interceptor) => {
        const outputFile = getFilePath(fileName, outputDir, undefined, "html");
        const stats = interceptor.getStats();

        generateReport(stats, outputFile, {
            title: getFileNameFromCurrentTest(),
            highDuration
        });
    });
};

/**
 * Creates a network report HTML file from a stats file.
 *
 * @param filePath The path to the stats file.
 * @param options The options for the report.
 */
export const createNetworkReportFromFile = (filePath: string, options: ReportHtmlOptions) => {
    const path = getPath();

    const { fileName, outputDir, highDuration } = options;
    const outputFileName = `${fileName || path.basename(filePath).replace(".stats.json", "")}.html`;
    const outputFilePath = path.join(outputDir, outputFileName);

    generateReport(filePath, outputFilePath, {
        highDuration
    });

    return outputFilePath;
};

/**
 * Creates a network report HTML file from a folder of stats files.
 *
 * @param folderPath The path to the folder of stats files.
 * @param options The options for the report.
 */
export const createNetworkReportFromFolder = (
    folderPath: string,
    options: Exclude<ReportHtmlOptions, "fileName">
) => {
    const fs = getFs();
    const path = getPath();

    const { outputDir, highDuration } = options;

    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
        try {
            createNetworkReportFromFile(path.join(folderPath, file), {
                fileName: file.replace(".stats.json", ""),
                outputDir,
                highDuration
            });
        } catch {
            //
        }
    });
};
