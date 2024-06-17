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

export const getFileNameFromCurrentTest = () => {
    const currentTest = Cypress.currentTest;
    const filePath = Cypress.spec.relative
        .replace(/^(cypress\\(\w+)\\)|(cypress\/(\w+)\/)/i, "")
        .replace(/(\/|\\)/gi, "-");

    return `${filePath} (${
        currentTest
            ? currentTest.titlePath.length
                ? currentTest.titlePath.join(" - ")
                : currentTest.title
            : "unknown"
    })`;
};

export const getFilePath = (fileName: string | undefined, outputDir: string, type: string) =>
    `${outputDir}${outputDir.endsWith("/") ? "" : "/"}${(fileName ? fileName : getFileNameFromCurrentTest()).replace(/(\/|\\)/gi, "|")}.${type}.json`;

export const isNonNullableObject = (
    object: unknown
): object is Record<string | symbol | number, unknown> =>
    typeof object === "object" && object !== null;

export const replacer = (_key: string, value: unknown) =>
    typeof value === "undefined" ? null : value;

export const testUrlMatch = (urlMatcher: string | RegExp, url: string) => {
    if (typeof urlMatcher === "string") {
        urlMatcher = new RegExp(`^${urlMatcher.replace(/(\*)+/gi, "(.*)")}$`);
    }

    return urlMatcher.test(url);
};

export const removeUndefinedFromObject = <T, K extends keyof T>(object: CommonObject<T>) => {
    const result = { ...object };

    Object.keys(result).forEach((key) => result[key as K] === undefined && delete result[key as K]);

    return result;
};
