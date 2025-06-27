type CommonObject<T> = {
    [K in keyof T]?: T[K];
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
