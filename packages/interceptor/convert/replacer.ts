import { blobToObject, fileToObject } from "./common";

export const createReplacer = (window: Cypress.AUTWindow) => (_: string, value: unknown) => {
    if (typeof value === "bigint") {
        return `${String(value)}n`;
    }

    if (value === Infinity) {
        return "Infinity";
    }

    if (value === -Infinity) {
        return "-Infinity";
    }

    if (
        typeof value === "function" ||
        typeof value === "symbol" ||
        value instanceof window.RegExp
    ) {
        return String(value);
    }

    if (value instanceof window.File) {
        return fileToObject(value);
    }

    if (value instanceof window.Blob) {
        return blobToObject(value);
    }

    if (value instanceof window.Map) {
        return Object.fromEntries(value);
    }

    if (value instanceof window.Set) {
        return Array.from(value);
    }

    return value;
};
