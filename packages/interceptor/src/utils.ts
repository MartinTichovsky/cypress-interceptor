type CommonObject<T> = {
    [K in keyof T]?: T[K];
};

export const cloneAndRemoveCircular = (
    value: unknown,
    win: Cypress.AUTWindow,
    recursiveStack: unknown[] = [],
    callCount = 0
) => {
    if (
        typeof value === "bigint" ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string" ||
        value === null ||
        value === undefined
    ) {
        return value;
    }

    value = removeNonClonable(value, win);

    if (isObject(value) && recursiveStack.includes(value)) {
        return "[Circular]";
    } else if (isObject(value) && Object.keys(value).length) {
        const index = recursiveStack.push(value);
        const result: Record<string, unknown> = {};

        for (const key of Object.keys(value)) {
            result[key] = cloneAndRemoveCircular(value[key], win, recursiveStack, ++callCount);
        }

        recursiveStack.splice(index - 1, 1);

        return result;
    } else if (Array.isArray(value) && recursiveStack.includes(value)) {
        return "[Circular]";
    } else if (Array.isArray(value)) {
        const index = recursiveStack.push(value);
        const result: unknown[] = [];

        for (const entry of value) {
            result.push(cloneAndRemoveCircular(entry, win, recursiveStack, ++callCount));
        }

        recursiveStack.splice(index - 1, 1);

        return result;
    } else {
        return value;
    }
};

export const deepCopy = <T>(value: T) => {
    if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).length
    ) {
        const copy = {} as typeof value;

        for (const key in value) {
            copy[key] = deepCopy(value[key]);
        }

        return copy;
    } else if (Array.isArray(value)) {
        const copy = [] as typeof value;

        for (const key in value) {
            copy[key] = deepCopy(value[key]);
        }

        return copy;
    } else {
        return value;
    }
};

export const isNonNullableObject = (
    object: unknown
): object is Record<string | symbol | number, unknown> =>
    typeof object === "object" && object !== null;

export const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && val !== null && !Array.isArray(val);

export const removeNonClonable = (value: unknown, win: Cypress.AUTWindow) => {
    if (
        value instanceof win.Element ||
        value instanceof Element ||
        value instanceof win.HTMLElement ||
        value instanceof HTMLElement
    ) {
        return value.constructor.name;
    }

    if (isObject(value) && value.$$typeof === Symbol.for("react.element")) {
        return "ReactElement";
    }

    if (typeof value === "function") {
        return String(value);
    }

    if (value instanceof win.WeakMap || value instanceof WeakMap) {
        return "WeakMap";
    }

    if (value instanceof win.WeakSet || value instanceof WeakSet) {
        return "WeakSet";
    }

    if (value instanceof win.Window || value instanceof Window) {
        return "Window";
    }

    if (typeof value === "symbol") {
        return "Symbol";
    }

    return value;
};

export const removeUndefinedFromObject = <T, K extends keyof T>(object: CommonObject<T>) => {
    const result = { ...object };

    Object.keys(result).forEach((key) => result[key as K] === undefined && delete result[key as K]);

    return result;
};

export const testUrlMatch = (urlMatcher: string | RegExp, url: string) => {
    if (typeof urlMatcher === "string") {
        urlMatcher = new RegExp(`^${urlMatcher.replace(/(\*)+/gi, "(.*)")}$`);
    }

    return urlMatcher.test(url);
};
