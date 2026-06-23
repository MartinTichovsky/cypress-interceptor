/// <reference types="cypress" preserve="true" />

import {
    FileNameMaxLength,
    FileNameMaxLengthObject,
    GetFilePathOptions
} from "./utils.cypress.types";

/**
 * Get the file name from the current test
 *
 * @param maxLength Cut the describe (title) section and/or the test name to a maximal length
 * @returns The file name from the current test, the result will be:
 *    `fileName.extension [description] it`
 * or if no description, just:
 *    `fileName.extension it`
 */
export const getFileNameFromCurrentTest = (maxLength?: FileNameMaxLengthObject) => {
    const titlePath = Cypress.currentTest.titlePath;

    if (titlePath.length > 1) {
        let describe = titlePath
            .slice(0, -1)
            .map((title) => `[${normalizeFileName(title)}]`)
            .join(" ");

        if (maxLength?.describe !== undefined) {
            describe = describe.slice(0, maxLength.describe);
        }

        let testName = normalizeFileName(titlePath[titlePath.length - 1]);

        if (maxLength?.testName !== undefined) {
            testName = testName.slice(0, maxLength.testName);
        }

        return `${describe} ${testName}`;
    }

    return titlePath[0];
};

export const getFilePath = ({
    extension = "json",
    fileName,
    maxLength,
    outputDir,
    type
}: GetFilePathOptions) => {
    let normalizedOutputDir = outputDir;

    if (normalizedOutputDir && !normalizedOutputDir.endsWith("/")) {
        normalizedOutputDir += "/";
    }

    return maxLengthFileName(
        `${normalizedOutputDir}${fileName ? fileName : getNormalizedFileNameFromCurrentTest(maxLength)}`,
        `.${type ? `${type}.` : ""}${extension}`
    );
};

export const getNormalizedFileNameFromCurrentTest = (maxLength?: FileNameMaxLength) => {
    const filePath = Cypress.spec.relative.replace(/^(cypress\\e2e\\)|(cypress\/e2e\/)/i, "");

    if (typeof maxLength === "object") {
        return `${filePath} ${getFileNameFromCurrentTest(maxLength)}`;
    }

    const result = `${filePath} ${getFileNameFromCurrentTest()}`;

    return typeof maxLength === "number" ? result.slice(0, maxLength) : result;
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
