/// <reference types="cypress" preserve="true" />

import { ConsoleProxy } from "./src/ConsoleProxy";
import { cloneAndRemoveCircular, deepCopy, removeUndefinedFromObject } from "./src/utils";
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
             * @example cy.writeConsoleLogToFile("./out") => the output file will be "./out/[Description] It.stats.json"
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
    private _records: ConsoleLog[] = [];
    private _options: Required<WatchTheConsoleOptions> = {
        ...defaultOptions
    };

    constructor(private consoleProxy: ConsoleProxy) {
        this._records = [];

        consoleProxy.onLog = (type, ...args) => {
            const [dateTime, currentTime] = getCurrentTime();

            switch (type) {
                case ConsoleLogType.Error: {
                    const e = args[0] as ErrorEvent;

                    this._records.push({
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
                    this._records.push({
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
     * console.error
     */
    get error() {
        return deepCopy(this._records).filter(
            (record) => record.type === ConsoleLogType.ConsoleError
        );
    }

    /**
     * console.info
     */
    get info() {
        return deepCopy(this._records).filter(
            (record) => record.type === ConsoleLogType.ConsoleInfo
        );
    }

    /**
     * JavaScript errors
     */
    get jsError() {
        return deepCopy(this._records).filter((record) => record.type === ConsoleLogType.Error);
    }

    /**
     * console.log
     */
    get log() {
        return deepCopy(this._records).filter(
            (record) => record.type === ConsoleLogType.ConsoleLog
        );
    }

    /**
     * Get the logged console output
     */
    get records() {
        return deepCopy(this._records);
    }

    /**
     * console.warn
     */
    get warn() {
        return deepCopy(this._records).filter(
            (record) => record.type === ConsoleLogType.ConsoleWarn
        );
    }

    private get win() {
        return this.consoleProxy.win;
    }

    private cloneConsoleArguments(args: unknown[]) {
        const result: unknown[] = [];

        for (const arg of args) {
            try {
                result.push(cloneAndRemoveCircular(arg, this.win));
            } catch (e) {
                result.push(String(e));
            }
        }

        return result;
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

        let filteredLog = this._records;

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
