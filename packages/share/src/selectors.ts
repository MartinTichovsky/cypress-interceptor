export const getResponseBody = (id: string, isFetch = true) =>
    getLoadedSector(id, isFetch)
        .find("[data-response-type=body]")
        .then(([$el]) => {
            try {
                return JSON.parse($el.innerHTML);
            } catch {
                return undefined;
            }
        });

export const getResponseDuration = (id: string, isFetch = true) =>
    getLoadedSector(id, isFetch)
        .find("[data-response-type=duration]")
        .then(([$el]) => parseInt($el.innerText));

export const getResponseHeaders = (id: string, isFetch = true) =>
    getLoadedSector(id, isFetch)
        .find("[data-response-type=headers]")
        .then(([$el]) => {
            try {
                return JSON.parse($el.innerHTML);
            } catch {
                return undefined;
            }
        });

export const getResponseStatus = (id: string, isFetch = true) =>
    getLoadedSector(id, isFetch)
        .find("[data-response-type=status-code]")
        .then(([$el]) => parseInt($el.innerText));

export const getLoadedSector = (id: string, isFetch = true) =>
    cy.get(
        `section#${id.replace(/\//g, "\\/").replace(/\./g, "\\.").replace(/:/g, "\\:")}${isFetch ? "_loaded" : ""}`
    );
