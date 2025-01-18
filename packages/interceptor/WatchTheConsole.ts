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

const __MAX_CALL_COUNT__ = 999999;

const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && val !== null && !Array.isArray(val);

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
    private _win?: Cypress.AUTWindow = undefined;

    constructor() {
        Cypress.on(
            "window:before:load",
            (
                win: Cypress.AUTWindow & {
                    _consoleLogRegistered: boolean;
                }
            ) => {
                this._log = [];
                this._win = win;

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
                            ? this.cloneConsoleArguments(args)
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
                            ? this.cloneConsoleArguments(args)
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
                            ? this.cloneConsoleArguments(args)
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
                            ? this.cloneConsoleArguments(args)
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

    private get win() {
        return this._win ?? window;
    }

    private cloneAndRemoveCircular(value: unknown, recursiveStack: unknown[] = [], callCount = 0) {
        if (callCount > __MAX_CALL_COUNT__) {
            return "MAX_CALL_COUNT_REACHED";
        }

        if (
            typeof value === "bigint" ||
            typeof value === "boolean" ||
            typeof value === "number" ||
            typeof value === "string" ||
            value === null ||
            value === undefined
        ) {
            return value;
        }

        value = this.removeNonClonable(value);

        if (isObject(value) && recursiveStack.includes(value)) {
            return "[Circular]";
        } else if (isObject(value) && Object.keys(value).length) {
            const index = recursiveStack.push(value);
            const result: Record<string, unknown> = {};

            for (const key of Object.keys(value)) {
                result[key] = this.cloneAndRemoveCircular(value[key], recursiveStack, ++callCount);
            }

            recursiveStack.splice(index - 1, 1);

            return result;
        } else if (Array.isArray(value) && recursiveStack.includes(value)) {
            return "[Circular]";
        } else if (Array.isArray(value)) {
            const index = recursiveStack.push(value);
            const result: unknown[] = [];

            for (const entry of value) {
                result.push(this.cloneAndRemoveCircular(entry, recursiveStack, ++callCount));
            }

            recursiveStack.splice(index - 1, 1);

            return result;
        } else {
            return value;
        }
    }

    private cloneConsoleArguments(args: unknown[]) {
        const result: unknown[] = [];

        for (const arg of args) {
            result.push(this.cloneAndRemoveCircular(arg));
        }

        return result;
    }

    private removeNonClonable(value: unknown) {
        if (value instanceof this.win.Element || value instanceof this.win.HTMLElement) {
            return value.constructor?.name || "HTMLElement";
        }

        if (isObject(value) && value.$$typeof === Symbol.for("react.element")) {
            return "ReactElement";
        }

        if (typeof value === "function") {
            return String(value);
        }

        if (value instanceof this.win.WeakMap) {
            return "WeakMap";
        }

        if (value instanceof this.win.WeakSet) {
            return "WeakSet";
        }

        if (value instanceof this.win.Window) {
            return "Window";
        }

        if (typeof value === "symbol") {
            return "Symbol";
        }

        return value;
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
