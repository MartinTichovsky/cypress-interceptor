import "cypress-interceptor/index";

import { enableCallLine } from "cypress-interceptor/test.unit";

Cypress.on("window:before:load", (win) => {
    enableCallLine(window, win);
});

// Cypress.Commands.overwrite("log", (_subject, message) => cy.task("log", message));
