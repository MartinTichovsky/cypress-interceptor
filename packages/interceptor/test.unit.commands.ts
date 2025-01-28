/// <reference types="cypress" />

import { CallLine, getCallLine } from "./test.unit";

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Get a created instance of the CallLine class
             *
             * @returns An instance of the CallLine class
             */
            callLine(): Chainable<CallLine>;
            /**
             * The last existing entry. It can be `undefined` if there is no entry at
             * the moment or `next` has not been called. Otherwise it always returns
             * the last entry invoked by `next`.
             */
            callLineCurrent(): Chainable<unknown | unknown[] | undefined>;
            /**
             * The number of all entries
             */
            callLineLength(): Chainable<number>;
            /**
             * Get the next entry. If there is no next entry, it returns undefined.
             *
             * If the entry was added as a single argument like `lineCalled("something")`,
             * it will return the single value "something". But if it was added as multiple
             * arguments like `lineCalled("something", 1, true)`, it will return an array
             * `["something", 1, true]`.
             */
            callLineNext(): Chainable<unknown | unknown[] | undefined>;
        }
    }
}

(() => {
    const callLine = getCallLine();

    Cypress.Commands.add("callLine", () => cy.wrap(callLine));
    Cypress.Commands.add("callLineCurrent", () => cy.wrap(callLine.current));
    Cypress.Commands.add("callLineLength", () => cy.wrap(callLine.length));
    Cypress.Commands.add("callLineNext", () => cy.wrap(callLine.next));
})();
