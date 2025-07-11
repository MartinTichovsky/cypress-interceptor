import "cypress-interceptor/console";

import { getFilePath } from "cypress-interceptor/src/utils.cypress";
import { ConsoleLog, ConsoleLogType } from "cypress-interceptor/WatchTheConsole.types";
import { generateUrl } from "cypress-interceptor-server/src/utils";

import { OUTPUT_DIR } from "../src/constants";

type LogQueue = [ConsoleLogType, unknown[]][];

const invalidDate = new Date("").toString();
const staticUrl = generateUrl("public/index.html");
const outputDir = `${OUTPUT_DIR}/${Cypress.spec.name}`;

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

function createOutputFileName(outputDir: string, fileName: string | undefined = undefined) {
    return getFilePath(fileName, outputDir, "console");
}

Cypress.on("uncaught:exception", () => false);

describe("Custom log", () => {
    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    it("Should create a file", () => {
        cy.visit(staticUrl);

        const logQueue: LogQueue = [
            [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
            [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]]
        ];

        createConsoleLog(logQueue);

        cy.writeConsoleLogToFile(outputDir);

        const outputFileName = createOutputFileName(outputDir);

        cy.task("doesFileExist", outputFileName).should("be.true");

        const checkTheLog = (log: ConsoleLog[]) => {
            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[0][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[2].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[1][1]);
        };

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            checkTheLog(log);
        });

        cy.watchTheConsole().then((watchTheConsole) => {
            checkTheLog(watchTheConsole.log);
            expect(
                watchTheConsole.log.filter((entry) => entry.type === ConsoleLogType.ConsoleError)
                    .length
            ).to.eq(0);
        });
    });

    it("Should not keep records from the previous test run", () => {
        cy.visit(staticUrl);

        const logQueue: LogQueue = [
            [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]],
            [ConsoleLogType.ConsoleError, ["ConsoleError"]]
        ];

        createConsoleLog(logQueue);

        cy.writeConsoleLogToFile(outputDir);

        const outputFileName = createOutputFileName(outputDir);

        cy.task("doesFileExist", outputFileName).should("be.true");

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleWarn);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[0][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[2].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[1][1]);
        });
    });

    it("Should create a file with a custom name", () => {
        cy.visit(staticUrl);

        const fileName = "CONSOLE_LOG_FILE";

        const logQueue: LogQueue = [
            [ConsoleLogType.ConsoleError, ["ConsoleError"]],
            [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
            [ConsoleLogType.ConsoleLog, ["ConsoleLog"]]
        ];

        createConsoleLog(logQueue);

        cy.writeConsoleLogToFile(outputDir, { fileName });

        const outputFileName = createOutputFileName(outputDir, fileName);

        cy.task("doesFileExist", outputFileName).should("be.true");

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(logQueue.length + 1);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[0][1]);
            expect(log[2].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[2].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[2].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[2].args).to.deep.equal(logQueue[1][1]);
            expect(log[3].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[3].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[3].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[3].args).to.deep.equal(logQueue[2][1]);
        });
    });
});

describe("Custom types", () => {
    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 1"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 2"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    beforeEach(() => {
        cy.visit(staticUrl);

        createConsoleLog(logQueue);
    });

    it("Should create a file with console error types", () => {
        cy.writeConsoleLogToFile(outputDir, { types: [ConsoleLogType.ConsoleError] });

        const outputFileName = createOutputFileName(outputDir);

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

    it("Should create a file with console info and log types", () => {
        cy.writeConsoleLogToFile(outputDir, {
            types: [ConsoleLogType.ConsoleInfo, ConsoleLogType.ConsoleLog]
        });

        const outputFileName = createOutputFileName(outputDir);

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(2);
            expect(log[0].type).to.equal(ConsoleLogType.ConsoleLog);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args).to.deep.equal(logQueue[0][1]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleInfo);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal(logQueue[2][1]);
        });
    });
});

