import "cypress-interceptor/src/index";

Cypress.Commands.overwrite("log", (_subject, message) => cy.task("log", message));
