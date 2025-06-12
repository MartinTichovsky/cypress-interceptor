/// <reference types="cypress" preserve="true" />

import { ConsoleProxy } from "./src/ConsoleProxy";
import { createConsoleProxy } from "./src/createConsoleProxy";
import { WatchTheConsole } from "./WatchTheConsole";
import {
    WatchTheConsoleOptions,
    WindowTypeOfConsoleProxy,
    WriteLogOptions
} from "./WatchTheConsole.types";

export * from "./WatchTheConsole";

(() => {
    const consoleProxy = new ConsoleProxy();
    let watchTheConsole = new WatchTheConsole(consoleProxy);

    // to be able use it without cy.visit
    createConsoleProxy(consoleProxy)(window as WindowTypeOfConsoleProxy);

    // create the proxy in each window
    Cypress.on("window:before:load", createConsoleProxy(consoleProxy));

    // register commands
    Cypress.Commands.add("watchTheConsole", () => cy.wrap(watchTheConsole));
    Cypress.Commands.add("watchTheConsoleOptions", (options?: WatchTheConsoleOptions) =>
        cy.wrap(watchTheConsole.setOptions(options))
    );
    Cypress.Commands.add(
        "writeConsoleLogToFile",
        (
            outputDir: string,
            options?: WriteLogOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
        ) => watchTheConsole.writeLogToFile(outputDir, options)
    );

    // reset the instance in each run
    Cypress.on("test:before:run", () => {
        watchTheConsole = new WatchTheConsole(consoleProxy);
    });
})();
