/// <reference types="cypress" preserve="true" />

/**
 * Get the file name from the current test
 *
 * @returns The file name from the current test, the result will be:
 *    `fileName.extension [description] it`
 * or if no description, just:
 *    `fileName.extension it`
 */
export const getFileNameFromCurrentTest = () => {
    const titlePath = Cypress.currentTest.titlePath;

    if (titlePath.length > 1) {
        return `${titlePath
            .slice(0, -1)
            .map((title) => `[${normalizeFileName(title)}]`)
            .join(" ")} ${normalizeFileName(titlePath[titlePath.length - 1])}`;
    }

    return titlePath[0];
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
    const filePath = Cypress.spec.relative.replace(/^(cypress\\e2e\\)|(cypress\/e2e\/)/i, "");

    return `${filePath} ${getFileNameFromCurrentTest()}`;
};

export const maxLengthFileName = (fileName: string, extension: string) => {
    const maxLength = 255;

    return `${fileName.slice(0, maxLength - extension.length)}${extension}`;
};

export const normalizeFileName = (fileName: string) =>
    fileName
        .replace(/[^a-zA-Z0-9_\-.() ]/gi, "")
        .replace(/(-)+/g, "-")
        .replace(/( )+/g, " ")
        .replace(/[- ]{4}/g, "");
