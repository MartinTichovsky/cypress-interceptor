/// <reference types="cypress" preserve="true" />

import { ConsoleProxy } from "./src/ConsoleProxy";
import { deepCopy, removeUndefinedFromObject } from "./src/utils";
import { getFilePath } from "./src/utils.cypress";
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
            watchTheConsole(): Chainable<WatchTheConsole>;
            /**
             * Set the WatchTheConsole options. This must be called before a web page is visited.
             *
             * @param options Options
             * @returns The current WatchTheConsole options
             */
            watchTheConsoleOptions(
                options?: WatchTheConsoleOptions
            ): Chainable<WatchTheConsoleOptions>;
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
            writeConsoleLogToFile(
                outputDir: string,
                options?: WriteLogOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
            ): Chainable<null>;
        }
    }
}

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

    constructor(private consoleProxy: ConsoleProxy) {
        this._log = [];

        consoleProxy.onLog = (type, ...args) => {
            const [dateTime, currentTime] = getCurrentTime();

            switch (type) {
                case ConsoleLogType.Error: {
                    const e = args[0] as ErrorEvent;

                    this._log.push({
                        args: [e.error.message, e.error.stack],
                        currentTime,
                        dateTime,
                        type
                    });
                    break;
                }
                case ConsoleLogType.ConsoleLog:
                case ConsoleLogType.ConsoleInfo:
                case ConsoleLogType.ConsoleWarn:
                case ConsoleLogType.ConsoleError: {
                    this._log.push({
                        args: this._options.cloneConsoleArguments
                            ? this.cloneConsoleArguments(args)
                            : args,
                        currentTime,
                        dateTime,
                        type
                    });
                }
            }
        };
    }

    /**
     * Get the logged console output
     */
    get log() {
        return deepCopy(this._log);
    }

    private get win() {
        return this.consoleProxy.win;
    }

    private cloneAndRemoveCircular(value: unknown, recursiveStack: unknown[] = [], callCount = 0) {
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
            try {
                result.push(this.cloneAndRemoveCircular(arg));
            } catch (e) {
                result.push(String(e));
            }
        }

        return result;
    }

    private removeNonClonable(value: unknown) {
        if (
            value instanceof this.win.Element ||
            value instanceof Element ||
            value instanceof this.win.HTMLElement ||
            value instanceof HTMLElement
        ) {
            return value.constructor.name;
        }

        if (isObject(value) && value.$$typeof === Symbol.for("react.element")) {
            return "ReactElement";
        }

        if (typeof value === "function") {
            return String(value);
        }

        if (value instanceof this.win.WeakMap || value instanceof WeakMap) {
            return "WeakMap";
        }

        if (value instanceof this.win.WeakSet || value instanceof WeakSet) {
            return "WeakSet";
        }

        if (value instanceof this.win.Window || value instanceof Window) {
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

        try {
            return cy.writeFile(
                getFilePath(options?.fileName, outputDir, "console"),
                JSON.stringify(filteredLog, undefined, options?.prettyOutput ? 4 : undefined),
                options
            );
        } catch {
            // try to remove circular references
            return cy.writeFile(
                getFilePath(options?.fileName, outputDir, "console"),
                JSON.stringify(
                    this.cloneConsoleArguments(filteredLog),
                    undefined,
                    options?.prettyOutput ? 4 : undefined
                ),
                options
            );
        }
    }
}
