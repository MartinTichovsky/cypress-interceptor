import { DynamicRequest } from "cypress-interceptor-server/src/types";
import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

import { crossDomainScript } from "../src/constants";

describe("Debug", () => {
    const duration = 1000;

    const config: DynamicRequest[] = [
        {
            delay: 100,
            path: "api/script.js",
            type: "script"
        },
        {
            delay: 100,
            path: crossDomainScript,
            type: "script"
        },
        {
            delay: 100,
            duration,
            method: "POST",
            path: "api/fetch-1",
            type: "fetch"
        },
        {
            delay: 100,
            duration,
            path: "style.css",
            type: "stylesheet"
        }
    ];

    it("Debug - default resource types", () => {
        cy.interceptorOptions({ debug: true });

        cy.visit(getDynamicUrl(config));

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((interceptor) => {
            expect(interceptor.debugIsEnabled).to.be.true;

            const debugInfo = interceptor.debugInfo;

            expect(debugInfo.length > 0).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "logged")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "logged-done")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "skipped")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "skipped-done")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "start")).to.be.true;
        });
    });

    it("Debug - all resource types", () => {
        cy.interceptorOptions({ debug: true, ingoreCrossDomain: false, resourceTypes: "all" });

        cy.visit(getDynamicUrl(config));

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((interceptor) => {
            expect(interceptor.debugIsEnabled).to.be.true;

            const debugInfo = interceptor.debugInfo;

            expect(debugInfo.length > 0).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "logged")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "logged-done")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.resourceType && entry.type === "skipped")).to
                .be.false;
            expect(!!debugInfo.find((entry) => entry.resourceType && entry.type === "skipped-done"))
                .to.be.false;
            expect(!!debugInfo.find((entry) => entry.type === "start")).to.be.true;
        });
    });

    it("Debug - from Cypress env", () => {
        cy.interceptorOptions({ debug: undefined });

        cy.visit(getDynamicUrl(config));

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((interceptor) => {
            expect(interceptor.debugIsEnabled).to.be.true;

            const debugInfo = interceptor.debugInfo;

            expect(debugInfo.length > 0).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "logged")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "logged-done")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "skipped")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "skipped-done")).to.be.true;
            expect(!!debugInfo.find((entry) => entry.type === "start")).to.be.true;
        });
    });

    it("Debug - false", () => {
        cy.interceptorOptions({ debug: false });

        cy.visit(getDynamicUrl(config));

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((interceptor) => {
            expect(interceptor.debugIsEnabled).to.be.false;

            const debugInfo = interceptor.debugInfo;

            expect(debugInfo.length > 0).to.be.false;
        });
    });
});