describe("Filtering with a string", () => {
    const outputDir1 = `${OUTPUT_DIR}/${Cypress.spec.name}/console_1`;
    const outputDir2 = `${OUTPUT_DIR}/${Cypress.spec.name}/console_2`;
    const outputDir3 = `${OUTPUT_DIR}/${Cypress.spec.name}/console_3`;

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleLog, ["ConsoleLog"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 1"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo 1"]],
        [ConsoleLogType.ConsoleError, ["ConsoleError 2"]],
        [ConsoleLogType.ConsoleInfo, ["ConsoleInfo 2"]],
        [ConsoleLogType.ConsoleWarn, ["ConsoleWarn"]]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir1, outputDir2, outputDir3]);
    });

    it("Should create a file with filtered entries", () => {
        cy.visit(staticUrl);

        createConsoleLog(logQueue);

        cy.writeConsoleLogToFile(outputDir1, {
            filter: (type) => type === ConsoleLogType.ConsoleError
        });
        cy.writeConsoleLogToFile(outputDir2, {
            filter: (_type, message) => String(message).startsWith("ConsoleInfo")
        });
        cy.writeConsoleLogToFile(outputDir3, { filter: () => false });

        const outputFileName1 = createOutputFileName(outputDir1);
        const outputFileName2 = createOutputFileName(outputDir2);
        const outputFileName3 = createOutputFileName(outputDir3);

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
    const outputDir1 = `${OUTPUT_DIR}/${Cypress.spec.name}/console_1`;
    const outputDir2 = `${OUTPUT_DIR}/${Cypress.spec.name}/console_2`;
    const outputDir3 = `${OUTPUT_DIR}/${Cypress.spec.name}/console_3`;

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

    before(() => {
        cy.task("clearLogs", [outputDir1, outputDir2, outputDir3]);
    });

    it("Should create a file with filtered entries", () => {
        cy.visit(staticUrl);

        createConsoleLog(logQueue);

        cy.writeConsoleLogToFile(outputDir1, {
            filter: (_type, obj1) => typeof obj1 === "object" && obj1 !== null && "message" in obj1
        });
        cy.writeConsoleLogToFile(outputDir2, {
            filter: (_type, _obj1, obj2) =>
                typeof obj2 === "object" &&
                obj2 !== null &&
                "arr" in obj2 &&
                Array.isArray(obj2.arr) &&
                obj2.arr.length > 0
        });
        cy.writeConsoleLogToFile(outputDir3, { filter: (_type, obj1) => typeof obj1 === "string" });

        const outputFileName1 = createOutputFileName(outputDir1);
        const outputFileName2 = createOutputFileName(outputDir2);
        const outputFileName3 = createOutputFileName(outputDir3);

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
    const recursiveObject: Record<string, unknown> = {};

    recursiveObject.something = 123;
    recursiveObject.a = true;
    recursiveObject.arr = [recursiveObject];

    const recursiveArray: Array<unknown> = [];

    recursiveArray[0] = [recursiveArray];

    function abc() {
        return true;
    }

    const logQueue: LogQueue = [
        [ConsoleLogType.ConsoleInfo, [{ recursiveObject }, { recursiveArray }]],
        [
            ConsoleLogType.ConsoleError,
            [
                {
                    fnc: abc,
                    symbol: Symbol("My"),
                    weakMap: new WeakMap([[{}, ""]]),
                    weakSet: new WeakSet([{}, {}])
                }
            ]
        ]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    const testCase = (prettyOutput = true) => {
        cy.visit("/");

        createConsoleLog(logQueue);

        cy.writeConsoleLogToFile(outputDir, { prettyOutput });

        const outputFileName = createOutputFileName(outputDir);

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
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
                },
                {
                    recursiveArray: [["[Circular]"]]
                }
            ]);
            expect(log[1].type).to.equal(ConsoleLogType.ConsoleError);
            expect(new Date(log[1].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[1].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[1].args).to.deep.equal([
                {
                    fnc: String(abc),
                    symbol: "Symbol",
                    weakMap: "WeakMap",
                    weakSet: "WeakSet"
                }
            ]);
        });
    };

    it("Should create a file with cloned entries - with pretty output", () => {
        cy.watchTheConsoleOptions({ cloneConsoleArguments: true });

        testCase();
    });

    it("Should create a file with cloned entries - without pretty output", () => {
        cy.watchTheConsoleOptions({ cloneConsoleArguments: true });

        testCase(false);
    });

    it("Should create a file with cloned log - with pretty output", () => {
        cy.watchTheConsoleOptions({ cloneConsoleArguments: false });

        testCase();
    });

    it("Should create a file with cloned log - without pretty output", () => {
        cy.watchTheConsoleOptions({ cloneConsoleArguments: false });

        testCase(false);
    });
});

