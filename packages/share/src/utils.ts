export const createMatcher =
    (subject: Record<string, string | number>, strictMatch = false) =>
    (query: Record<string, string | number>) =>
        Object.keys(subject).every((key) => key in query && query[key] === subject[key])
            ? strictMatch
                ? Object.keys(query).every((key) => key in subject && query[key] === subject[key])
                : true
            : false;

export const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && !Array.isArray(val) && val !== null;

export const fireRequest = () => cy.get("#fire_request").click();

export const toRegExp = (value: string) => value.replace(/\//g, "\\/").replace(/\./g, "\\.");
