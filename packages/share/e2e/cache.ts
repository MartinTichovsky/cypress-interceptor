import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

describe("Cache", () => {
    // these addresses must not be used anywhere else because they will be cached after this test
    const testPath_Image1 = "cache/image-1.gif";
    const testPath_Image2 = "cache/image-2.gif";
    const testPath_Script1 = "cache/script-1.js";
    const testPath_Script2 = "cache/script-2.js";
    const testPath_Stylesheet1 = "cache/styles-1.css";
    const testPath_Stylesheet2 = "cache/styles-2.css";

    it("Enabled", () => {
        cy.setInterceptorOptions({
            disableCache: false,
            resourceTypes: "all"
        });

        const config: DynamicRequest[] = [
            {
                delay: 100,
                enableCache: true,
                path: testPath_Script1,
                type: "script"
            },
            {
                delay: 200,
                enableCache: true,
                path: testPath_Script2,
                type: "script"
            },
            {
                delay: 100,
                enableCache: true,
                path: testPath_Stylesheet1,
                type: "stylesheet"
            },
            {
                delay: 200,
                enableCache: true,
                path: testPath_Stylesheet2,
                type: "stylesheet"
            },
            {
                delay: 100,
                enableCache: true,
                path: testPath_Image1,
                type: "image"
            },
            {
                delay: 200,
                enableCache: true,
                path: testPath_Image2,
                type: "image"
            }
        ];

        cy.visit(getDynamicUrl(config));

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => {
            expect(stats.length).to.eq(7);
        });

        cy.visit(getDynamicUrl(config));

        cy.waitUntilRequestIsDone();

        // only one request will be added (the HTML document) after the second visit,
        // others are cached and the cached requests do not hit cy.intercept
        cy.interceptorStats().then((stats) => {
            expect(stats.length).to.eq(8);
        });
    });
});