describe("JSON.stringify multiple types and deeply nested objects", () => {
    const recursiveObject: Record<string, unknown> = {};

    function abcd() {
        return false;
    }

    recursiveObject.abc = "abc";
    recursiveObject.bool = false;
    recursiveObject.n = null;
    recursiveObject.u = undefined;
    recursiveObject.rec = {
        arr: [9, false, true, NaN, recursiveObject],
        obj: {
            ref: recursiveObject
        },
        p: abcd
    };

    const logQueue: LogQueue = [
        [
            ConsoleLogType.ConsoleInfo,
            [{ recursiveObject }, [recursiveObject, recursiveObject, recursiveObject]]
        ],
        [
            ConsoleLogType.ConsoleWarn,
            [[recursiveObject, recursiveObject], { more: { recursiveObject } }]
        ]
    ];

    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    beforeEach(() => {
        cy.watchTheConsoleOptions({ cloneConsoleArguments: true });
    });

    it("Should create a file with filtered entries", () => {
        cy.visit("/");

        createConsoleLog(logQueue);

        cy.writeConsoleLogToFile(outputDir, { prettyOutput: true });

        const outputFileName = createOutputFileName(outputDir);

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            expect(log[0].args).to.deep.eq([
                {
                    recursiveObject: {
                        abc: "abc",
                        bool: false,
                        n: null,
                        rec: {
                            arr: [9, false, true, null, "[Circular]"],
                            obj: {
                                ref: "[Circular]"
                            },
                            p: String(abcd)
                        }
                    }
                },
                [
                    {
                        abc: "abc",
                        bool: false,
                        n: null,
                        rec: {
                            arr: [9, false, true, null, "[Circular]"],
                            obj: {
                                ref: "[Circular]"
                            },
                            p: String(abcd)
                        }
                    },
                    {
                        abc: "abc",
                        bool: false,
                        n: null,
                        rec: {
                            arr: [9, false, true, null, "[Circular]"],
                            obj: {
                                ref: "[Circular]"
                            },
                            p: String(abcd)
                        }
                    },
                    {
                        abc: "abc",
                        bool: false,
                        n: null,
                        rec: {
                            arr: [9, false, true, null, "[Circular]"],
                            obj: {
                                ref: "[Circular]"
                            },
                            p: String(abcd)
                        }
                    }
                ]
            ]);

            expect(log[1].args).to.deep.eq([
                [
                    {
                        abc: "abc",
                        bool: false,
                        n: null,
                        rec: {
                            arr: [9, false, true, null, "[Circular]"],
                            obj: {
                                ref: "[Circular]"
                            },
                            p: String(abcd)
                        }
                    },
                    {
                        abc: "abc",
                        bool: false,
                        n: null,
                        rec: {
                            arr: [9, false, true, null, "[Circular]"],
                            obj: {
                                ref: "[Circular]"
                            },
                            p: String(abcd)
                        }
                    }
                ],
                {
                    more: {
                        recursiveObject: {
                            abc: "abc",
                            bool: false,
                            n: null,
                            rec: {
                                arr: [9, false, true, null, "[Circular]"],
                                obj: {
                                    ref: "[Circular]"
                                },
                                p: String(abcd)
                            }
                        }
                    }
                }
            ]);
        });
    });
});

