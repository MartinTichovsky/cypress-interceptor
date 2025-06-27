/// <reference types="cypress" preserve="true" />

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
             * Clean the CallLine array and start storing the values from the beginning
             */
            callLineClean(): void;
            /**
             * The last existing entry. It can be `undefined` if there is no entry at
             * the moment or `next` has not been called. Otherwise it always returns
             * the last entry invoked by `next`.
             */
            callLineCurrent(): Chainable<unknown | unknown[] | undefined>;
            /**
             * Get the number of all entries.
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
            /**
             * Resets the counter and starts from the first entry on the next call to `cy.callLineNext`
             */
            callLineReset(): void;
        }
    }
}

(() => {
    const callLine = getCallLine();

    Cypress.Commands.add("callLine", () => cy.wrap(callLine));
    Cypress.Commands.add("callLineClean", () => callLine.clean());
    Cypress.Commands.add("callLineCurrent", () => cy.wrap(callLine.current));
    Cypress.Commands.addQuery("callLineLength", () => () => callLine.length);
    Cypress.Commands.addQuery("callLineNext", () => {
        return () => callLine.next;
    });
    Cypress.Commands.add("callLineReset", () => callLine.reset());
})();
