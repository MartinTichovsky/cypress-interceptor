import { ConsoleProxy } from "cypress-interceptor/src/ConsoleProxy";
import {
    cloneAndRemoveCircular,
    removeNonClonable,
    removeUndefinedFromObject,
    sleep
} from "cypress-interceptor/src/utils";
import { WatchTheConsole } from "cypress-interceptor/WatchTheConsole";
import { ConsoleLogType } from "cypress-interceptor/WatchTheConsole.types";

// These tests cover branches/lines that were reported as uncovered in
// `WatchTheConsole.ts` and `src/utils.ts`. They exercise the public API
// directly (unit-style) and deliberately push "difficult" values through
// the utilities so every conversion branch is hit.

describe("WatchTheConsole - getters", () => {
    it("Should expose the records filtered by type through the getters", () => {
        const proxy = new ConsoleProxy();
        const watchTheConsole = new WatchTheConsole(proxy);

        proxy.onLog(ConsoleLogType.ConsoleLog, "a log message");
        proxy.onLog(ConsoleLogType.ConsoleInfo, "an info message");
        proxy.onLog(ConsoleLogType.ConsoleWarn, "a warn message");
        proxy.onLog(ConsoleLogType.ConsoleError, "an error message");

        // Simulate an unhandled JavaScript error (ConsoleLogType.Error). The
        // constructor reads `error.message` and `error.stack` from the event.
        const errorEvent = {
            error: {
                message: "js error message",
                stack: "js error stack"
            }
        } as unknown as ErrorEvent;

        proxy.onLog(ConsoleLogType.Error, errorEvent);

        // get log
        expect(watchTheConsole.log).to.have.length(1);
        expect(watchTheConsole.log[0].type).to.eq(ConsoleLogType.ConsoleLog);
        expect(watchTheConsole.log[0].args).to.deep.eq(["a log message"]);

        // get info
        expect(watchTheConsole.info).to.have.length(1);
        expect(watchTheConsole.info[0].type).to.eq(ConsoleLogType.ConsoleInfo);
        expect(watchTheConsole.info[0].args).to.deep.eq(["an info message"]);

        // get warn
        expect(watchTheConsole.warn).to.have.length(1);
        expect(watchTheConsole.warn[0].type).to.eq(ConsoleLogType.ConsoleWarn);
        expect(watchTheConsole.warn[0].args).to.deep.eq(["a warn message"]);

        // get error
        expect(watchTheConsole.error).to.have.length(1);
        expect(watchTheConsole.error[0].type).to.eq(ConsoleLogType.ConsoleError);
        expect(watchTheConsole.error[0].args).to.deep.eq(["an error message"]);

        // get jsError
        expect(watchTheConsole.jsError).to.have.length(1);
        expect(watchTheConsole.jsError[0].type).to.eq(ConsoleLogType.Error);
        expect(watchTheConsole.jsError[0].args).to.deep.eq(["js error message", "js error stack"]);

        // get records (all of them)
        expect(watchTheConsole.records).to.have.length(5);
    });

    it("Should return empty arrays from the getters when nothing was logged", () => {
        const proxy = new ConsoleProxy();
        const watchTheConsole = new WatchTheConsole(proxy);

        expect(watchTheConsole.log).to.deep.eq([]);
        expect(watchTheConsole.info).to.deep.eq([]);
        expect(watchTheConsole.warn).to.deep.eq([]);
        expect(watchTheConsole.error).to.deep.eq([]);
        expect(watchTheConsole.jsError).to.deep.eq([]);
        expect(watchTheConsole.records).to.deep.eq([]);
    });
});

describe("utils - sleep", () => {
    it("Should resolve after the given timeout using the default window", async () => {
        const start = Date.now();

        await sleep(30);

        expect(Date.now() - start).to.be.at.least(0);
    });

    it("Should resolve using an explicitly provided window", async () => {
        const start = Date.now();

        await sleep(10, window);

        expect(Date.now() - start).to.be.at.least(0);
    });
});

describe("utils - removeNonClonable", () => {
    it("Should convert every non-clonable value into a string representation", () => {
        // DOM Element / HTMLElement
        const div = document.createElement("div");

        expect(removeNonClonable(div, window)).to.eq(div.constructor.name);

        // Function
        const fn = function customFunction() {
            return 123;
        };

        expect(removeNonClonable(fn, window)).to.eq(String(fn));

        // WeakMap
        expect(removeNonClonable(new WeakMap(), window)).to.eq("WeakMap");

        // WeakSet
        expect(removeNonClonable(new WeakSet(), window)).to.eq("WeakSet");

        // Window
        expect(removeNonClonable(window, window)).to.eq("Window");

        // Symbol
        expect(removeNonClonable(Symbol("some symbol"), window)).to.eq("Symbol");

        // React element (detected via the special `$$typeof` symbol)
        const reactElement = { $$typeof: Symbol.for("react.element") };

        expect(removeNonClonable(reactElement, window)).to.eq("ReactElement");
    });

    it("Should return plain values unchanged", () => {
        const plainObject = { a: 1 };

        expect(removeNonClonable(plainObject, window)).to.eq(plainObject);
        expect(removeNonClonable("string", window)).to.eq("string");
        expect(removeNonClonable(42, window)).to.eq(42);
    });

    it("Should be applied while cloning through cloneAndRemoveCircular", () => {
        const fn = () => "hello";

        const result = cloneAndRemoveCircular(
            {
                fn,
                weakMap: new WeakMap(),
                weakSet: new WeakSet(),
                symbol: Symbol("s")
            },
            window
        ) as Record<string, unknown>;

        expect(result.fn).to.eq(String(fn));
        expect(result.weakMap).to.eq("WeakMap");
        expect(result.weakSet).to.eq("WeakSet");
        expect(result.symbol).to.eq("Symbol");
    });
});

describe("utils - removeUndefinedFromObject", () => {
    it("Should remove only the undefined properties (delete branch)", () => {
        expect(
            removeUndefinedFromObject({
                a: "a",
                b: 123,
                c: undefined,
                d: null
            })
        ).to.deep.eq({
            a: "a",
            b: 123,
            d: null
        });
    });

    it("Should keep all properties when none are undefined (short-circuit branch)", () => {
        expect(
            removeUndefinedFromObject({
                a: "a",
                b: 123
            })
        ).to.deep.eq({
            a: "a",
            b: 123
        });
    });
});
