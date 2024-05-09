import { CallStack, IDebug } from "cypress-interceptor/src/interceptor";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

describe("Custom", () => {
    it("Interceptor options", () => {
        cy.interceptorOptions().then((options) => {
            expect(options).to.deep.eq({
                disableCache: undefined,
                debug: false,
                ingoreCrossDomain: true,
                resourceTypes: ["document", "fetch", "script", "xhr"]
            });
        });
    });

    it("Debug with file - name auto generated", () => {
        const testPath_Fetch1 = "dev/fetch-1";
        const outDir = "_logs";

        cy.interceptorOptions({ debug: true });

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then(function (intereptor) {
            intereptor.writeDebugToLog(outDir);

            cy.readFile(
                `${outDir}/index.cy.ts (Custom - Debug with file - name auto generated).debug.json`
            ).then((debugInfo: IDebug[]) => {
                expect(debugInfo.length > 0).to.be.true;
                expect(debugInfo.find((entry) => entry.url.includes(testPath_Fetch1)));
            });
        });
    });

    it("Debug with file - strict name", () => {
        const testPath_Fetch1 = "dev/fetch-1";
        const fileName = "FILE_NAME_DEBUG";
        const outDir = "_logs";

        cy.interceptorOptions({ debug: true });

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then(function (intereptor) {
            intereptor.writeDebugToLog(outDir, fileName);

            cy.readFile(`${outDir}/${fileName}.debug.json`).then((debugInfo: IDebug[]) => {
                expect(debugInfo.length > 0).to.be.true;
                expect(debugInfo.find((entry) => entry.url.includes(testPath_Fetch1)));
            });
        });
    });

    it("Stats with file - name auto generated", () => {
        const testPath_Fetch1 = "stats/fetch-1";
        const outDir = "_stats";

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then(function (intereptor) {
            intereptor.writeStatsToLog(outDir);

            cy.readFile(
                `${outDir}/index.cy.ts (Custom - Stats with file - name auto generated).stats.json`
            ).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(stats.find((entry) => entry.url.endsWith(testPath_Fetch1)));
            });
        });
    });

    it("Stats with file - strict name", () => {
        const testPath_Fetch1 = "stats/fetch-1";
        const fileName = "FILE_NAME_STATS";
        const outDir = "_logs";

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then(function (intereptor) {
            intereptor.writeStatsToLog(outDir, fileName);

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(stats.find((entry) => entry.url.endsWith(testPath_Fetch1)));
            });
        });
    });
});
