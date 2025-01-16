/* istanbul ignore file */
import { ConsoleLog, ConsoleLogType, watchTheConsole } from "cypress-interceptor/src/console";
import { getFilePath } from "cypress-interceptor/src/utils";
import { generateUrl } from "cypress-interceptor-server/src/utils";

interface Ref {
    outputFile: string | undefined;
    skipError: boolean | undefined;
}

type LogQueue = [ConsoleLogType, unknown[]][];

const cypressFailEnvName = "__CONSOLE_FAIL_TEST__";
const invalidDate = new Date("").toString();
const staticUrl = generateUrl("public/index.html");
const outputDir = "_console";

const createConsoleLog = (logQueue: LogQueue) => {
    cy.window().then((win) => {
        for (const [type, args] of logQueue) {
            switch (type) {
                case ConsoleLogType.ConsoleLog:
                    win.console.log(...args);
                    break;
                case ConsoleLogType.ConsoleInfo:
                    win.console.info(...args);
                    break;
                case ConsoleLogType.ConsoleWarn:
                    win.console.warn(...args);
                    break;
                case ConsoleLogType.ConsoleError:
                    win.console.error(...args);
                    break;
            }
        }
    });
};

const createTestWithFail = (ref: Ref, logQueue: [ConsoleLogType, unknown[]][]) => {
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
        Cypress.on("fail", listener);
    });

    it("Visit the page, create some console logs and fail intentionally", () => {
        cy.visit(staticUrl);
        ref.outputFile = createOutputFileName("");

        createConsoleLog(logQueue);

        ref.skipError = true;

        // fail the test
        cy.get(".something-not-exist", { log: false, timeout: 0 });
    });
};

function createOutputFileName(outputDir: string) {
    return getFilePath(undefined, outputDir, "console");
}

Cypress.on("uncaught:exception", () => false);

describe("Log on Fail", () => {
    watchTheConsole(outputDir);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError"]]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should create a file with all console types from the previous test", () => {
        const outputFile = `${outputDir}${ref.outputFile}`;

        expect(outputFile).not.to.be.undefined;

        cy.readFile(outputFile).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].args[0]).to.be.a("string").and.not.to.be.empty;
            expect(log[0].currentTime).to.be.a("string");
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[0][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[2].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[1][1]);
            expect(log[3].type).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[3].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[3].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[3].args).to.deep.equal(logQueue[2][1]);
            expect(log[4].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[4].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[4].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[4].args).to.deep.equal(logQueue[3][1]);
        });
    });
});

describe("Log on Fail", () => {
    watchTheConsole(outputDir, [ConsoleLogType.ConsoleError]);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError"]]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should create a file with one console entry from the previous test", () => {
        const outputFile = `${outputDir}${ref.outputFile}`;

        expect(outputFile).not.to.be.undefined;

        cy.readFile(outputFile).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(1);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[3][1]);
        });
    });
});

describe("Log on Fail", () => {
    watchTheConsole(outputDir, [ConsoleLogType.ConsoleError, ConsoleLogType.ConsoleWarn]);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError"]]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should create a file with multiple console log types from the previous test", () => {
        const outputFile = `${outputDir}${ref.outputFile}`;

        expect(outputFile).not.to.be.undefined;

        cy.readFile(outputFile).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[2][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[3][1]);
        });
    });
});

describe("Log on Fail", () => {
    watchTheConsole(outputDir, [ConsoleLogType.ConsoleError]);

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    createTestWithFail(ref, logQueue);

    it("Should not create any file from the previous test", () => {
        const outputFile = `${outputDir}${ref.outputFile}`;

        expect(outputFile).not.to.be.undefined;

        cy.task("doesFileExist", outputFile).should("be.false");
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
    3;
    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName = createOutputFileName(outputDir);

        createConsoleLog([
            [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
            [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]]
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

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 1"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 2"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]]
    ];

    let outputFileName: string;

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName = createOutputFileName(outputDir);

        createConsoleLog(logQueue);
    });

    it("Should create a file with console error types", () => {
        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[1][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[3][1]);
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

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 1"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 2"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]]
    ];

    let outputFileName1: string;
    let outputFileName2: string;
    let outputFileName3: string;

    before(() => {
        cy.task("clearLogs", [outputDir1, outputDir2, outputDir3]);
    });

    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName1 = createOutputFileName(outputDir1);
        outputFileName2 = createOutputFileName(outputDir2);
        outputFileName3 = createOutputFileName(outputDir3);

        createConsoleLog(logQueue);
    });

    it("Should create a file with console error types", () => {
        cy.readFile(outputFileName1).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(1);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
        });

        cy.readFile(outputFileName2).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(3);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[1][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[3][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[2].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[4][1]);
        });

        cy.readFile(outputFileName3).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[0][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[2].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[1][1]);
            expect(log[3].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[3].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[3].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[3].args).to.deep.equal(logQueue[2][1]);
            expect(log[4].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[4].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[4].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[4].args).to.deep.equal(logQueue[3][1]);
            expect(log[5].type).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[5].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[5].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[5].args).to.deep.equal(logQueue[4][1]);
        });
    });
});

