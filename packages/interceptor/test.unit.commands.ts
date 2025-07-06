/// <reference types="cypress" preserve="true" />

import { CallLine, disableCallLine, enableCallLine, getCallLine } from "./test.unit.internal";
import { CallLineToFileOptions } from "./test.unit.types";

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
             * Disable the call line
             */
            callLineDisable(): void;
            /**
             * Enable the call line and create a new instance of the CallLine class
             */
            callLineEnable(): void;
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
            /**
             * Save CallLine entries to a file
             *
             * @param outputDir - The folder to save the call line
             * @param options - Options for the file
             */
            callLineToFile(
                outputDir: string,
                options?: CallLineToFileOptions &
                    Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
            ): Chainable<null>;
        }
    }
}

(() => {
    Cypress.Commands.add("callLine", () => cy.wrap(getCallLine()));
    Cypress.Commands.add("callLineClean", () => getCallLine().clean());
    Cypress.Commands.add("callLineCurrent", () => cy.wrap(getCallLine().current));
    Cypress.Commands.add("callLineDisable", () => disableCallLine());
    Cypress.Commands.add("callLineEnable", () => enableCallLine());
    Cypress.Commands.addQuery("callLineLength", () => () => getCallLine().length);
    Cypress.Commands.addQuery("callLineNext", () => () => getCallLine().next);
    Cypress.Commands.add("callLineReset", () => getCallLine().reset());
    Cypress.Commands.add("callLineToFile", (outputDir: string, options?: CallLineToFileOptions) => {
        getCallLine().toFile(outputDir, options);
    });
})();
