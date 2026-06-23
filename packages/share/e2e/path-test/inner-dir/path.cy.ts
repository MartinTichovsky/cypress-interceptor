import { getFilePath } from "cypress-interceptor/src/utils.cypress";

const titleDescribe1 = "Path test 1";
const titleDescribe2 = "Path test 2";
const titleIt1 = "Inner test 1";
const titleIt2 = "Inner test 2";
const titleIt3 = "Inner test 3";

const specPath = "path-test/inner-dir/path.cy.ts";

describe(titleDescribe1, () => {
    it(titleIt1, () => {
        const outputDir = "output/dir";

        const normalized = `${specPath} [${titleDescribe1}] ${titleIt1}`;

        expect(getFilePath({ outputDir: "" }).replace(/\\/g, "/")).to.equal(`${normalized}.json`);
        expect(getFilePath({ outputDir }).replace(/\\/g, "/")).to.equal(
            `${outputDir}/${normalized}.json`
        );

        // maxLength as a number cuts the whole generated name
        expect(getFilePath({ outputDir: "", maxLength: 20 }).replace(/\\/g, "/")).to.equal(
            `${normalized.slice(0, 20)}.json`
        );

        // maxLength as an object cuts the describe section and the test name separately
        const describeSection = `[${titleDescribe1}]`;

        expect(
            getFilePath({ outputDir: "", maxLength: { describe: 6, testName: 5 } }).replace(
                /\\/g,
                "/"
            )
        ).to.equal(`${specPath} ${describeSection.slice(0, 6)} ${titleIt1.slice(0, 5)}.json`);

        // only the describe is cut
        expect(
            getFilePath({ outputDir: "", maxLength: { describe: 6 } }).replace(/\\/g, "/")
        ).to.equal(`${specPath} ${describeSection.slice(0, 6)} ${titleIt1}.json`);

        // only the test name is cut
        expect(
            getFilePath({ outputDir: "", maxLength: { testName: 5 } }).replace(/\\/g, "/")
        ).to.equal(`${specPath} ${describeSection} ${titleIt1.slice(0, 5)}.json`);
    });

    describe(titleDescribe2, () => {
        it(titleIt2, () => {
            expect(getFilePath({ outputDir: "" }).replace(/\\/g, "/")).to.equal(
                `${specPath} [${titleDescribe1}] [${titleDescribe2}] ${titleIt2}.json`
            );

            // the describe section is the joined describe titles
            const describeSection = `[${titleDescribe1}] [${titleDescribe2}]`;

            expect(
                getFilePath({ outputDir: "", maxLength: { describe: 15, testName: 5 } }).replace(
                    /\\/g,
                    "/"
                )
            ).to.equal(`${specPath} ${describeSection.slice(0, 15)} ${titleIt2.slice(0, 5)}.json`);
        });
    });
});

it(titleIt3, () => {
    expect(getFilePath({ outputDir: "" }).replace(/\\/g, "/")).to.equal(
        `${specPath} ${titleIt3}.json`
    );
});
