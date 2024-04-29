export const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && !Array.isArray(val) && val !== null;

export const fireRequest = () => cy.get("#fire_request").click();

export const toRegExp = (value: string) => value.replace(/\//g, "\\/").replace(/\./g, "\\.");
