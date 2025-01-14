import { getFilePath } from "./utils";

/**
 * The output log is a JSON.stringify of an array of the following type:
 *
 * - Console Type
 * - The getTime() of the Date when the console was logged (for future investigation)
 * - The customized date and time in the format dd/MM/yyyy, hh:mm:ss.milliseconds. (for better visual checking)
 * - The console output or the unhandled JavaScript error message
 */
export type ConsoleLog = [ConsoleLogType, DateTime, CurrentTime, unknown];

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

    beforeEach(() => {
        cy.on("window:before:load", (win: Cypress.AUTWindow) => {
            log = [];

            win.addEventListener("error", (e: ErrorEvent) => {
                const [dateTime, currentTime] = getCurrentTime();

                log.push([ConsoleLogType.Error, dateTime, currentTime, e.error.stack]);
            });

            const originConsoleLog = win.console.log;

            win.console.log = (...args) => {
                const [dateTime, currentTime] = getCurrentTime();

                log.push([ConsoleLogType.ConsoleLog, dateTime, currentTime, args.join(",")]);

                originConsoleLog(...args);
            };

            const originConsoleInfo = win.console.info;

            win.console.info = (...args) => {
                const [dateTime, currentTime] = getCurrentTime();

                log.push([ConsoleLogType.ConsoleInfo, dateTime, currentTime, args.join(",")]);

                originConsoleInfo(...args);
            };

            const originConsoleWarn = win.console.warn;

            win.console.warn = (...args) => {
                const [dateTime, currentTime] = getCurrentTime();

                log.push([ConsoleLogType.ConsoleWarn, dateTime, currentTime, args.join(",")]);

                originConsoleWarn(...args);
            };

            const originConsoleError = win.console.error;

            win.console.error = (...args) => {
                const [dateTime, currentTime] = getCurrentTime();

                log.push([ConsoleLogType.ConsoleError, dateTime, currentTime, args.join(",")]);

                originConsoleError(...args);
            };
        });
    });

    const writeFailed = (outputDir: string) => {
        const filteredLog = log.filter(([type]) => !logOnlyType || logOnlyType.includes(type));

        if (filteredLog.length > 0) {
            cy.writeFile(
                getFilePath(undefined, outputDir, "console"),
                JSON.stringify(filteredLog, undefined, 4)
            );
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
            if (
                log.some(([type]) =>
                    customLog.types === undefined ? true : customLog.types.includes(type)
                )
            ) {
                cy.writeFile(
                    getFilePath(undefined, customLog.outputDir, "console"),
                    JSON.stringify(
                        log.filter(([type]) =>
                            customLog.types === undefined ? true : customLog.types.includes(type)
                        ),
                        undefined,
                        4
                    )
                );
            }
        }
    });
}
