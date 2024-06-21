import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { crossDomainScript } from "../src/constants";

describe("Resource Types", () => {
    const apiPath_Fetch1 = "api/fetch-1";
    const testPath_Fetch1 = "test/fetch-1";
    const testPath_Fetch2 = "test/fetch-2";
    const testPath_Image1 = "test/image-1.gif";
    const testPath_Image2 = "test/image-2.gif";
    const testPath_Script1 = "test/script-1.js";
    const testPath_Script2 = "test/script-2.js";
    const testPath_Stylesheet1 = "test/styles-1.css";
    const testPath_Stylesheet2 = "test/styles-2.css";

    const duration = 2000;
    const delay = duration / 2;
    const doubleDuration = duration * 2;
    const minDuration = delay + duration;
    const maxDuration = delay + doubleDuration;

    const config: DynamicRequest[] = [
        {
            delay: 100,
            duration,
            path: testPath_Script1,
            type: "script"
        },
        {
            delay,
            duration,
            path: testPath_Script2,
            type: "script"
        },
        {
            delay,
            path: crossDomainScript,
            type: "script"
        },
        {
            delay: 100,
            duration: duration * 2,
            path: testPath_Stylesheet1,
            type: "stylesheet"
        },
        {
            delay,
            duration: duration * 2,
            path: testPath_Stylesheet2,
            type: "stylesheet"
        },
        {
            delay: 100,
            duration: duration * 2,
            path: testPath_Image1,
            type: "image"
        },
        {
            delay,
            duration: duration * 2,
            path: testPath_Image2,
            type: "image"
        },
        {
            delay: 100,
            duration,
            method: "POST",
            path: testPath_Fetch1,
            type: "fetch"
        },
        {
            delay,
            duration,
            method: "POST",
            path: testPath_Fetch2,
            type: "fetch"
        }
    ];

    describe("Simple", () => {
        it("Fetch", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration: doubleDuration,
                        path: testPath_Script1,
                        type: "script"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: apiPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.startTiming();

            cy.waitUntilRequestIsDone({ resourceType: "fetch" });

            cy.stopTiming().should("be.gt", duration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "fetch" }).should("eq", 1);

            cy.interceptorStats({ resourceType: "script" }).then((stats) =>
                stats.every((entry) => expect(entry.isPending).to.be.true)
            );

            cy.interceptorRequestCalls({ resourceType: ["fetch", "script"] }).should("eq", 2);
        });

        it("XHR", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration: doubleDuration,
                        path: testPath_Script1,
                        type: "script"
                    },
                    {
                        delay: 100,
                        duration,
                        method: "POST",
                        path: apiPath_Fetch1,
                        type: "xhr"
                    }
                ])
            );

            cy.startTiming();

            cy.waitUntilRequestIsDone({ resourceType: "xhr" });

            cy.stopTiming().should("be.gt", duration);

            cy.interceptorStats({ resourceType: "xhr" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "xhr" }).should("eq", 1);

            cy.interceptorStats({ resourceType: "script" }).then((stats) =>
                stats.every((entry) => expect(entry.isPending).to.be.true)
            );

            cy.interceptorRequestCalls({ resourceType: ["xhr", "script"] }).should("eq", 2);
        });

        it("Script", () => {
            cy.visit(
                getDynamicUrl([
                    {
                        delay: 100,
                        duration,
                        path: testPath_Script1,
                        type: "script"
                    },
                    {
                        delay: 150,
                        duration: doubleDuration,
                        method: "POST",
                        path: apiPath_Fetch1,
                        type: "fetch"
                    }
                ])
            );

            cy.startTiming();

            cy.waitUntilRequestIsDone({ resourceType: "script" });

            cy.stopTiming().should("be.gt", duration);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(1);
                expect(stats[0].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "script" }).should("eq", 1);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) =>
                stats.every((entry) => expect(entry.isPending).to.be.true)
            );

            cy.interceptorRequestCalls({ resourceType: ["fetch", "script"] }).should("eq", 2);
        });
    });

    describe("Multiple", () => {
        it("Default settings", () => {
            cy.visit(getDynamicUrl(config));

            cy.startTiming();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", minDuration);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "script" }).should("eq", 2);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "fetch" }).should("eq", 2);

            cy.interceptorStats({ resourceType: "image" }).then((stats) => {
                expect(stats.length).to.eq(0);
            });

            cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
                expect(stats.length).to.eq(0);
            });

            cy.interceptorRequestCalls({ resourceType: ["fetch", "script"] }).should("eq", 4);
        });

        it("Custom settings - all", () => {
            cy.interceptorOptions({ resourceTypes: "all" });

            cy.visit(getDynamicUrl(config));

            cy.startTiming();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", maxDuration);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "script" }).should("eq", 2);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "fetch" }).should("eq", 2);

            cy.interceptorStats({ resourceType: "image" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "image" }).should("eq", 2);

            cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "stylesheet" }).should("eq", 2);

            cy.interceptorRequestCalls({
                resourceType: ["fetch", "image", "script", "stylesheet"]
            }).should("eq", 8);
            cy.interceptorRequestCalls({
                resourceType: ["fetch", "script"]
            }).should("eq", 4);
        });

        it("Custom settings - fetch", () => {
            cy.interceptorOptions({ resourceTypes: "fetch" });

            cy.visit(getDynamicUrl(config));

            cy.startTiming();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", minDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "fetch" }).should("eq", 2);

            cy.interceptorStats().then((stats) => {
                expect(stats.length).to.eq(2);
            });

            cy.interceptorRequestCalls().should("eq", 2);
        });

        it("Custom settings - fetch - script", () => {
            cy.interceptorOptions({ resourceTypes: ["fetch", "script"] });

            cy.visit(getDynamicUrl(config));

            cy.startTiming();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", minDuration);

            cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "fetch" }).should("eq", 2);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "script" }).should("eq", 2);

            cy.interceptorStats().then((stats) => {
                expect(stats.length).to.eq(4);
            });

            cy.interceptorRequestCalls().should("eq", 4);
        });

        it("Custom settings - script", () => {
            cy.interceptorOptions({ resourceTypes: "script" });

            cy.visit(getDynamicUrl(config));

            cy.startTiming();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", minDuration);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(2);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "script" }).should("eq", 2);

            cy.interceptorStats().then((stats) => {
                expect(stats.length).to.eq(2);
            });

            cy.interceptorRequestCalls().should("eq", 2);
        });

        it("Custom settings - script - cross origin", () => {
            cy.interceptorOptions({ resourceTypes: "script", ingoreCrossDomain: false });

            cy.visit(getDynamicUrl(config));

            cy.startTiming();

            cy.waitUntilRequestIsDone();

            cy.stopTiming().should("be.gt", minDuration);

            cy.interceptorStats({ resourceType: "script" }).then((stats) => {
                expect(stats.length).to.eq(3);
                expect(stats[0].isPending).to.be.false;
                expect(stats[1].isPending).to.be.false;
                expect(stats[2].isPending).to.be.false;
            });

            cy.interceptorRequestCalls({ resourceType: "script" }).should("eq", 3);

            cy.interceptorStats().then((stats) => {
                expect(stats.length).to.eq(3);
            });

            cy.interceptorRequestCalls().should("eq", 3);
        });
    });
});
