export interface ConsoleLog {
    /**
     * The console output or the unhandled JavaScript error message and stack trace
     */
    args: unknown[];
    /**
     * The customized date and time in the format dd/MM/yyyy, hh:mm:ss.milliseconds. (for better visual checking)
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
}

export enum ConsoleLogType {
    ConsoleInfo = "console.info",
    ConsoleError = "console.error",
    ConsoleLog = "console.log",
    ConsoleWarn = "console.warn",
    // this is equal to a unhandled JavaScript error
    Error = "error"
}

export type CurrentTime = string;

export type DateTime = number;

export interface WatchTheConsoleOptions {
    /**
     * When the console output includes an object, it is highly recommended to set this option to `true`
     * because an object can change at runtime and may not match the object that was logged at that moment.
     * When set to `true`, it will deeply copy the object and remove any circular dependencies.
     */
    cloneConsoleArguments?: boolean;
}

export interface WriteLogOptions {
    /**
     * The name of the file. If `undefined`, it will be generated from the running test.
     */
    fileName?: string;
    /**
     * An option to filter the logged items
     *
     * @param type The type of the console log
     * @param args The console log arguments
     * @returns `false` if the item should be skipped
     */
    filter?: (type: ConsoleLogType, ...args: unknown[]) => boolean;
    /**
     * When set to `true`, the output JSON will be formatted with tabs
     */
    prettyOutput?: boolean;
    /**
     * "If the type is not provided, it logs all console entries
     */
    types?: ConsoleLogType[];
}
