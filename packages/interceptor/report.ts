import { getFs, getPath } from "./src/envUtils";
import { generateReport } from "./src/generateReport";
import { getFileNameFromCurrentTest, getFilePath } from "./src/utils.cypress";

interface ReportHtmlOptions {
    fileName?: string;
    highDuration?: number;
    outputDir: string;
}

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

export const createNetworkReportFromFile = (filePath: string, options: ReportHtmlOptions) => {
    const path = getPath();

    const { fileName, outputDir, highDuration } = options;

    generateReport(
        filePath,
        path.join(
            outputDir,
            `${fileName || path.basename(filePath).replace(".stats.json", "")}.html`
        ),
        {
            highDuration
        }
    );
};

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
