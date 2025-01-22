import { blobToObject, fileToObject, isObject, valueToString } from "./common";
import { createReplacer } from "./replacer";

const castString = (value: string) => {
    if (value === "Infinity") {
        return Infinity;
    }

    if (value === "-Infinity") {
        return -Infinity;
    }

    if (value === "false") {
        return false;
    }

    if (value === "true") {
        return true;
    }

    if (value === "NaN") {
        return NaN;
    }

    if (value === "null") {
        return null;
    }

    if (/^\d+n$/.test(value)) {
        return BigInt(value.slice(0, -1));
    }

    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return Number(value);
    }

    if (value.startsWith("/") && value.endsWith("/")) {
        try {
            return new RegExp(value.slice(1, -1));
        } catch {
            //
        }
    }

    return value;
};

export const formDataToObject = <T extends Record<string | number, unknown>>(
    formData: FormData,
    window: Cypress.AUTWindow
): T => {
    return instanceToObject(formData, window);
};

export const formDataToJsonString = (formData: FormData, window: Cypress.AUTWindow) =>
    JSON.stringify(formDataToObject(formData, window), createReplacer(window));

export const instanceToObject = <T extends Record<string | number, unknown>>(
    instance: FormData | URLSearchParams,
    window: Cypress.AUTWindow
): T => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of instance.entries()) {
        const path = key
            .split("[")
            .map((s) => s.replace(/\]$/, ""))
            .map((s) => (/^\d+$/.test(s) ? parseInt(s, 10) : s));

        let current = result;

        for (let i = 0; i < path.length - 1; i++) {
            const segment = path[i];
            const nextSegment = path[i + 1];

            if (current[segment] == null) {
                current[segment] = typeof nextSegment === "number" || value === "[]" ? [] : {};
            }

            current = current[segment] as Record<string, unknown>;
        }

        const lastKey = path[path.length - 1];

        // a workaround for empty objects like {} or []
        if (lastKey === "" && (value === "{}" || value === "[]")) {
            continue;
        }

        if (value instanceof window.File) {
            current[lastKey] = {
                name: value.name,
                type: value.type,
                size: value.size
            };
        } else {
            current[lastKey] = castString(String(value));
        }
    }

    return result as T;
};

export const isUnsupported = (value: unknown) => value === undefined;

export const objectToFormData = <T extends Record<string, unknown>>(
    data: T,
    window: Cypress.AUTWindow
) => {
    const result = new window.FormData();

    if (isObject(data)) {
        objectToInstance_recursive(data, window, result);
    }

    return result;
};

const objectToInstance_recursive = <Result extends FormData | URLSearchParams>(
    data: Record<string, unknown> | Array<unknown>,
    window: Cypress.AUTWindow,
    result: Result,
    parentKey?: string
) => {
    if (data instanceof window.Map) {
        data = Object.fromEntries(data);
    } else if (data instanceof window.Set) {
        data = Array.from(data);
    }

    const entries = Object.entries(data);

    if (parentKey && !entries.length) {
        result.append(`${parentKey}[]`, Array.isArray(data) ? "[]" : "{}");
    }

    for (const [key, value] of entries) {
        if (isUnsupported(value)) {
            continue;
        }

        const fieldKey = parentKey ? `${parentKey}[${key}]` : key;

        if (value instanceof window.Date) {
            result.append(fieldKey, valueToString(value.toISOString()));
            continue;
        }

        if (
            result instanceof window.FormData &&
            (value instanceof window.File || value instanceof window.Blob)
        ) {
            result.append(fieldKey, value);
            continue;
        } else if (result instanceof window.URLSearchParams && value instanceof window.File) {
            objectToInstance_recursive(fileToObject(value), window, result, fieldKey);
            continue;
        } else if (result instanceof window.URLSearchParams && value instanceof window.Blob) {
            objectToInstance_recursive(blobToObject(value), window, result, fieldKey);
            continue;
        }

        if (!isObject(value) || value instanceof window.RegExp) {
            result.append(fieldKey, valueToString(value));
            continue;
        }

        objectToInstance_recursive(value, window, result, fieldKey);
    }
};

export const objectToURLSearchParams = <T extends Record<string, unknown>>(
    data: T,
    window: Cypress.AUTWindow
) => {
    const result = new URLSearchParams();

    if (isObject(data)) {
        objectToInstance_recursive(data, window, result);
    }

    return result;
};

export const urlSearchParamsToObject = <T extends Record<string | number, unknown>>(
    urlSearchParams: URLSearchParams,
    window: Cypress.AUTWindow
): T => {
    return instanceToObject(urlSearchParams, window);
};

export const urlSearchParamsToJsonString = (
    urlSearchParams: URLSearchParams,
    window: Cypress.AUTWindow
) => JSON.stringify(urlSearchParamsToObject(urlSearchParams, window), createReplacer(window));
