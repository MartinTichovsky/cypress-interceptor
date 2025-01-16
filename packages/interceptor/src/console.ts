import { getFilePath } from "./utils";

export type ConsoleLog = {
    /**
     * The console output or the unhandled JavaScript error message and stack trace
     */
    args: unknown[];
    /**
     * The customized date and time in the format dd/MM/yyyy, hh:mm:ss.milliseconds. (for better visual checking
     */
    currentTime: CurrentTime;
    /**
     * The getTime() of the Date when the console was logged (for future investigation)
     */
    dateTime: DateTime;
    /**
     * Console Type
     */
    type: ConsoleLogType;
};

export enum ConsoleLogType {
    ConsoleInfo = "console.info",
    ConsoleError = "console.error",
    ConsoleLog = "console.log",
    ConsoleWarn = "console.warn",
    // this is equal to a unhandled JavaScript error
    Error = "error"
}

const getCurrentTime = (): [number, string] => {
    const currentTime = new Date();

    return [
        currentTime.getTime(),
        `${currentTime.toLocaleTimeString("en-GB", {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        })}.${currentTime.getMilliseconds()}`
    ];
};

type CurrentTime = string;

interface CustomLog {
    filter?: (type: ConsoleLogType, ...args: unknown[]) => boolean;
    /**
     * The output directory where the console logs will be saved
     */
    outputDir: string;
    /**
     * "If the type is not provided, it logs all console entries
     */
    types?: ConsoleLogType[];
}

type DateTime = number;

const safeStringify = (obj: unknown) => {
    const seen = new WeakSet();

    return JSON.stringify(
        obj,
        (_key, value) => {
            if (typeof value === "function") {
                return String(value);
            }

            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return "[Circular]";
                }

                seen.add(value);
            }

            return value;
        },
        4
    );
};

/**
 * Watch the console output and save it to a file if a test fails
 *
 * @param outputDir The output directory where the console logs will be saved
 * @param logOnlyType Log only specific types of console output. If not provided, it logs all console entries.
 */
export function watchTheConsole(outputDir: string, logOnlyType?: ConsoleLogType[]): void;
/**
 * Watch the console output and save it to a file after the test
 *
 * @param options Log options
 */
export function watchTheConsole(options: CustomLog | CustomLog[]): void;
export function watchTheConsole(
    outputDirOrOptions: string | CustomLog | CustomLog[],
    logOnlyType?: ConsoleLogType[]
) {
    let log: ConsoleLog[] = [];
    let init = true;

    beforeEach(() => {
        log = [];

        cy.on(
            "window:before:load",
            (
                win: Cypress.AUTWindow & {
                    _consoleLogRegistered: boolean;
                }
            ) => {
                if (win._consoleLogRegistered && !init) {
                    return;
                }

                win._consoleLogRegistered = true;

                win.addEventListener("error", (e: ErrorEvent) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    log.push({
                        args: [e.error.message, e.error.stack],
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.Error
                    });
                });

                const originConsoleLog = win.console.log;

                win.console.log = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    log.push({
                        args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleLog
                    });

                    originConsoleLog(...args);
                };

                const originConsoleInfo = win.console.info;

                win.console.info = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    log.push({
                        args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleInfo
                    });

                    originConsoleInfo(...args);
                };

                const originConsoleWarn = win.console.warn;

                win.console.warn = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    log.push({
                        args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleWarn
                    });

                    originConsoleWarn(...args);
                };

                const originConsoleError = win.console.error;

                win.console.error = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    log.push({
                        args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleError
                    });

                    originConsoleError(...args);
                };

                init = false;
            }
        );
    });

    const writeFailed = (outputDir: string) => {
        const filteredLog = log.filter(({ type }) => !logOnlyType || logOnlyType.includes(type));

        if (filteredLog.length) {
            cy.writeFile(getFilePath(undefined, outputDir, "console"), safeStringify(filteredLog));
        }
    };

    afterEach(function () {
        // the Cypress env is here to allow the test to fail for testing purposes
        const testFailed =
            this.currentTest?.state === "failed" || Cypress.env("__CONSOLE_FAIL_TEST__") === true;

        if (testFailed && typeof outputDirOrOptions === "string") {
            writeFailed(outputDirOrOptions);
        }

        if (typeof outputDirOrOptions === "string" || typeof outputDirOrOptions !== "object") {
            return;
        }

        if (!Array.isArray(outputDirOrOptions)) {
            outputDirOrOptions = [outputDirOrOptions];
        }

        for (const customLog of outputDirOrOptions) {
            let filteredLog = log.filter(({ type }) =>
                customLog.types === undefined ? true : customLog.types.includes(type)
            );

            const customFilter = customLog.filter;

            if (customFilter) {
                filteredLog = filteredLog.filter(({ type, args }) => customFilter(type, ...args));
            }

            if (filteredLog.length) {
                cy.writeFile(
                    getFilePath(undefined, customLog.outputDir, "console"),
                    safeStringify(filteredLog)
                );
            }
        }
    });
}
