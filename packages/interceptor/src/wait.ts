type Checker = () => boolean;

interface Options {
    errorMessage?: string;
    interval: number;
    timeout: number;
}

export const waitTill = (checkFunction: Checker, options: Options): Cypress.Chainable<null> => {
    const endTime = Date.now() + options.timeout;

    Cypress.log({
        name: "waitTill",
        consoleProps: () => options
    });

    const wait = (result: boolean): Cypress.Chainable<null> => {
        if (!result) {
            return cy.wrap(null);
        }

        if (Date.now() >= endTime) {
            throw new Error(
                options.errorMessage
                    ? options.errorMessage
                    : "A wait timed out when wating for requests to be done"
            );
        }

        return cy.wait(options.interval, { log: false }).then(() => wait(checkFunction()));
    };

    return wait(checkFunction());
};
