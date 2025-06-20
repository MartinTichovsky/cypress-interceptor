import { deepCopy } from "./src/utils";

export const __CALL_LINE__ = "__callLine__";

export type CallLineWindowType<T = unknown> = Window & { [__CALL_LINE__]?: T[] };

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

    if (parentWindow[__CALL_LINE__] === undefined || !Array.isArray(parentWindow[__CALL_LINE__])) {
        parentWindow[__CALL_LINE__] = [];
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
export const isCallLineEnabled = () =>
    (window as CallLineWindowType)[__CALL_LINE__] !== undefined &&
    Array.isArray((window as CallLineWindowType)[__CALL_LINE__]);

/**
 * Get a created instance of the CallLine class
 *
 * @returns An instance of the CallLine class
 */
export const getCallLine = () => new CallLine();

const getCallLineArray = <T>() => (window as CallLineWindowType<T>)[__CALL_LINE__] ?? [];

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

    getCallLineArray().push(args.length > 1 ? [...args] : args[0]);
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

    getCallLineArray().push(deepCopy(args.length > 1 ? [...args] : args[0]));
};

/**
 * It is a helper class for the call line that is stored in the window object.
 */
export class CallLine {
    private i = -1;

    /**
     * Get an instance of the window or an empty array if is not enabled
     */
    get array() {
        return getCallLineArray();
    }

    /**
     * The last existing entry. It can be `undefined` if there is no entry at
     * the moment or if `next` has not been called. Otherwise, it always returns
     * the last entry invoked by `next`.
     */
    get current(): unknown | unknown[] | undefined {
        return this.i === -1 ? undefined : getCallLineArray()[this.i];
    }

    /**
     * True if CallLine feature is globally enabled
     */
    get isEnabled() {
        return (window as CallLineWindowType)[__CALL_LINE__] !== undefined;
    }

    /**
     * Get the number of all entries.
     */
    get length() {
        return getCallLineArray().length;
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
        const callLineArray = getCallLineArray();

        if (callLineArray.length && callLineArray.length > this.i + 1) {
            this.i++;

            return this.current;
        } else {
            return undefined;
        }
    }

    /**
     * Clean the CallLine array and start storing the values from the beginning
     */
    clean() {
        const parentWindow: CallLineWindowType = window;

        if (Array.isArray(parentWindow[__CALL_LINE__])) {
            parentWindow[__CALL_LINE__].splice(0, parentWindow[__CALL_LINE__].length);
        }

        this.reset();
    }

    /**
     * Resets the counter and starts from the first entry on the next call to `next`
     */
    reset() {
        this.i = -1;
    }
}
