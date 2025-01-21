import { ConsoleProxy } from "./ConsoleProxy";
import { ConsoleLogType, WindowType } from "./WatchTheConsole.types";

export const createConsoleProxy = (consoleProxy: ConsoleProxy) => {
    const listener = (win: WindowType) => {
        consoleProxy.win = win;

        win.addEventListener("error", (e: ErrorEvent) => {
            consoleProxy.onLog(ConsoleLogType.Error, e);
        });

        const originConsoleLog = win.console.log;

        win.console.log = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleLog, ...args);
            originConsoleLog(...args);
        };

        const originConsoleInfo = win.console.info;

        win.console.info = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleInfo, ...args);
            originConsoleInfo(...args);
        };

        const originConsoleWarn = win.console.warn;

        win.console.warn = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleWarn, ...args);
            originConsoleWarn(...args);
        };

        const originConsoleError = win.console.error;

        win.console.error = (...args) => {
            consoleProxy.onLog(ConsoleLogType.ConsoleError, ...args);
            originConsoleError(...args);
        };
    };

    return listener;
};