describe("Logging various JavaScript objects", () => {
    before(() => {
        cy.task("clearLogs", [outputDir]);
    });

    const customFunction = () => {
        return "Hello";
    };

    const visitAndLog = (extraLog = false) => {
        cy.visit(staticUrl);

        cy.window().then(
            (
                win: Cypress.AUTWindow & {
                    React?: {
                        createElement: (...args: unknown[]) => unknown;
                    };
                }
            ) => {
                const logQueue: LogQueue = [
                    [ConsoleLogType.ConsoleLog, [{ message: "String", value: "Hello, World!" }]],
                    [ConsoleLogType.ConsoleLog, [{ message: "Number", value: 42 }]],
                    [ConsoleLogType.ConsoleLog, [{ message: "Boolean", value: true }]],
                    [ConsoleLogType.ConsoleLog, [{ message: "Null", value: null }]],
                    [ConsoleLogType.ConsoleLog, [{ message: "Undefined", value: undefined }]],
                    [ConsoleLogType.ConsoleLog, [{ message: "Array", value: [1, 2, 3] }]],
                    [ConsoleLogType.ConsoleLog, [{ message: "Object", value: { key: "value" } }]],
                    [
                        ConsoleLogType.ConsoleLog,
                        [
                            {
                                message: "Function",
                                value: customFunction
                            }
                        ]
                    ],
                    [
                        ConsoleLogType.ConsoleLog,
                        [{ message: "Date", value: new Date("01-18-2025") }]
                    ],
                    [ConsoleLogType.ConsoleLog, [{ message: "RegExp", value: /abc/ }]],
                    [
                        ConsoleLogType.ConsoleLog,
                        [{ message: "DOM Element", value: win.document.createElement("div") }]
                    ],
                    [
                        ConsoleLogType.ConsoleLog,
                        [
                            {
                                message: "Button Element",
                                value: win.document.createElement("button")
                            }
                        ]
                    ],
                    [
                        ConsoleLogType.ConsoleLog,
                        [
                            {
                                message: "React Element",
                                value: win.React?.createElement("div", null, "Hello, React!")
                            }
                        ]
                    ]
                ];

                if (extraLog) {
                    logQueue.push([ConsoleLogType.ConsoleInfo, [win]]);
                }

                createConsoleLog(logQueue);
            }
        );
    };

    it("Should log various JavaScript objects - with clone", () => {
        cy.watchTheConsoleOptions({ cloneConsoleArguments: true });

        visitAndLog(true);

        cy.writeConsoleLogToFile(outputDir, { prettyOutput: true });

        const outputFileName = createOutputFileName(outputDir);

        cy.task("doesFileExist", outputFileName).should("be.true");

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(15);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
            expect(log[1].args).to.deep.eq([
                {
                    message: "String",
                    value: "Hello, World!"
                }
            ]);
            expect(log[2].args).to.deep.eq([
                {
                    message: "Number",
                    value: 42
                }
            ]);
            expect(log[3].args).to.deep.eq([
                {
                    message: "Boolean",
                    value: true
                }
            ]);
            expect(log[4].args).to.deep.eq([
                {
                    message: "Null",
                    value: null
                }
            ]);
            expect(log[5].args).to.deep.eq([
                {
                    message: "Undefined"
                }
            ]);
            expect(log[6].args).to.deep.eq([
                {
                    message: "Array",
                    value: [1, 2, 3]
                }
            ]);
            expect(log[7].args).to.deep.eq([
                {
                    message: "Object",
                    value: {
                        key: "value"
                    }
                }
            ]);
            expect(log[8].args).to.deep.eq([
                {
                    message: "Function",
                    value: String(customFunction)
                }
            ]);

            const dateEntry = log[9].args[0] as { message: string; value: string };

            expect(dateEntry.message).to.eq("Date");
            expect(new Date(dateEntry.value).toString()).not.to.equal(invalidDate);

            expect(log[10].args).to.deep.eq([
                {
                    message: "RegExp",
                    value: {}
                }
            ]);
            expect(log[11].args).to.deep.eq([
                {
                    message: "DOM Element",
                    value: "HTMLDivElement"
                }
            ]);
            expect(log[12].args).to.deep.eq([
                {
                    message: "Button Element",
                    value: "HTMLButtonElement"
                }
            ]);
            expect(log[13].args).to.deep.eq([
                {
                    message: "React Element",
                    value: "ReactElement"
                }
            ]);
            expect(log[14].args).to.deep.eq(["Window"]);
        });
    });

    it("Should log various JavaScript objects - without clone", () => {
        visitAndLog();

        cy.writeConsoleLogToFile(outputDir, { prettyOutput: true });

        const outputFileName = createOutputFileName(outputDir);

        cy.task("doesFileExist", outputFileName).should("be.true");

        cy.readFile(outputFileName).then((log: ConsoleLog[]) => {
            expect(log.length).to.equal(14);
            expect(log[0].type).to.equal(ConsoleLogType.Error);
            expect(new Date(log[0].dateTime).toString()).not.to.equal(invalidDate);
            expect(log[0].currentTime).to.be.a("string").and.not.to.be.empty;
            expect(log[0].args[0]).to.be.a("string");
            expect(log[1].args).to.deep.eq([
                {
                    message: "String",
                    value: "Hello, World!"
                }
            ]);
            expect(log[2].args).to.deep.eq([
                {
                    message: "Number",
                    value: 42
                }
            ]);
            expect(log[3].args).to.deep.eq([
                {
                    message: "Boolean",
                    value: true
                }
            ]);
            expect(log[4].args).to.deep.eq([
                {
                    message: "Null",
                    value: null
                }
            ]);
            expect(log[5].args).to.deep.eq([
                {
                    message: "Undefined"
                }
            ]);
            expect(log[6].args).to.deep.eq([
                {
                    message: "Array",
                    value: [1, 2, 3]
                }
            ]);
            expect(log[7].args).to.deep.eq([
                {
                    message: "Object",
                    value: {
                        key: "value"
                    }
                }
            ]);
            expect(log[8].args).to.deep.eq([
                {
                    message: "Function"
                }
            ]);

            const dateEntry = log[9].args[0] as { message: string; value: string };

            expect(dateEntry.message).to.eq("Date");
            expect(new Date(dateEntry.value).toString()).not.to.equal(invalidDate);

            expect(log[10].args).to.deep.eq([
                {
                    message: "RegExp",
                    value: {}
                }
            ]);
            expect(log[11].args).to.deep.eq([
                {
                    message: "DOM Element",
                    value: {}
                }
            ]);
            expect(log[12].args).to.deep.eq([
                {
                    message: "Button Element",
                    value: {}
                }
            ]);
            expect(log[13].args).to.deep.eq([
                {
                    message: "React Element",
                    value: {
                        type: "div",
                        key: null,
                        ref: null,
                        props: {
                            children: "Hello, React!"
                        },
                        _owner: null
                    }
                }
            ]);
        });
    });
});
