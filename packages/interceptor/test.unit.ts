import { deepCopy } from "./src/utils";
import { getCallLine, isCallLineEnabled } from "./test.unit.internal";

/**
 * This function is intened to be used in the application code to store any
 * information that you want to store and read in Cypress tests.
 *
 * If the call line is not enabled, it does nothing. Enable it
 * in Cypress tests in `beforeEach` hook.
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
 * This function is same as `lineCalled` but it clones the arguments
 * before storing them.
 *
 * @param args Anything that you want to store
 */
export const lineCalledWithClone = (...args: unknown[]) => {
    if (!isCallLineEnabled()) {
        return;
    }

    getCallLine().call(deepCopy(args.length > 1 ? [...args] : args[0]));
};
