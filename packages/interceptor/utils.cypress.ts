/// <reference types="cypress" preserve="true" />

export const getFileNameFromCurrentTest = () => {
    const currentTest = Cypress.currentTest;
    const filePath = Cypress.spec.relative.replace(/^(cypress\\(\w+)\\)|(cypress\/(\w+)\/)/i, "");

    return `${normalizeFileName(filePath)} (${normalizeFileName(
        currentTest.titlePath.length ? currentTest.titlePath.join(" - ") : currentTest.title
    )})`;
};

export const getFilePath = (fileName: string | undefined, outputDir: string, type: string) => {
    if (outputDir && !outputDir.endsWith("/")) {
        outputDir += "/";
    }

    return maxLengthFileName(
        `${outputDir}${fileName ? fileName : getFileNameFromCurrentTest()}`,
        `.${type}.json`
    );
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
