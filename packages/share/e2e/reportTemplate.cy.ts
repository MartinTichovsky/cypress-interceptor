import { validateReportTemplate } from "../src/validateReportTemplate";

describe("Report Template", () => {
    beforeEach(() => {
        cy.task("clearFixtures");
    });

    it("Should render single report template", () => {
        cy.task<string>("createReportFromFile").then((htmlName) => {
            cy.visit(`/fixtures/${htmlName}`);

            validateReportTemplate();
        });
    });

    it("Should render single report with custom name", () => {
        const customName = "custom-name";

        cy.task<string>("createReportFromFile", customName).then(() => {
            cy.visit(`/fixtures/${customName}.html`);

            validateReportTemplate();
        });
    });

    it("Should render report from folder", () => {
        cy.task<string[]>("createReportFromFolder").then((htmlNames) => {
            htmlNames.forEach((htmlName) => {
                cy.visit(`/fixtures/${htmlName}`);

                validateReportTemplate();
            });
        });
    });
});
