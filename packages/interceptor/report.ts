import { getFs, getPath } from "./src/envUtils";
import { generateReport } from "./src/generateReport";
import { getFileNameFromCurrentTest, getFilePath } from "./src/utils.cypress";

interface ReportHtmlOptions {
    fileName?: string;
    outputDir: string;
}

export const createNetworkReport = (options: ReportHtmlOptions) => {
    const { fileName, outputDir } = options;

    cy.interceptor().then((interceptor) => {
        const outputFile = getFilePath(fileName, outputDir, undefined, "html");
        const stats = interceptor.getStats();

        generateReport(stats, outputFile, {
            title: getFileNameFromCurrentTest()
        });
    });
};

export const createNetworkReportFromFile = (
    filePath: string,
    outputDir: string,
    fileName?: string
) => {
    const path = getPath();

    generateReport(
        filePath,
        path.join(
            outputDir,
            `${fileName || path.basename(filePath).replace(".stats.json", "")}.html`
        )
    );
};

export const createNetworkReportFromFolder = (folderPath: string, outputDir: string) => {
    const fs = getFs();
    const path = getPath();

    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
        try {
            createNetworkReportFromFile(
                path.join(folderPath, file),
                outputDir,
                file.replace(".stats.json", "")
            );
        } catch {
            //
        }
    });
};
