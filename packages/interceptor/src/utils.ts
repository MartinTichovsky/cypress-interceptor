type CommonObject<T> = {
    [K in keyof T]?: T[K];
};

export const convertToString = async (
    input: Document | BodyInit | null | undefined,
    win: Cypress.AUTWindow
) => {
    if (input instanceof win.Document) {
        return new XMLSerializer().serializeToString(input);
    } else if (typeof input === "string") {
        return input;
    } else if (input instanceof win.Blob) {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(input);
        });
    } else if (input instanceof win.FormData || input instanceof win.URLSearchParams) {
        const obj: Record<string, unknown> = {};

        for (const [key, value] of input.entries()) {
            obj[key] = value;
        }

        return JSON.stringify(obj);
    } else if (input instanceof win.ArrayBuffer || win.ArrayBuffer.isView(input)) {
        return new TextDecoder().decode(input);
    } else if (typeof input === "object" && input !== null) {
        return JSON.stringify(input);
    } else {
        return "";
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

export const getFileNameFromCurrentTest = () => {
    const currentTest = Cypress.currentTest;
    const filePath = Cypress.spec.relative.replace(/^(cypress\\(\w+)\\)|(cypress\/(\w+)\/)/i, "");

    return `${normalizeFileName(filePath)} (${normalizeFileName(
        currentTest
            ? currentTest.titlePath.length
                ? currentTest.titlePath.join(" - ")
                : currentTest.title
            : "unknown"
    )})`;
};

export const getFilePath = (fileName: string | undefined, outputDir: string, type: string) =>
    maxLengthFileName(
        `${outputDir}${outputDir.endsWith("/") ? "" : "/"}${fileName ? fileName : getFileNameFromCurrentTest()}`,
        `.${type}.json`
    );

export const isNonNullableObject = (
    object: unknown
): object is Record<string | symbol | number, unknown> =>
    typeof object === "object" && object !== null;

export const maxLengthFileName = (fileName: string, extension: string) => {
    const maxLength = 255;

    return `${fileName.slice(0, maxLength - extension.length)}${extension}`;
};

export const normalizeFileName = (fileName: string) =>
    fileName
        .replace(/[^a-zA-Z0-9_\-. ]/gi, "-")
        .replace(/(-)+/g, "-")
        .replace(/( )+/g, " ");

export const removeUndefinedFromObject = <T, K extends keyof T>(object: CommonObject<T>) => {
    const result = { ...object };

    Object.keys(result).forEach((key) => result[key as K] === undefined && delete result[key as K]);

    return result;
};

export const replacer = (_key: string, value: unknown) =>
    typeof value === "undefined" ? null : value;

export const testUrlMatch = (urlMatcher: string | RegExp, url: string) => {
    if (typeof urlMatcher === "string") {
        urlMatcher = new RegExp(`^${urlMatcher.replace(/(\*)+/gi, "(.*)")}$`);
    }

    return urlMatcher.test(url);
};
