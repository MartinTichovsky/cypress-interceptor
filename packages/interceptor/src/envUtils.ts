const isNodeEnvironment = (): boolean => {
    try {
        return (
            typeof process !== "undefined" &&
            process.versions != null &&
            process.versions.node != null
        );
    } catch {
        return false;
    }
};

const isCypressEnvironment = (): boolean => {
    try {
        return typeof cy !== "undefined" && typeof Cypress !== "undefined";
    } catch {
        return false;
    }
};

export const getFs = () => {
    const requireFn = eval("require");
    return requireFn("fs") as typeof import("fs");
};

export const getPath = () => {
    const requireFn = eval("require");
    return requireFn("path") as typeof import("path");
};

export const writeFileSync = (filePath: string, data: string) => {
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
        cy.writeFile(filePath, data);
    } else {
        throw new Error("File system operations not available");
    }
};
