import { ConsoleLog, ConsoleLogType, watchTheConsole } from "cypress-interceptor/src/console";
import { getFilePath } from "cypress-interceptor/src/utils";
import { generateUrl } from "cypress-interceptor-server/src/utils";

interface Ref {
    outputFile: string | undefined;
    skipError: boolean | undefined;
}

const cypressFailEnvName = "__CONSOLE_FAIL_TEST__";
const staticUrl = generateUrl("public/index.html");
const outputDir = "_console";

const createConsoleLog = (logQueue: [ConsoleLogType, string][]) => {
    cy.window().then((win) => {
        for (const [type, message] of logQueue) {
            switch (type) {
                case ConsoleLogType.ConsoleLog:
                    win.console.log(message);
                    break;
                case ConsoleLogType.ConsoleInfo:
                    win.console.info(message);
                    break;
                case ConsoleLogType.ConsoleWarn:
                    win.console.warn(message);
                    break;
                case ConsoleLogType.ConsoleError:
                    win.console.error(message);
                    break;
            }
        }
    });
};

const createTestWithFail = (ref: Ref, logQueue: [ConsoleLogType, string][]) => {
    function listener(assertionError: unknown) {
        if (ref.skipError) {
            // enable the fail flag
            Cypress.env(cypressFailEnvName, true);
            ref.skipError = false;
        } else {
            throw assertionError;
        }
    }

    afterEach(function () {
        Cypress.env(cypressFailEnvName, undefined);
        Cypress.off("fail", listener);
    });

    beforeEach(function () {
        Cypress.on("uncaught:exception", () => false);
        Cypress.on("fail", listener);
    });

    it("Visit the page, create some console logs and fail intentionally", () => {
        cy.visit(staticUrl);
        ref.outputFile = createOutputFileName(outputDir);

        createConsoleLog(logQueue);

        ref.skipError = true;

        // fail the test
        cy.get(".something-not-exist", { log: false, timeout: 0 });
    });
};

function createOutputFileName(outputDir: string) {
    return getFilePath(undefined, outputDir, "console");
}

describe("Log on Fail", () => {
    watchTheConsole(outputDir);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: [ConsoleLogType, string][] = [
        [ConsoleLogType.ConsoleLog, "ConsoleLog"],
        [ConsoleLogType.ConsoleInfo, "ConsoleInfo"],
        [ConsoleLogType.ConsoleWarn, "ConsoleWarn"],
        [ConsoleLogType.ConsoleError, "ConsoleError"]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should create a file with all console types from the previous test", () => {
        expect(ref.outputFile).not.to.be.undefined;

        cy.readFile(ref.outputFile!).then((log: ConsoleLog[]) => {
            const invalidDate = new Date("").toString();

            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0][0]).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0][1]).toString()).not.to.equal(invalidDate);
            expect(log[0][2]).to.be.a("string");
            expect(log[1][0]).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[1][1]).toString()).not.to.equal(invalidDate);
            expect(log[1][2]).to.equal(logQueue[0][1]);
            expect(log[2][0]).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[2][1]).toString()).not.to.equal(invalidDate);
            expect(log[2][2]).to.equal(logQueue[1][1]);
            expect(log[3][0]).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[3][1]).toString()).not.to.equal(invalidDate);
            expect(log[3][2]).to.equal(logQueue[2][1]);
            expect(log[4][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[4][1]).toString()).not.to.equal(invalidDate);
            expect(log[4][2]).to.equal(logQueue[3][1]);
        });
    });
});

describe("Log on Fail", () => {
    watchTheConsole(outputDir, [ConsoleLogType.ConsoleError]);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: [ConsoleLogType, string][] = [
        [ConsoleLogType.ConsoleLog, "ConsoleLog"],
        [ConsoleLogType.ConsoleInfo, "ConsoleInfo"],
        [ConsoleLogType.ConsoleWarn, "ConsoleWarn"],
        [ConsoleLogType.ConsoleError, "ConsoleError"]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should create a file with one console entry from the previous test", () => {
        expect(ref.outputFile).not.to.be.undefined;

        cy.readFile(ref.outputFile!).then((log: ConsoleLog[]) => {
            const invalidDate = new Date("").toString();

            expect(log.length).to.equal(1);
            expect(log[0][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[0][1]).toString()).not.to.equal(invalidDate);
            expect(log[0][2]).to.equal(logQueue[3][1]);
        });
    });
});

describe("Log on Fail", () => {
    watchTheConsole(outputDir, [ConsoleLogType.ConsoleError, ConsoleLogType.ConsoleWarn]);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: [ConsoleLogType, string][] = [
        [ConsoleLogType.ConsoleLog, "ConsoleLog"],
        [ConsoleLogType.ConsoleInfo, "ConsoleInfo"],
        [ConsoleLogType.ConsoleWarn, "ConsoleWarn"],
        [ConsoleLogType.ConsoleError, "ConsoleError"]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should create a file with multiple console log types from the previous test", () => {
        expect(ref.outputFile).not.to.be.undefined;

        cy.readFile(ref.outputFile!).then((log: ConsoleLog[]) => {
            const invalidDate = new Date("").toString();

            expect(log.length).to.equal(2);
            expect(log[0][0]).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[0][1]).toString()).not.to.equal(invalidDate);
            expect(log[0][2]).to.equal(logQueue[2][1]);
            expect(log[1][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1][1]).toString()).not.to.equal(invalidDate);
            expect(log[1][2]).to.equal(logQueue[3][1]);
        });
    });
});

