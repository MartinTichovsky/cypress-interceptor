import { CallStack, IDebug } from "cypress-interceptor/src/interceptor";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

describe("Custom", () => {
    it("Interceptor options", () => {
        cy.interceptorOptions().then((options) => {
            expect(options).to.deep.eq({
                disableCache: undefined,
                debug: undefined,
                doNotLogResponseBody: false,
                ingoreCrossDomain: true,
                resourceTypes: ["document", "fetch", "script", "xhr"]
            });
        });
    });

    it("Debug to file - name auto generated", () => {
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

        cy.interceptor().then((intereptor) => {
            intereptor.writeDebugToLog(outDir);

            cy.readFile(
                `${outDir}/index.cy.ts (Custom - Debug to file - name auto generated).debug.json`
            ).then((debugInfo: IDebug[]) => {
                expect(debugInfo.length > 0).to.be.true;
                expect(debugInfo.find((entry) => entry.url.includes(testPath_Fetch1))).not.to.be
                    .undefined;
            });
        });
    });

    it("Debug to file - strict name, filter, mapper", () => {
        const testPath_Fetch1 = "dev/fetch-1";
        const testPath_Fetch2 = "dev/fetch-2";
        const testPath_Script1 = "dev/script-1";
        const testPath_Script2 = "dev/script-2";
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
                },
                {
                    delay: 100,
                    method: "GET",
                    path: testPath_Fetch2,
                    type: "fetch"
                },
                {
                    delay: 100,
                    path: testPath_Script1,
                    type: "script"
                },
                {
                    delay: 100,
                    path: testPath_Script2,
                    type: "script"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((intereptor) => {
            intereptor.writeDebugToLog(outDir, { fileName });

            cy.readFile(`${outDir}/${fileName}.debug.json`).then((debugInfo: IDebug[]) => {
                expect(debugInfo.length > 0).to.be.true;
                expect(debugInfo.find((entry) => entry.url.includes(testPath_Fetch1))).not.to.be
                    .undefined;
            });

            intereptor.writeDebugToLog(outDir, {
                fileName,
                filter: (debugInfo) => debugInfo.url.includes(testPath_Fetch2)
            });

            cy.readFile(`${outDir}/${fileName}.debug.json`).then((debugInfo: IDebug[]) => {
                expect(debugInfo.length > 0).to.be.true;
                expect(debugInfo.every((entry) => entry.url === debugInfo[0].url)).to.be.true;
            });

            intereptor.writeDebugToLog(outDir, {
                fileName,
                mapper: (debugInfo) => ({ type: debugInfo.type, url: debugInfo.url })
            });

            cy.readFile(`${outDir}/${fileName}.debug.json`).then((debugInfo: IDebug[]) => {
                expect(debugInfo.length > 0).to.be.true;
                expect(
                    debugInfo.every(
                        (entry) =>
                            entry.type !== undefined &&
                            entry.url !== undefined &&
                            Object.keys(entry).length === 2
                    )
                ).to.be.true;
            });
        });
    });

    it("Stats to file - name auto generated", () => {
        const testPath_Fetch1 = "stats/fetch-1";
        const outDir = "_stats/";

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

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(outDir);

            cy.readFile(
                `${outDir}index.cy.ts (Custom - Stats to file - name auto generated).stats.json`
            ).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(stats.find((entry) => entry.url.endsWith(testPath_Fetch1))).not.to.be
                    .undefined;
            });
        });
    });

    it("Stats to file - strict name", () => {
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

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(outDir, { fileName });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length > 0).to.be.true;
                expect(stats.find((entry) => entry.url.endsWith(testPath_Fetch1))).not.to.be
                    .undefined;
            });
        });
    });

    it("Stats to file - matcher, filter, mapper", () => {
        const testPath_Fetch1 = "stats/fetch-1";
        const testPath_Fetch2 = "stats/fetch-2";
        const testPath_Script1 = "stats/script-1";
        const testPath_Script2 = "stats/script-2";
        const fileName = "FILE_NAME_FILTER";
        const outDir = "_logs";

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    method: "POST",
                    path: testPath_Fetch1,
                    type: "fetch"
                },
                {
                    delay: 100,
                    method: "GET",
                    path: testPath_Fetch2,
                    type: "fetch"
                },
                {
                    delay: 100,
                    path: testPath_Script1,
                    type: "script"
                },
                {
                    delay: 100,
                    path: testPath_Script2,
                    type: "script"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((intereptor) => {
            intereptor.writeStatsToLog(outDir, {
                fileName,
                prettyOutput: true
            });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(5);
            });

            intereptor.writeStatsToLog(outDir, {
                fileName,
                routeMatcher: { resourceType: "fetch" }
            });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(2);
                expect(stats.every((entry) => entry.resourceType === "fetch")).to.be.true;
            });

            intereptor.writeStatsToLog(outDir, {
                fileName,
                routeMatcher: { resourceType: "script" }
            });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(2);
                expect(stats.every((entry) => entry.resourceType === "script")).to.be.true;
            });

            intereptor.writeStatsToLog(outDir, {
                fileName,
                routeMatcher: { method: "GET", resourceType: ["fetch", "script"] }
            });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(3);
                expect(stats.every((entry) => entry.request.method === "GET")).to.be.true;
            });

            intereptor.writeStatsToLog(outDir, {
                fileName,
                filter: (callStack) => callStack.url.endsWith(testPath_Fetch1)
            });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].url.endsWith(testPath_Fetch1)).to.be.true;
            });

            intereptor.writeStatsToLog(outDir, {
                fileName,
                mapper: (callStack) => ({ isPending: callStack.isPending, url: callStack.url })
            });

            cy.readFile(`${outDir}/${fileName}.stats.json`).then((stats: CallStack[]) => {
                expect(stats.length).to.eq(5);
                expect(
                    stats.every(
                        (entry) =>
                            entry.isPending === false &&
                            entry.url !== undefined &&
                            Object.keys(entry).length === 2
                    )
                ).to.be.true;
            });
        });
    });

    it("stopTiming", () => {
        cy.stopTiming().should("be.undefined");
    });
});
