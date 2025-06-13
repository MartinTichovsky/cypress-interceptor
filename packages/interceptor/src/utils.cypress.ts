/// <reference types="cypress" preserve="true" />

export const getFileNameFromCurrentTest = () => {
    const currentTest = Cypress.currentTest;

    return currentTest.titlePath.length ? currentTest.titlePath.join(" - ") : currentTest.title;
};

export const getFilePath = (
    fileName: string | undefined,
    outputDir: string,
    type?: string,
    extension = "json"
) => {
    if (outputDir && !outputDir.endsWith("/")) {
        outputDir += "/";
    }

    return maxLengthFileName(
        `${outputDir}${fileName ? fileName : getNormalizedFileNameFromCurrentTest()}`,
        `.${type ? `${type}.` : ""}${extension}`
    );
};

export const getNormalizedFileNameFromCurrentTest = () => {
    const filePath = Cypress.spec.relative.replace(/^(cypress\\(\w+)\\)|(cypress\/(\w+)\/)/i, "");

    return `${normalizeFileName(filePath)} (${normalizeFileName(getFileNameFromCurrentTest())})`;
};

export const maxLengthFileName = (fileName: string, extension: string) => {
    const maxLength = 255;

    return `${fileName.slice(0, maxLength - extension.length)}${extension}`;
};

export const normalizeFileName = (fileName: string) =>
    fileName
        .replace(/[^a-zA-Z0-9_\-. ]/gi, "-")
        .replace(/(-)+/g, "-")
        .replace(/( )+/g, " ")
        .replace(/[- ]{4}/g, "");