describe("Mutliple use", () => {
    const outputDir1 = "_console_1";
    const outputDir2 = "_console_2";

    // for failures
    watchTheConsole(outputDir1);

    // for all
    watchTheConsole([
        {
            outputDir: outputDir2,
            types: [ConsoleLogType.ConsoleLog]
        }
    ]);

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 1"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 2"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]]
    ];

    const ref: Ref = {
        outputFile: undefined,
        skipError: undefined
    };

    before(() => {
        cy.task("clearLogs", [outputDir1, outputDir2]);
    });

    createTestWithFail(ref, logQueue);

    it("Should create a file with console error types", () => {
        const outputFile1 = `${outputDir1}${ref.outputFile}`;
        const outputFile2 = `${outputDir2}${ref.outputFile}`;

        cy.task("doesFileExist", outputFile1).should("be.true");
        cy.task("doesFileExist", outputFile2).should("be.true");

        cy.readFile(outputFile1).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[0][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[2].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[1][1]);
            expect(log[3].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[3].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[3].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[3].args).to.deep.equal(logQueue[2][1]);
            expect(log[4].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[4].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[4].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[4].args).to.deep.equal(logQueue[3][1]);
            expect(log[5].type).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[5].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[5].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[5].args).to.deep.equal(logQueue[4][1]);
        });

        cy.readFile(outputFile2).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(1);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[0][1]);
        });
    });
});

describe("Filtering with a string", () => {
    const outputDir1 = "_console_1";
    const outputDir2 = "_console_2";
    const outputDir3 = "_console_3";

    watchTheConsole([
        {
            filter: (type) => type === ConsoleLogType.ConsoleError,
            outputDir: outputDir1
        },
        {
            filter: (_type, message) => String(message).startsWith("ConsoleInfo"),
            outputDir: outputDir2
        },
        {
            filter: () => false,
            outputDir: outputDir3
        }
    ]);

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 1"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo 1"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 2"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo 2"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]]
    ];

    let outputFileName1: string;
    let outputFileName2: string;
    let outputFileName3: string;

    before(() => {
        cy.task("clearLogs", [outputDir1, outputDir2, outputDir3]);
    });

    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName1 = createOutputFileName(outputDir1);
        outputFileName2 = createOutputFileName(outputDir2);
        outputFileName3 = createOutputFileName(outputDir3);

        createConsoleLog(logQueue);
    });

    it("Should create a file with filtered entries", () => {
        cy.readFile(outputFileName1).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[1][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[3][1]);
        });

        cy.readFile(outputFileName2).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[2][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[4][1]);
        });

        cy.task("doesFileExist", outputFileName3).should("be.false");
    });
});

describe("Filtering with an object", () => {
    const outputDir1 = "_console_1";
    const outputDir2 = "_console_2";
    const outputDir3 = "_console_3";

    watchTheConsole([
        {
            filter: (_type, obj1) => typeof obj1 === "object" && obj1 !== null && "message" in obj1,
            outputDir: outputDir1
        },
        {
            filter: (_type, _obj1, obj2) =>
                typeof obj2 === "object" &&
                obj2 !== null &&
                "arr" in obj2 &&
                Array.isArray(obj2.arr) &&
                obj2.arr.length > 0,
            outputDir: outputDir2
        },
        {
            filter: (_type, obj1) => typeof obj1 === "string",
            outputDir: outputDir3
        }
    ]);

    const logQueue: LogQueue = [
        [
            ConsoleLogType.ConsoleInfo,
            [{ message: "ConsoleInfo 1" }, { arr: [1, 2, 3, "e"], second: { object: 123 } }]
        ],
        [ConsoleLogType.ConsoleError, [{ message: "ConsoleError 1" }]],
        [ConsoleLogType.ConsoleLog, [{ message: "ConsoleLog" }]],
        [
            ConsoleLogType.ConsoleError,
            [{ error: { stack: "string" } }, { arr: [false, 0, null, ""] }]
        ],
        [ConsoleLogType.ConsoleInfo, [{ i: "ConsoleInfo 2" }, { arr: [] }]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]],
        [ConsoleLogType.ConsoleInfo, [null]],
        [ConsoleLogType.ConsoleLog, [[true, false, 0, null, ""]]]
    ];

    let outputFileName1: string;
    let outputFileName2: string;
    let outputFileName3: string;

    before(() => {
        cy.task("clearLogs", [outputDir1, outputDir2, outputDir3]);
    });

    it("Visit the page and create logs", () => {
        cy.visit(staticUrl);

        outputFileName1 = createOutputFileName(outputDir1);
        outputFileName2 = createOutputFileName(outputDir2);
        outputFileName3 = createOutputFileName(outputDir3);

        createConsoleLog(logQueue);
    });

    it("Should create a file with filtered entries", () => {
        cy.readFile(outputFileName1).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(3);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[0][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[1][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[2][1]);
        });

        cy.readFile(outputFileName2).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[0][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[3][1]);
        });

        cy.readFile(outputFileName3).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].args[0]).to.be.a("string").and.not.to.be.empty;
            expect(log[0].currentTime).to.be.a("string");
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[5][1]);
        });
    });
});

describe("JSON.stringify function or recursive object", () => {
    watchTheConsole([
        {
            outputDir
        }
    ]);

    const recursiveObject: Record<string, unknown> = {};

    recursiveObject.something = 123;
    recursiveObject.a = true;
    recursiveObject.arr = [recursiveObject];

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleInfo, [{ recursiveObject }]],
        [
            ConsoleLogType.ConsoleError,
            [
                {
                    fnc: function abc() {
                        return true;
                    }
                }
            ]
        ]
    ];

    let outputFileName1: string;
    let outputFileName2: string;

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    it("Visit the page and create logs", () => {
        cy.visit("/");

        outputFileName1 = createOutputFileName(outputDir);

        createConsoleLog(logQueue);
    });

    it("Should create a file with filtered entries", () => {
        outputFileName2 = createOutputFileName(outputDir);

        cy.readFile(outputFileName1).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal([
                {
                    recursiveObject: {
                        something: 123,
                        a: true,
                        arr: ["[Circular]"]
                    }
                }
            ]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal([
                {
                    fnc: "function abc() {\n      return true;\n    }"
                }
            ]);
        });
    });

    it("Should not create a file from the previous test", () => {
        cy.task("doesFileExist", outputFileName2).should("be.false");
    });
});
