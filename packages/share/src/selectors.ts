export const getResponseBody = (id: string, plain = false) =>
    getLoadedSector(id)
        .find("[data-response-type=body]")
        .then(([$el]) => (plain ? $el.innerText : JSON.parse($el.innerHTML)));

export const getResponseDuration = (id: string) =>
    getLoadedSector(id)
        .find("[data-response-type=duration]")
        .then(([$el]) => parseInt($el.innerText));

export const getResponseHeaders = (id: string) =>
    getLoadedSector(id)
        .find("[data-response-type=headers]")
        .then(([$el]) => JSON.parse($el.innerHTML));

export const getResponseStatus = (id: string) =>
    getLoadedSector(id)
        .find("[data-response-type=status-code]")
        .then(([$el]) => parseInt($el.innerText));

export const getLoadedSector = (id: string) =>
    cy.get(`section#${id.replace(/\//g, "\\/").replace(/\./g, "\\.").replace(/:/g, "\\:")}_loaded`);
