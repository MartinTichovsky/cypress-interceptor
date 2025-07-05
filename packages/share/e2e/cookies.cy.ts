import { objectToURLSearchParams } from "cypress-interceptor/convert/formData";
import { SERVER_URL } from "cypress-interceptor-server/src/resources/constants";

describe("Cookies: XHR and fetch", () => {
    const endpoint = SERVER_URL.Cookies;

    beforeEach(() => {
        cy.clearCookies();
    });

    it("sets cookie via XHR", () => {
        const cookieName = "testCookie-cy-request";
        const cookieValue = "hello-cy-request";

        const searchParams = objectToURLSearchParams({ cookieName, cookieValue }, window);
        const url = new URL(endpoint, window.location.origin);

        url.search = searchParams.toString();

        cy.request(url.toString()).then(() => {
            cy.getCookie(cookieName).should("exist").and("have.property", "value", cookieValue);
        });
    });

    it("sets cookie via fetch", () => {
        const cookieName = "testCookie-cy-fetch";
        const cookieValue = "hello-cy-fetch";

        cy.visit("/");

        cy.window().then((win) => {
            const searchParams = objectToURLSearchParams({ cookieName, cookieValue }, win);
            const url = new URL(endpoint, window.location.origin);

            url.search = searchParams.toString();

            return win.fetch(url, {
                method: "GET",
                credentials: "include"
            });
        });

        cy.getCookie(cookieName).should("exist").and("have.property", "value", cookieValue);
    });

    it("sets cookie via XHR (XMLHttpRequest)", () => {
        const cookieName = "testCookie-cy-xhr";
        const cookieValue = "hello-cy-xhr";

        cy.visit("/");

        cy.window().then((win) => {
            const searchParams = objectToURLSearchParams({ cookieName, cookieValue }, win);
            const url = new URL(endpoint, window.location.origin);

            url.search = searchParams.toString();

            return new Promise((resolve) => {
                const xhr = new win.XMLHttpRequest();

                xhr.open("GET", url, true);
                xhr.withCredentials = true;
                xhr.onload = resolve;
                xhr.send();
            });
        });

        cy.getCookie(cookieName).should("exist").and("have.property", "value", cookieValue);
    });
});
