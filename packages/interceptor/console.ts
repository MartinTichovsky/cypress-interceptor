import { WatchTheConsole } from "./WatchTheConsole";

const createCommands = () => {
    const watchTheConsole = new WatchTheConsole();

    Cypress.Commands.add("watchTheConsole", () => cy.wrap(watchTheConsole));
    Cypress.Commands.add("watchTheConsoleOptions", (options) =>
        cy.wrap(watchTheConsole.setOptions(options))
    );
    Cypress.Commands.add("writeConsoleLogToFile", (outputDir, options) =>
        watchTheConsole.writeLogToFile(outputDir, options)
    );
};

beforeEach(() => {
    createCommands();
});
