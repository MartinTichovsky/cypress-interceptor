/**
 * AI generated, updated
 */

import { ReportTestId } from "cypress-interceptor/src/generateReport.template";

import { byDataTestId } from "./selectors";

export const checkBarColor = (columnIndex: number, expectedColor: "red" | "green") => {
    const colorMap: Record<string, [number, number, number]> = {
        red: [245, 101, 101],
        green: [72, 187, 120]
    };

    cy.window().then((_win) => {
        const win = _win as Cypress.AUTWindow & {
            getBarCoordinates: (index: number) => {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        };

        cy.get(byDataTestId(ReportTestId.DURATION_CHART_CANVAS)).then(($canvas) => {
            const canvas = $canvas[0] as HTMLCanvasElement;
            const ctx = canvas.getContext("2d");
            const { x, y, width, height } = win.getBarCoordinates(columnIndex);
            const sampleX = Math.round(x + width / 2);
            const sampleY = Math.round(y + height / 2);

            cy.wait(500);

            const pixel = ctx?.getImageData(sampleX, sampleY, 1, 1).data;
            const expected = colorMap[expectedColor];

            expected.forEach((value, i) => {
                expect(
                    pixel?.[i],
                    `The column at index ${columnIndex} should have ${expectedColor} color`
                ).to.be.closeTo(value, 20);
            });
        });
    });
};
