const isNodeEnvironment = () =>
    typeof process !== "undefined" && process.versions != null && process.versions.node != null;

const isCypressEnvironment = () => typeof cy !== "undefined" && typeof Cypress !== "undefined";

type CypressExposeFn = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T = any>(key: string): T;
    (key: string, value: unknown): void;
};

/**
 * Version-safe access to public Cypress configuration values.
 *
 * Cypress v15.10.0+ introduces `Cypress.expose()` as the replacement for the now
 * deprecated `Cypress.env()`. To keep a single codebase working across both old
 * and new Cypress versions, this helper uses `Cypress.expose()` when it is
 * available and transparently falls back to `Cypress.env()` on older versions.
 *
 * The signatures of `Cypress.expose()` and `Cypress.env()` match, so it can be
 * used both to read (`cypressExpose(key)`) and to write (`cypressExpose(key, value)`).
 */
export const cypressExpose: CypressExposeFn = ((key: string, ...rest: [unknown?]) => {
    const cypress = Cypress as typeof Cypress & { expose?: CypressExposeFn };

    if (typeof cypress.expose === "function") {
        return (cypress.expose as (key: string, ...rest: [unknown?]) => unknown)(key, ...rest);
    }

    return (Cypress.env as (key: string, ...rest: [unknown?]) => unknown)(key, ...rest);
}) as CypressExposeFn;

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
