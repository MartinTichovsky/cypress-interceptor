import * as webpackPreprocessor from "@cypress/webpack-preprocessor";

export const config: Cypress.ConfigOptions = {
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    e2e: {
        baseUrl: "http://localhost:3000/",
        env: {
            INTERCEPTOR_DEBUG: true,
            INTERCEPTOR_DISABLE_CACHE: true,
            INTERCEPTOR_REQUEST_TIMEOUT: 10000 // 200000
        },
        experimentalRunAllSpecs: true,
        setupNodeEvents(on) {
            on(
                "file:preprocessor",
                webpackPreprocessor({
                    watchOptions: {},
                    webpackOptions: require("cypress-interceptor-share/webpack.config")
                })
            );

            on("task", {
                log(message) {
                    console.log(message);
                    return null;
                }
            });
        },
        specPattern: ["cypress/e2e/**/*.cy.ts"]
    },
    experimentalInteractiveRunEvents: true,
    fixturesFolder: false,
    video: false
};
