import "cypress-interceptor/console";
import "cypress-interceptor/websocket";

import { getDynamicUrl } from "cypress-interceptor-server/src/utils";

let afterEachExpectedInterceptorOptions: Record<string, unknown> = {};
let afterEachExpectedWatchTheConsoleOptions: Record<string, unknown> = {};

afterEach(() => {
    cy.interceptorOptions().then((options) => {
        expect(options).to.deep.equal(afterEachExpectedInterceptorOptions);
    });
    cy.watchTheConsoleOptions().then((options) => {
        expect(options).to.deep.equal(afterEachExpectedWatchTheConsoleOptions);
    });
});

describe("Hooks - Case 2", () => {
    describe("Setting Options - 1", () => {
        after(() => {
            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal(afterEachExpectedInterceptorOptions);
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal(afterEachExpectedWatchTheConsoleOptions);
            });
        });

        afterEach(() => {
            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal(afterEachExpectedInterceptorOptions);
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal(afterEachExpectedWatchTheConsoleOptions);
            });
        });

        before(() => {
            cy.interceptorOptions({ ignoreCrossDomain: true });
            cy.watchTheConsoleOptions({ cloneConsoleArguments: true });

            cy.visit(getDynamicUrl([]));

            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: true });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: true });
            });
        });

        it("Should keep the options from before - 1", () => {
            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: true });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: true });
            });

            cy.visit(getDynamicUrl([]));

            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: true });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: true });
            });

            afterEachExpectedInterceptorOptions = { ignoreCrossDomain: true };
            afterEachExpectedWatchTheConsoleOptions = { cloneConsoleArguments: true };
        });

        it("Should keep not keep the options - 2", () => {
            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: false });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: false });
            });

            cy.interceptorOptions({ ignoreCrossDomain: true });
            cy.watchTheConsoleOptions({ cloneConsoleArguments: true });

            cy.visit(getDynamicUrl([]));

            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: true });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: true });
            });

            afterEachExpectedInterceptorOptions = { ignoreCrossDomain: true };
            afterEachExpectedWatchTheConsoleOptions = { cloneConsoleArguments: true };
        });

        it("Should keep not keep the options - 3", () => {
            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: false });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: false });
            });

            cy.visit(getDynamicUrl([]));

            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: false });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: false });
            });

            afterEachExpectedInterceptorOptions = { ignoreCrossDomain: false };
            afterEachExpectedWatchTheConsoleOptions = { cloneConsoleArguments: false };
        });
    });

    describe("Setting Options - 2", () => {
        const check = () => {
            cy.interceptorOptions().then((options) => {
                expect(options).to.deep.equal({ ignoreCrossDomain: false });
            });
            cy.watchTheConsoleOptions().then((options) => {
                expect(options).to.deep.equal({ cloneConsoleArguments: false });
            });
        };

        after(() => {
            check();
        });

        afterEach(() => {
            check();
        });

        before(() => {
            afterEachExpectedInterceptorOptions = { ignoreCrossDomain: false };
            afterEachExpectedWatchTheConsoleOptions = { cloneConsoleArguments: false };
            cy.visit(getDynamicUrl([]));
        });

        it("Should not keep the options from the previous describe - 1", () => {
            check();
        });

        it("Should not keep the options from the previous describe - 2", () => {
            check();
        });
    });
});

it("Should not the options outside describe - 1", () => {
    cy.interceptorOptions().then((options) => {
        expect(options).to.deep.equal({ ignoreCrossDomain: false });
    });
    cy.watchTheConsoleOptions().then((options) => {
        expect(options).to.deep.equal({ cloneConsoleArguments: false });
    });

    cy.interceptorOptions({ ignoreCrossDomain: true });
    cy.watchTheConsoleOptions({ cloneConsoleArguments: true });

    afterEachExpectedInterceptorOptions = { ignoreCrossDomain: true };
    afterEachExpectedWatchTheConsoleOptions = { cloneConsoleArguments: true };

    cy.visit(getDynamicUrl([]));

    cy.interceptorOptions().then((options) => {
        expect(options).to.deep.equal({ ignoreCrossDomain: true });
    });
    cy.watchTheConsoleOptions().then((options) => {
        expect(options).to.deep.equal({ cloneConsoleArguments: true });
    });
});

it("Should not the options outside describe - 2", () => {
    cy.interceptorOptions().then((options) => {
        expect(options).to.deep.equal({ ignoreCrossDomain: false });
    });
    cy.watchTheConsoleOptions().then((options) => {
        expect(options).to.deep.equal({ cloneConsoleArguments: false });
    });

    cy.interceptorOptions({ ignoreCrossDomain: true });
    cy.watchTheConsoleOptions({ cloneConsoleArguments: true });

    afterEachExpectedInterceptorOptions = { ignoreCrossDomain: true };
    afterEachExpectedWatchTheConsoleOptions = { cloneConsoleArguments: true };

    cy.visit(getDynamicUrl([]));

    cy.interceptorOptions().then((options) => {
        expect(options).to.deep.equal({ ignoreCrossDomain: true });
    });
    cy.watchTheConsoleOptions().then((options) => {
        expect(options).to.deep.equal({ cloneConsoleArguments: true });
    });
});
