import { WatchTheConsole } from "./WatchTheConsole";
import { WatchTheConsoleOptions, WriteLogOptions } from "./WatchTheConsole.types";

export * from "./WatchTheConsole";

const createCommands = () => {
    const watchTheConsole = new WatchTheConsole();

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
};

// this technique is used to ensure the commands are loaded when using it in before hooks

before(() => {
    createCommands();
});

afterEach(() => {
    createCommands();
});
