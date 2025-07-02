import { deepCopy } from "./src/utils";
import { getFilePath } from "./src/utils.cypress";
import { CallLineStack, CallLineToFileOptions } from "./test.unit.types";

const __CALL_LINE__ = "__callLine__";
const __CALL_LINE_NAME__ = "CallLine";

type CallLineWindowType = Window & { [__CALL_LINE__]?: CallLine };

// #region Main functions

/**
 * Disable the call line in the window object
 *
 * @param childWindow A window instance. In Cypress, it must be the window of `cy.window()`
 */
export const disableCallLine = (childWindow?: CallLineWindowType) => {
    const parentWindow: CallLineWindowType = globalThis.window;

    parentWindow[__CALL_LINE__] = undefined;

    if (childWindow) {
        childWindow[__CALL_LINE__] = undefined;
    }
};

/**
 * Enable the call line in the window object
 *
 * @param childWindow A window instance. In Cypress, it must be the window of `cy.window()`
 * @example How to enable in Cypress
 * ```ts
 * ·beforeEach(() => {
 * ·   cy.window().then((win) => {
 * ·      enableCallLine(win);
 * ·   });
 * ·});
 * ```
 */
export const enableCallLine = (childWindow?: CallLineWindowType) => {
    const parentWindow: CallLineWindowType = globalThis.window;

    if (
        parentWindow[__CALL_LINE__] === undefined ||
        !("name" in parentWindow[__CALL_LINE__]) ||
        parentWindow[__CALL_LINE__].name !== __CALL_LINE_NAME__
    ) {
        parentWindow[__CALL_LINE__] = new CallLine();
    }

    if (childWindow) {
        childWindow[__CALL_LINE__] = parentWindow[__CALL_LINE__];
    }
};

/**
 * Check if the call line is enabled
 *
 * @returns True if the call line is enabled
 */
export const isCallLineEnabled = () => {
    const win: CallLineWindowType = window;

    return (
        win[__CALL_LINE__] !== undefined &&
        "name" in win[__CALL_LINE__] &&
        win[__CALL_LINE__].name === __CALL_LINE_NAME__
    );
};

/**
 * Get a created instance of the CallLine class
 *
 * @returns An instance of the CallLine class
 */
export const getCallLine = () => {
    const win: CallLineWindowType = window;

    return isCallLineEnabled() ? win[__CALL_LINE__]! : new CallLine();
};

/**
 * For storing information about the line that was called.
 * If there are more arguments, it will be saved as an array,
 * otherwise it will be stored as a single value.
 *
 * @param args Anything that you want to store
 */
export const lineCalled = (...args: unknown[]) => {
    if (!isCallLineEnabled()) {
        return;
    }

    getCallLine().call(args.length > 1 ? [...args] : args[0]);
};

/**
 * For storing information about the line that was called with cloned arguments.
 * If there are more arguments, it will be saved as an array,
 * otherwise it will be stored as a single value.
 *
 * @param args Anything that you want to store
 */
export const lineCalledWithClone = (...args: unknown[]) => {
    if (!isCallLineEnabled()) {
        return;
    }

    getCallLine().call(deepCopy(args.length > 1 ? [...args] : args[0]));
};

// #endregion

/**
 * It is a helper class for the call line that is stored in the window object.
 */
export class CallLine {
    private _stack: CallLineStack[] = [];
    private i = -1;

    /**
     * Get the stack of the call line
     */
    get array() {
        return this._stack.map((stack) => ({
            args: Array.isArray(stack.args) ? [...stack.args] : stack.args,
            date: stack.date
        }));
    }

    /**
     * The last existing entry. It can be `undefined` if there is no entry at
     * the moment or if `next` has not been called. Otherwise, it always returns
     * the last entry invoked by `next`.
     */
    get current(): unknown | unknown[] | undefined {
        return this.i === -1 ? undefined : this.array[this.i]?.args;
    }

    /**
     * True if CallLine feature is globally enabled
     */
    get isEnabled() {
        return isCallLineEnabled();
    }

    /**
     * Get the number of all entries.
     */
    get length() {
        return this._stack.length;
    }

    get name() {
        return "CallLine";
    }

    /**
     * Get the next entry. If there is no next entry, it returns `undefined`.
     *
     * If the entry was added as a single argument like `lineCalled("something")`,
     * it will return the single value "something". But if it was added as multiple
     * arguments like `lineCalled("something", 1, true)`, it will return an array
     * `["something", 1, true]`.
     */
    get next(): unknown | unknown[] | undefined {
        if (this._stack.length && this._stack.length > this.i + 1) {
            this.i++;

            return this.current;
        } else {
            return undefined;
        }
    }

    /**
     * Add a new entry to the call line
     *
     * @param args The arguments to store
     */
    call(args: unknown | unknown[]) {
        this._stack.push({ args, date: new Date() });
    }

    /**
     * Clean the CallLine array and start storing the values from the beginning
     */
    clean() {
        this._stack = [];
        this.reset();
    }

    /**
     * Resets the counter and starts from the first entry on the next call to `next`
     */
    reset() {
        this.i = -1;
    }

    /**
     * Save CallLine entries to a file
     *
     * @param outputDir The folder to save the call line
     * @param options The options for the file
     */
    toFile(
        outputDir: string,
        options?: CallLineToFileOptions & Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
    ) {
        let stack = this._stack;

        if (options?.filter) {
            stack = stack.filter(options.filter);
        }

        if (!stack.length) {
            return cy.wrap(null);
        }

        return cy.writeFile(
            getFilePath(options?.fileName, outputDir, "callLine"),
            JSON.stringify(stack, undefined, options?.prettyOutput ? 4 : undefined),
            options
        );
    }
}
