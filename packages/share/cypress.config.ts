import registerCodeCoverageTasks from "@cypress/code-coverage/task";
import webpackPreprocessor from "@cypress/webpack-preprocessor";
import {
    createNetworkReportFromFile,
    createNetworkReportFromFolder,
    ReportHtmlOptions
} from "cypress-interceptor/report";
import { createWebpackConfig } from "cypress-interceptor-share/webpack.config";
import * as fs from "fs";
import path from "path";

const fixturesFolder = path.resolve(__dirname, "../server/fixtures");
const mockFolderPath = path.resolve(__dirname, "../share/mock");

export const createConfig = (codeCoverage = false): Cypress.ConfigOptions => ({
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    e2e: {
        baseUrl: "http://localhost:3000/",
        env: {
            INTERCEPTOR_REQUEST_TIMEOUT: 20000
        },
        experimentalRunAllSpecs: true,
        setupNodeEvents(on, config) {
            if (codeCoverage) {
                registerCodeCoverageTasks(on, config);
            }

            on(
                "file:preprocessor",
                webpackPreprocessor({
                    watchOptions: {},
                    webpackOptions: createWebpackConfig(codeCoverage)
                })
            );

            on("task", {
                clearFixtures() {
                    if (fs.existsSync(fixturesFolder)) {
                        fs.rmdirSync(fixturesFolder, { recursive: true });
                    }

                    return null;
                },
                clearLogs(logDirs: string[]) {
                    logDirs.forEach((dir) => {
                        if (fs.existsSync(dir)) {
                            fs.rmdirSync(dir, { recursive: true });
                        }
                    });

                    return null;
                },
                copyToFixtures(filePath: string) {
                    filePath = path.resolve(filePath);
                    const fileName = path.basename(filePath);

                    if (!fs.existsSync(fixturesFolder)) {
                        fs.mkdirSync(fixturesFolder, { recursive: true });
                    }

                    fs.copyFileSync(filePath, `${fixturesFolder}/${fileName}`);

                    return fileName;
                },
                createReportFromFile(fileName?: string, highDuration?: number) {
                    return createNetworkReportFromFile(`${mockFolderPath}/sources.stats.json`, {
                        fileName,
                        outputDir: fixturesFolder,
                        highDuration
                    });
                },
                createNetworkReportFromFile({
                    filePath,
                    ...options
                }: {
                    filePath: string;
                } & ReportHtmlOptions) {
                    return createNetworkReportFromFile(filePath, options);
                },
                createReportFromFolder() {
                    createNetworkReportFromFolder(mockFolderPath, {
                        outputDir: fixturesFolder
                    });

                    return fs.readdirSync(fixturesFolder);
                },
                doesFileExist(filePath) {
                    return fs.existsSync(filePath);
                },
                log(message) {
                    console.log(message);
                    return null;
                }
            });

            return config;
        },
        specPattern: ["cypress/e2e/**/*.cy.ts"]
    },
    experimentalInteractiveRunEvents: true,
    experimentalMemoryManagement: true,
    fixturesFolder: false,
    screenshotOnRunFailure: false,
    video: false
});
