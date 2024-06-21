import * as webpackPreprocessor from "@cypress/webpack-preprocessor";
import { createWebpackConfig } from "cypress-interceptor-share/webpack.config";

export const createConfig = (codeCoverage = false): Cypress.ConfigOptions => ({
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    e2e: {
        baseUrl: "http://localhost:3000/",
        env: {
            INTERCEPTOR_DEBUG: true,
            INTERCEPTOR_DISABLE_CACHE: true,
            INTERCEPTOR_REQUEST_TIMEOUT: 20000
        },
        experimentalRunAllSpecs: true,
        setupNodeEvents(on, config) {
            if (codeCoverage) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                require("@cypress/code-coverage/task")(on, config);
            }

            on(
                "file:preprocessor",
                webpackPreprocessor({
                    watchOptions: {},
                    webpackOptions: createWebpackConfig(codeCoverage)
                })
            );

            on("task", {
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
    video: false,
});
