/// <reference types="cypress" />

import { deepCopy, getFilePath, removeUndefinedFromObject } from "./utils";
import {
    ConsoleLog,
    ConsoleLogType,
    WatchTheConsoleOptions,
    WriteLogOptions
} from "./WatchTheConsole.types";

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Get an instance of the WatchTheConsole
             *
             * @returns An instance of the WatchTheConsole
             */
            watchTheConsole: () => Chainable<WatchTheConsole>;
            /**
             * Set the WatchTheConsole options. This must be called before a web page is visited.
             *
             * @param options Options
             * @returns The current WatchTheConsole options
             */
            watchTheConsoleOptions: (
                options?: WatchTheConsoleOptions
            ) => Chainable<WatchTheConsoleOptions>;
            /**
             * Write the logged console output to a file
             *
             * @example cy.writeConsoleLogToFile("./out") => the output file will be "./out/Description - It.stats.json"
             * @example cy.writeConsoleLogToFile("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
             * @example cy.writeConsoleLogToFile("./out", { types: [ConsoleLogType.ConsoleError, ConsoleLogType.Error] }) => write only the
             * console errors and unhandled JavaScript errors to the output file
             * @example cy.writeConsoleLogToFile("./out", { filter: (type, ...args) => typeof args[0] === "string" && args[0].startsWith("Custom log:") }) =>
             * filter all console output to include only entries starting with "Custom log:"
             *
             * @param outputDir The path for the output folder
             * @param options Options
             */
            writeConsoleLogToFile: (
                outputDir: string,
                options?: WriteLogOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
            ) => Chainable<null>;
        }
    }
}

const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && val !== null && !Array.isArray(val);

const cloneAndRemoveCircular = (value: unknown, recursiveStack: unknown[] = []) => {
    if (isObject(value) && recursiveStack.includes(value)) {
        return "[Circular]";
    } else if (isObject(value)) {
        recursiveStack.push(value);

        const result: Record<string, unknown> = {};

        for (const key of Object.keys(value)) {
            result[key] = cloneAndRemoveCircular(value[key], [...recursiveStack]);
        }

        return result;
    } else if (Array.isArray(value) && recursiveStack.includes(value)) {
        return "[Circular]";
    } else if (Array.isArray(value)) {
        const result: unknown[] = [];

        for (const entry of value) {
            result.push(cloneAndRemoveCircular(entry, [...recursiveStack]));
        }

        return result;
    } else if (typeof value === "function") {
        return String(value);
    } else {
        return value;
    }
};

const cloneConsoleArguments = (args: unknown[]) => {
    const result: unknown[] = [];

    for (const arg of args) {
        if (
            typeof arg === "string" ||
            typeof arg === "number" ||
            typeof arg === "boolean" ||
            arg === null ||
            arg === undefined
        ) {
            result.push(arg);
        } else {
            result.push(cloneAndRemoveCircular(arg));
        }
    }

    return result;
};

const defaultOptions: Required<WatchTheConsoleOptions> = {
    cloneConsoleArguments: false
};

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

export class WatchTheConsole {
    private _log: ConsoleLog[] = [];
    private _options: Required<WatchTheConsoleOptions> = {
        ...defaultOptions
    };

    constructor() {
        Cypress.on(
            "window:before:load",
            (
                win: Cypress.AUTWindow & {
                    _consoleLogRegistered: boolean;
                }
            ) => {
                this._log = [];

                win.addEventListener("error", (e: ErrorEvent) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    this._log.push({
                        args: [e.error.message, e.error.stack],
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.Error
                    });
                });

                const originConsoleLog = win.console.log;

                win.console.log = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    this._log.push({
                        args: this._options.cloneConsoleArguments
                            ? cloneConsoleArguments(args)
                            : args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleLog
                    });

                    originConsoleLog(...args);
                };

                const originConsoleInfo = win.console.info;

                win.console.info = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    this._log.push({
                        args: this._options.cloneConsoleArguments
                            ? cloneConsoleArguments(args)
                            : args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleInfo
                    });

                    originConsoleInfo(...args);
                };

                const originConsoleWarn = win.console.warn;

                win.console.warn = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    this._log.push({
                        args: this._options.cloneConsoleArguments
                            ? cloneConsoleArguments(args)
                            : args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleWarn
                    });

                    originConsoleWarn(...args);
                };

                const originConsoleError = win.console.error;

                win.console.error = (...args) => {
                    const [dateTime, currentTime] = getCurrentTime();

                    this._log.push({
                        args: this._options.cloneConsoleArguments
                            ? cloneConsoleArguments(args)
                            : args,
                        currentTime,
                        dateTime,
                        type: ConsoleLogType.ConsoleError
                    });

                    originConsoleError(...args);
                };
            }
        );
    }

    /**
     * Get the logged console output
     */
    get log() {
        return deepCopy(this._log);
    }

    /**
     * Set the WatchTheConsole options. This must be called before a web page is visited.
     *
     * @param options Options
     * @returns The current WatchTheConsole options
     */
    public setOptions(options: WatchTheConsoleOptions = this._options): WatchTheConsoleOptions {
        this._options = {
            ...this._options,
            ...removeUndefinedFromObject(options)
        };

        return deepCopy(this._options);
    }

    /**
     * Write the logged console output to a file
     *
     * @example writeLogToFile("./out") => the output file will be "./out/Description - It.stats.json"
     * @example writeLogToFile("./out", { fileName: "file_name" }) =>  the output file will be "./out/file_name.stats.json"
     * @example writeLogToFile("./out", { types: [ConsoleLogType.ConsoleError, ConsoleLogType.Error] }) => write only the
     * console errors and unhandled JavaScript errors to the output file
     * @example writeLogToFile("./out", { filter: (type, ...args) => typeof args[0] === "string" && args[0].startsWith("Custom log:") }) =>
     * filter all console output to include only entries starting with "Custom log:"
     *
     * @param outputDir The path for the output folder
     * @param options Options
     */
    public writeLogToFile(
        outputDir: string,
        options?: WriteLogOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
    ) {
        const types = options?.types;

        let filteredLog = this._log;

        if (types) {
            filteredLog = filteredLog.filter(({ type }) => types.includes(type));
        }

        const customFilter = options?.filter;

        if (customFilter) {
            filteredLog = filteredLog.filter(({ type, args }) => customFilter(type, ...args));
        }

        if (!filteredLog.length) {
            return cy.wrap(null);
        }

        return cy.writeFile(
            getFilePath(options?.fileName, outputDir, "console"),
            JSON.stringify(filteredLog, undefined, options?.prettyOutput ? 4 : undefined),
            options
        );
    }
}
