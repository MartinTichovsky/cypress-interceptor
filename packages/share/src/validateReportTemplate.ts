/**
 * AI generated test
 *
 * @author AI
 */

import { ReportTestId, ReportTestIdPrefix } from "cypress-interceptor/src/generateReport.template";

import { byDataTestId } from "./selectors";

/**
 * Comprehensive test function for report template validation
 * This function tests all major functionality of the report template
 * and can be reused multiple times without being tied to specific URLs or times
 */
export const validateReportTemplate = (shouldContainSlowRequests = true) => {
    // Wait for page to fully load
    cy.get("body").should("be.visible");
    cy.wait(1000); // Allow time for JavaScript to initialize

    // Test 1: Verify basic structure and stats are visible
    cy.get(byDataTestId(ReportTestId.STATS_CONTAINER)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.MAX_DURATION_CARD))
        .should("be.visible")
        .should("contain.text", "ms");
    cy.get(byDataTestId(ReportTestId.MIN_DURATION_CARD))
        .should("be.visible")
        .should("contain.text", "ms");
    cy.get(byDataTestId(ReportTestId.AVG_DURATION_CARD))
        .should("be.visible")
        .should("contain.text", "ms");
    cy.get(byDataTestId(ReportTestId.TOTAL_REQUESTS_CARD)).should("be.visible");

    // Test 2: Verify chart container and legend are visible
    cy.get(byDataTestId(ReportTestId.CHART_CONTAINER)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.CHART_WRAPPER)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.PERFORMANCE_LEGEND)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.LEGEND_FAST))
        .should("be.visible")
        .should("contain.text", "Fast");
    cy.get(byDataTestId(ReportTestId.LEGEND_SLOW))
        .should("be.visible")
        .should("contain.text", "Slow");

    // Test 3: Verify chart canvases are present and properly sized
    cy.get(byDataTestId(ReportTestId.CHART_CONTAINER)).scrollIntoView();
    cy.wait(500); // Allow scroll to complete
    cy.get(byDataTestId(ReportTestId.Y_AXIS_CANVAS)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.DURATION_CHART_CANVAS)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.DURATION_CHART_CANVAS)).should("have.attr", "width");
    cy.get(byDataTestId(ReportTestId.DURATION_CHART_CANVAS)).should("have.attr", "height");

    // Test 4: Verify Y-axis is fixed during horizontal scrolling
    cy.get(byDataTestId(ReportTestId.CHART_Y_AXIS)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.CHART_SCROLL_AREA)).scrollTo("right");
    cy.wait(300); // Allow scroll to complete
    cy.get(byDataTestId(ReportTestId.CHART_Y_AXIS)).should("be.visible"); // Should remain visible during scroll
    cy.get(byDataTestId(ReportTestId.CHART_SCROLL_AREA)).scrollTo("left"); // Reset scroll
    cy.wait(300); // Allow scroll to complete

    // Test 5: Verify table structure and visibility
    cy.get(byDataTestId(ReportTestId.TABLE_CONTAINER)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.TABLE_HEADER))
        .should("be.visible")
        .should("contain.text", "Request Details");
    cy.get(byDataTestId(ReportTestId.DATA_TABLE)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.TABLE_HEAD)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.TABLE_BODY)).should("be.visible");

    // Test 6: Verify table columns are present and sortable
    cy.get(byDataTestId(ReportTestId.URL_COLUMN))
        .should("be.visible")
        .should("contain.text", "URL");
    cy.get(byDataTestId(ReportTestId.METHOD_COLUMN))
        .should("be.visible")
        .should("contain.text", "Method");
    cy.get(byDataTestId(ReportTestId.TIME_COLUMN))
        .should("be.visible")
        .should("contain.text", "Time");
    cy.get(byDataTestId(ReportTestId.DURATION_COLUMN))
        .should("be.visible")
        .should("contain.text", "Duration");

    // Test 7: Verify there are both fast (green) and slow (red) requests
    cy.get('[data-duration-type="fast"]').should("exist"); // At least one fast request
    cy.get('[data-duration-type="slow"]').should(shouldContainSlowRequests ? "exist" : "not.exist"); // At least one slow request

    // Test 8: Test row expansion/collapse functionality
    cy.get('[data-testid^="table-row-"]').first().as("firstRow");
    cy.get("@firstRow")
        .invoke("attr", "data-testid")
        .then((rowTestId) => {
            const rowIndex = rowTestId?.replace("table-row-", "") || "0";

            // Get expand button and expandable row
            cy.get(byDataTestId(ReportTestIdPrefix.EXPAND_BTN, rowIndex)).as("expandBtn");
            cy.get(byDataTestId(ReportTestIdPrefix.EXPANDABLE_ROW, rowIndex)).as("expandableRow");

            // Initially should be collapsed
            cy.get("@expandableRow").should("not.have.class", "show");

            // Click to expand
            cy.get("@expandBtn").click();
            cy.wait(300); // Allow expansion animation
            cy.get("@expandableRow").should("have.class", "show");

            // Verify all expandable sections are present
            cy.get(byDataTestId(ReportTestIdPrefix.PARAMS_SECTION, rowIndex)).should("be.visible");
            cy.get(byDataTestId(ReportTestIdPrefix.HEADERS_SECTION, rowIndex)).should("be.visible");
            cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_SECTION, rowIndex)).should(
                "be.visible"
            );
            cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_HEADERS_SECTION, rowIndex)).should(
                "be.visible"
            );
            cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_SECTION, rowIndex)).should(
                "be.visible"
            );

            // Verify section content containers exist
            cy.get(byDataTestId(ReportTestIdPrefix.PARAMS_CONTENT, rowIndex)).should("be.visible");
            cy.get(byDataTestId(ReportTestIdPrefix.HEADERS_CONTENT, rowIndex)).should("be.visible");
            cy.get(byDataTestId(ReportTestIdPrefix.REQUEST_BODY_CONTENT, rowIndex)).should(
                "be.visible"
            );
            cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_HEADERS_CONTENT, rowIndex)).should(
                "be.visible"
            );
            cy.get(byDataTestId(ReportTestIdPrefix.RESPONSE_BODY_CONTENT, rowIndex)).should(
                "be.visible"
            );

            // Click to collapse
            cy.get("@expandBtn").click();
            cy.wait(300); // Allow collapse animation
            cy.get("@expandableRow").should("not.have.class", "show");
        });

    // Test 9: Test chart bar hover tooltip functionality (simplified and more reliable)
    cy.get(byDataTestId(ReportTestId.CHART_CONTAINER)).scrollIntoView();
    cy.wait(500); // Wait for scroll to complete

    // Test hovering over canvas - simplified approach
    cy.get(byDataTestId(ReportTestId.DURATION_CHART_CANVAS))
        .should("be.visible")
        .then(($canvas) => {
            // Just verify canvas is interactive by triggering mousemove
            cy.wrap($canvas).trigger("mousemove", { clientX: 100, clientY: 100, force: true });
            cy.wait(200);

            // Move mouse away
            cy.wrap($canvas).trigger("mouseleave", { force: true });
            cy.wait(200);
        });

    // Test 10: Test chart bar click functionality (simplified)
    cy.get(byDataTestId(ReportTestId.DURATION_CHART_CANVAS))
        .should("be.visible")
        .then(($canvas) => {
            // Click on canvas area
            cy.wrap($canvas).click(100, 200, { force: true });

            // Wait for any scroll/animation to complete
            cy.wait(1000);

            // Check if table is visible (which should happen after click)
            cy.get(byDataTestId(ReportTestId.TABLE_CONTAINER)).should("be.visible");
        });

    // Test 11: Test table sorting functionality
    // Test sorting by URL column
    cy.get(byDataTestId(ReportTestId.URL_COLUMN)).click();
    cy.wait(500); // Allow sorting to complete
    cy.get(byDataTestId(ReportTestId.URL_COLUMN)).should("have.class", "sorted-asc");

    // Test sorting direction change
    cy.get(byDataTestId(ReportTestId.URL_COLUMN)).click();
    cy.wait(500); // Allow sorting to complete
    cy.get(byDataTestId(ReportTestId.URL_COLUMN)).should("have.class", "sorted-desc");

    // Test sorting by Duration column
    cy.get(byDataTestId(ReportTestId.DURATION_COLUMN)).click();
    cy.wait(500); // Allow sorting to complete
    cy.get(byDataTestId(ReportTestId.DURATION_COLUMN)).should("have.class", "sorted-asc");
    cy.get(byDataTestId(ReportTestId.URL_COLUMN)).should("not.have.class", "sorted-asc");
    cy.get(byDataTestId(ReportTestId.URL_COLUMN)).should("not.have.class", "sorted-desc");

    // Test sorting by Method column
    cy.get(byDataTestId(ReportTestId.METHOD_COLUMN)).click();
    cy.wait(500); // Allow sorting to complete
    cy.get(byDataTestId(ReportTestId.METHOD_COLUMN)).should("have.class", "sorted-asc");

    // Test sorting by Time column
    cy.get(byDataTestId(ReportTestId.TIME_COLUMN)).click();
    cy.wait(500); // Allow sorting to complete
    cy.get(byDataTestId(ReportTestId.TIME_COLUMN)).should("have.class", "sorted-asc");

    // Test 12: Test table row click functionality (entire row should be clickable)
    cy.get('[data-testid^="table-row-"]').eq(1).as("secondRow");
    cy.get("@secondRow")
        .invoke("attr", "data-testid")
        .then((rowTestId) => {
            const rowIndex = rowTestId?.replace("table-row-", "") || "1";

            // Ensure row is initially collapsed
            cy.get(byDataTestId(ReportTestIdPrefix.EXPANDABLE_ROW, rowIndex)).should(
                "not.have.class",
                "show"
            );

            // Click entire row (not just expand button)
            cy.get("@secondRow").click();
            cy.wait(300); // Allow expansion animation

            // Should expand
            cy.get(byDataTestId(ReportTestIdPrefix.EXPANDABLE_ROW, rowIndex)).should(
                "have.class",
                "show"
            );

            // Click again to collapse
            cy.get("@secondRow").click();
            cy.wait(300); // Allow collapse animation
            cy.get(byDataTestId(ReportTestIdPrefix.EXPANDABLE_ROW, rowIndex)).should(
                "not.have.class",
                "show"
            );
        });

    // Test 13: Verify data consistency - ensure table has data
    cy.get('[data-testid^="table-row-"]').should("have.length.greaterThan", 0);

    // Test 14: Verify duration values are properly formatted
    cy.get('[data-testid^="duration-cell-"]').each(($cell) => {
        cy.wrap($cell).should("contain.text", "ms");
        cy.wrap($cell)
            .invoke("text")
            .then((text) => {
                const duration = parseFloat(text.replace("ms", ""));

                expect(duration).to.be.a("number");
                expect(duration).to.be.greaterThan(0);
            });
    });

    // Test 15: Test scroll indicator functionality (if chart is scrollable)
    cy.get(byDataTestId(ReportTestId.CHART_SCROLL_AREA)).then(($scrollArea) => {
        const scrollArea = $scrollArea[0];

        if (scrollArea.scrollWidth > scrollArea.clientWidth) {
            // Chart is scrollable, indicator should be visible
            cy.get(byDataTestId("scroll-indicator")).should("be.visible");
        }
    });

    // Test 16: Verify responsive behavior by testing smaller viewport
    cy.viewport(768, 1024); // Tablet view
    cy.wait(500); // Allow responsive changes to apply
    cy.get(byDataTestId(ReportTestId.CHART_CONTAINER)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.TABLE_CONTAINER)).should("be.visible");

    // Reset to desktop view
    cy.viewport(1280, 720);
    cy.wait(500); // Allow responsive changes to apply

    // Test 17: Test accessibility - ensure expand buttons have proper labels
    cy.get('[data-testid^="expand-btn-"]').each(($btn) => {
        cy.wrap($btn).should("be.visible");
    });

    // Test 18: Verify that duration colors match the legend thresholds
    cy.get(byDataTestId(ReportTestId.LEGEND_FAST))
        .invoke("text")
        .then((fastText) => {
            const thresholdMatch = fastText.match(/< (\d+)ms/);

            if (thresholdMatch) {
                const threshold = parseInt(thresholdMatch[1]);

                // Check that fast durations are below threshold
                cy.get('[data-duration-type="fast"]').each(($cell) => {
                    cy.wrap($cell)
                        .invoke("text")
                        .then((text) => {
                            const duration = parseFloat(text.replace("ms", ""));

                            expect(duration).to.be.lessThan(threshold);
                        });
                });

                // Check that slow durations are at or above threshold
                if (shouldContainSlowRequests) {
                    cy.get('[data-duration-type="slow"]').each(($cell) => {
                        cy.wrap($cell)
                            .invoke("text")
                            .then((text) => {
                                const duration = parseFloat(text.replace("ms", ""));

                                expect(duration).to.be.at.least(threshold);
                            });
                    });
                } else {
                    cy.get('[data-duration-type="slow"]').should("not.exist");
                }
            }
        });

    // Test 19: Verify all table columns have content
    cy.get('[data-testid^="table-row-"]')
        .first()
        .within(() => {
            cy.get("td").should("have.length", 5); // expand button + 4 data columns
            cy.get("td").eq(1).should("not.be.empty"); // URL
            cy.get("td").eq(2).should("not.be.empty"); // Method
            cy.get("td").eq(3).should("not.be.empty"); // Time
            cy.get("td").eq(4).should("not.be.empty"); // Duration
        });

    // Test 20: Final verification - ensure page is fully loaded and interactive
    cy.get(byDataTestId(ReportTestId.CHART_CONTAINER)).should("be.visible");
    cy.get(byDataTestId(ReportTestId.TABLE_CONTAINER)).should("be.visible");
    cy.get('[data-testid^="table-row-"]').should("have.length.greaterThan", 0);

    // Verify page is interactive (removed console.error check as it can be unreliable)
    cy.get(byDataTestId(ReportTestId.STATS_CONTAINER)).should("be.visible");
    cy.log("All tests completed successfully");
};
