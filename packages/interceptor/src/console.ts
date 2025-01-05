/* istanbul ignore file */
import { getFilePath } from "./utils";

// TODO: change the initialization and providing the path to the folder by default

export enum ConsoleLogType {
    ConsoleInfo = "console.info",
    ConsoleError = "console.error",
    ConsoleLog = "console.log",
    ConsoleWarn = "console.warn",
    Error = "error"
}

const getCurrentTime = () => {
    const currentTime = new Date();

    return `${currentTime.toLocaleTimeString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric"
    })}.${currentTime.getMilliseconds()}`;
};

type CurrentTime = string;

interface WatchTheConsole {
    /**
     * Custom log for all successful tests
     */
    customLogs?: { outputDir: string; types: ConsoleLogType[] }[];
    /**
     * Log only some types of the console output, if not privided, it
     * logs all the console entries
     */
    logOnlyType?: ConsoleLogType[];
}

export const watchTheConsole = (outputDir: string, options?: WatchTheConsole) => {
    let log: [ConsoleLogType, CurrentTime, string][] = [];

    beforeEach(() => {
        cy.on(
            "window:before:load",
            (
                win: Cypress.AUTWindow & {
                    _consoleLogRegistered: boolean;
                }
            ) => {
                log = [];

                if (win._consoleLogRegistered) {
                    return;
                }

                win._consoleLogRegistered = true;

                win.addEventListener("error", (e: ErrorEvent) => {
                    log.push([ConsoleLogType.Error, getCurrentTime(), e.error.stack]);
                });

                const originConsoleLog = win.console.log;

                win.console.log = (...args) => {
                    log.push([ConsoleLogType.ConsoleLog, getCurrentTime(), args.join(",")]);

                    originConsoleLog(...args);
                };

                const originConsoleInfo = win.console.info;

                win.console.info = (...args) => {
                    log.push([ConsoleLogType.ConsoleInfo, getCurrentTime(), args.join(",")]);

                    originConsoleInfo(...args);
                };

                const originConsoleWarn = win.console.warn;

                win.console.warn = (...args) => {
                    log.push([ConsoleLogType.ConsoleWarn, getCurrentTime(), args.join(",")]);

                    originConsoleWarn(...args);
                };

                const originConsoleError = win.console.error;

                win.console.error = (...args) => {
                    log.push([ConsoleLogType.ConsoleError, getCurrentTime(), args.join(",")]);

                    originConsoleError(...args);
                };
            }
        );
    });

    afterEach(function () {
        if (this.currentTest?.state !== "failed") {
            return;
        }

        const filteredLog = log.filter(
            ([type]) => !options?.logOnlyType || options.logOnlyType.includes(type)
        );

        if (filteredLog.length > 0) {
            cy.writeFile(
                getFilePath(undefined, outputDir, "console"),
                JSON.stringify(filteredLog, undefined, 4)
            );
        }
    });

    const customLogs = options?.customLogs;

    if (!customLogs) {
        return;
    }

    afterEach(function () {
        for (const customLog of customLogs) {
            if (log.some(([type]) => customLog.types.includes(type))) {
                cy.writeFile(
                    getFilePath(undefined, customLog.outputDir, "console"),
                    JSON.stringify(
                        log.filter(([type]) => customLog.types.includes(type)),
                        undefined,
                        4
                    )
                );
            }
        }
    });
};
