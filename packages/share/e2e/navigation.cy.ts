const BASE_URL = "http://localhost:3001";

interface NavigationRef {
    url: URL;
}

describe("Navigation bug", () => {
    const navigate = (navigateUrl: string, ref: NavigationRef, type: "xhr" | "fetch") => {
        cy.window().then((win: Cypress.AUTWindow & { __navigation_value__?: string }) => {
            win.__navigation_value__ = navigateUrl;

            cy.wait(500);

            cy.get(`button[data-testid="navigate-${type}"]`)
                .click()
                .then(() => {
                    const newUrl = new URL(navigateUrl, ref.url);

                    // expect the url should change correctly
                    cy.get("#navigation-value").should("have.text", newUrl.toString());

                    ref.url = newUrl;
                });
        });
    };

    const navigationTest = (ref: NavigationRef, type: "xhr" | "fetch") => {
        navigate("./page.html", ref, type); // public/page.html
        navigate("./folder/test.html", ref, type); // /public/folder/test.html
        navigate("../prev.html", ref, type); // /public/prev.html
        navigate("./same.html", ref, type); // /public/same.html
        navigate("../pop.html", ref, type); // /pop.html
        navigate("./nav.html", ref, type); // /nav.html
        navigate("./dir/login.html", ref, type); // /dir/login.html
        navigate("./deep/nested/folder/index.html", ref, type); // /dir/deep/nested/folder/index.html
        navigate("../components/header.html", ref, type); // /dir/deep/nested/components/header.html
        navigate("./assets/images/gallery.html", ref, type); // /dir/deep/nested/components/assets/images/gallery.html
        navigate("../sidebar/menu.html", ref, type); // /dir/deep/nested/components/assets/sidebar/menu.html

        navigate("./utils/helpers/format.html", ref, type); // /dir/deep/sidebar/utils/helpers/format.html
        navigate("../config/settings.html", ref, type); // /dir/deep/config/settings.html
        navigate("./pages/about/team.html", ref, type); // /dir/deep/config/pages/about/team.html
        navigate("../../dashboard.html", ref, type); // /dir/dashboard.html
        navigate("./modules/auth/login/form.html", ref, type); // /dir/modules/auth/login/form.html
        navigate("../admin/panel.html", ref, type); // /dir/admin/panel.html
        navigate("./features/search/results.html", ref, type); // /dir/admin/features/search/results.html
        navigate("../layouts/main.html", ref, type); // /dir/layouts/main.html
        navigate("./api/users/profile.html", ref, type); // /dir/layouts/api/users/profile.html
        navigate("../../styles/theme.html", ref, type); // /dir/styles/theme.html
        navigate("./services/data/fetch.html", ref, type); // /dir/styles/services/data/fetch.html
    };

    const startUrl = `${BASE_URL}/public/navigation.html`;

    it("should navigate to the correct page with fetch", () => {
        const ref = {
            url: new URL(startUrl)
        };

        cy.visit(ref.url.toString());

        navigationTest(ref, "fetch");
    });

    it("should navigate to the correct page with xhr", () => {
        const ref = {
            url: new URL(startUrl)
        };

        cy.visit(ref.url.toString());

        navigationTest(ref, "xhr");
    });

    // there were issues with skiping tests so this test will be always skipped
    it.skip("should navigate to the correct page", () => {
        const ref = {
            // url: new URL(`${BASE_URL}/public/navigation.html`)
            url: new URL(`${BASE_URL}/dir/deep/nested/components/assets/images/gallery.html`)
        };

        cy.visit(ref.url.toString());

        navigate("./page.html", ref, "fetch"); // public/page.html
    });
});
