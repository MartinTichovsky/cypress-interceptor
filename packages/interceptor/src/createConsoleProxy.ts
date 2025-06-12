import { ConsoleLogType, WindowTypeOfConsoleProxy } from "../WatchTheConsole.types";
import { ConsoleProxy } from "./ConsoleProxy";

export const createConsoleProxy = (consoleProxy: ConsoleProxy) => {
    const listener = (win: WindowTypeOfConsoleProxy) => {
        consoleProxy.win = win;

        const originConsoleError = win.console.error;

        win.console.error = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleError, ...args);
            originConsoleError(...args);
        };

        const originConsoleInfo = win.console.info;

        win.console.info = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleInfo, ...args);
            originConsoleInfo(...args);
        };

        const originConsoleLog = win.console.log;

        win.console.log = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleLog, ...args);
            originConsoleLog(...args);
        };

        const originConsoleWarn = win.console.warn;

        win.console.warn = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleWarn, ...args);
            originConsoleWarn(...args);
        };

        win.addEventListener("error", (e: ErrorEvent) => {
            consoleProxy.onLog(ConsoleLogType.Error, e);
        });
    };

    return listener;
};
