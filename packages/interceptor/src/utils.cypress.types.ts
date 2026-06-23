/**
 * Cut the generated file name to a maximal length.
 *
 *  - `describe` cuts the describe (title) section
 *  - `testName` cuts the test name (the rest)
 */
export interface FileNameMaxLengthObject {
    /**
     * Cut the describe (title) section to this length
     */
    describe?: number;
    /**
     * Cut the test name (the rest) to this length
     */
    testName?: number;
}

/**
 * The maximal length of the generated file name.
 *
 * It can be a `number` which will cut the whole generated name (the result of
 * `getNormalizedFileNameFromCurrentTest`).
 *
 * It can also be an object where `describe` cuts the describe (title) section and
 * `testName` cuts the test name (the rest).
 */
export type FileNameMaxLength = number | FileNameMaxLengthObject;

/**
 * Options for the `getFilePath` function
 */
export interface GetFilePathOptions {
    /**
     * The extension of the file (without the leading dot), `json` by default
     */
    extension?: string;
    /**
     * The name of the file. If `undefined`, it will be generated from the running test.
     */
    fileName?: string;
    /**
     * The maximal length of the generated file name. Has no effect when `fileName` is provided.
     */
    maxLength?: FileNameMaxLength;
    /**
     * The path for the output folder
     */
    outputDir: string;
    /**
     * The type of the file, it will be added before the extension (`<name>.<type>.<extension>`)
     */
    type?: string;
}
