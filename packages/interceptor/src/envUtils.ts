const isNodeEnvironment = () =>
    typeof process !== "undefined" && process.versions != null && process.versions.node != null;

const isCypressEnvironment = () => typeof cy !== "undefined" && typeof Cypress !== "undefined";

export const getFs = () => {
    const requireFn = eval("require");

    return requireFn("fs") as typeof import("fs");
};

export const getPath = () => {
    const requireFn = eval("require");

    return requireFn("path") as typeof import("path");
};

export const writeFileSync = (
    filePath: string,
    data: string,
    writeOptions?: Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>
) => {
    if (isNodeEnvironment()) {
        const fs = getFs();
        const path = getPath();

        // Ensure directory exists
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, data, "utf8");
    } else if (isCypressEnvironment()) {
        cy.writeFile(filePath, data, writeOptions);
    } else {
        throw new Error("File system operations not available");
    }
};