describe("Log on Fail", () => {
    watchTheConsole(outputDir, [ConsoleLogType.ConsoleError]);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: [ConsoleLogType, string][] = [
        [ConsoleLogType.ConsoleLog, "ConsoleLog"],
        [ConsoleLogType.ConsoleInfo, "ConsoleInfo"],
        [ConsoleLogType.ConsoleWarn, "ConsoleWarn"]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should not create any file from the previous test", () => {
        expect(ref.outputFile).not.to.be.undefined;

        cy.task("doesFileExist", ref.outputFile).should("be.false");
    });
});

describe("Custom log", () => {
    watchTheConsole({
        outputDir,
        types: [ConsoleLogType.ConsoleError]
    });

    let outputFileName: string;

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    beforeEach(function () {
        Cypress.on("uncaught:exception", () => false);
    });

    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName = createOutputFileName(outputDir);

        createConsoleLog([
            [ConsoleLogType.ConsoleLog, "ConsoleLog"],
            [ConsoleLogType.ConsoleInfo, "ConsoleInfo"]
        ]);
    });

    it("Should not create any file from the previous test", () => {
        cy.task("doesFileExist", outputFileName).should("be.false");
    });
});

describe("Custom log", () => {
    watchTheConsole({
        outputDir,
        types: [ConsoleLogType.ConsoleError]
    });

    const logQueue: [ConsoleLogType, string][] = [
        [ConsoleLogType.ConsoleLog, "ConsoleLog"],
        [ConsoleLogType.ConsoleError, "ConsoleError 1"],
        [ConsoleLogType.ConsoleInfo, "ConsoleInfo"],
        [ConsoleLogType.ConsoleError, "ConsoleError 2"],
        [ConsoleLogType.ConsoleWarn, "ConsoleInfo"]
    ];

    let outputFileName: string;

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    beforeEach(function () {
        Cypress.on("uncaught:exception", () => false);
    });

    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName = createOutputFileName(outputDir);

        createConsoleLog(logQueue);
    });

    it("Should create a file with console error types", () => {
        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            const invalidDate = new Date("").toString();

            expect(log.length).to.equal(2);
            expect(log[0][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[0][1]).toString()).not.to.equal(invalidDate);
            expect(log[0][2]).to.equal(logQueue[1][1]);
            expect(log[1][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1][1]).toString()).not.to.equal(invalidDate);
            expect(log[1][2]).to.equal(logQueue[3][1]);
        });
    });
});

describe("Custom log", () => {
    const outputDir1 = "_console_1";
    const outputDir2 = "_console_2";
    const outputDir3 = "_console_3";

    watchTheConsole([
        {
            outputDir: outputDir1,
            types: [ConsoleLogType.Error]
        },
        {
            outputDir: outputDir2,
            types: [ConsoleLogType.ConsoleError, ConsoleLogType.ConsoleWarn]
        },
        {
            outputDir: outputDir3
        }
    ]);

    const logQueue: [ConsoleLogType, string][] = [
        [ConsoleLogType.ConsoleLog, "ConsoleLog"],
        [ConsoleLogType.ConsoleError, "ConsoleError 1"],
        [ConsoleLogType.ConsoleInfo, "ConsoleInfo"],
        [ConsoleLogType.ConsoleError, "ConsoleError 2"],
        [ConsoleLogType.ConsoleWarn, "ConsoleInfo"]
    ];

    let outputFileName1: string;
    let outputFileName2: string;
    let outputFileName3: string;

    before(() => {
        cy.task("clearLogs", [outputDir1, outputDir2, outputDir3]);
    });

    beforeEach(function () {
        Cypress.on("uncaught:exception", () => false);
    });

    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName1 = createOutputFileName(outputDir1);
        outputFileName2 = createOutputFileName(outputDir2);
        outputFileName3 = createOutputFileName(outputDir3);

        createConsoleLog(logQueue);
    });

    it("Should create a file with console error types", () => {
        const invalidDate = new Date("").toString();

        cy.readFile(outputFileName1).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(1);
            expect(log[0][0]).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0][1]).toString()).not.to.equal(invalidDate);
            expect(log[0][2]).to.be.a("string");
        });

        cy.readFile(outputFileName2).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(3);
            expect(log[0][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[0][1]).toString()).not.to.equal(invalidDate);
            expect(log[0][2]).to.equal(logQueue[1][1]);
            expect(log[1][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1][1]).toString()).not.to.equal(invalidDate);
            expect(log[1][2]).to.equal(logQueue[3][1]);
            expect(log[2][0]).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[2][1]).toString()).not.to.equal(invalidDate);
            expect(log[2][2]).to.equal(logQueue[4][1]);
        });

        cy.readFile(outputFileName3).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0][0]).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0][1]).toString()).not.to.equal(invalidDate);
            expect(log[0][2]).to.be.a("string");
            expect(log[1][0]).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[1][1]).toString()).not.to.equal(invalidDate);
            expect(log[1][2]).to.equal(logQueue[0][1]);
            expect(log[2][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[2][1]).toString()).not.to.equal(invalidDate);
            expect(log[2][2]).to.equal(logQueue[1][1]);
            expect(log[3][0]).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[3][1]).toString()).not.to.equal(invalidDate);
            expect(log[3][2]).to.equal(logQueue[2][1]);
            expect(log[4][0]).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[4][1]).toString()).not.to.equal(invalidDate);
            expect(log[4][2]).to.equal(logQueue[3][1]);
            expect(log[5][0]).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[5][1]).toString()).not.to.equal(invalidDate);
            expect(log[5][2]).to.equal(logQueue[4][1]);
        });
    });
});
