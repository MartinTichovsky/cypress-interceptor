import { getFilePath } from "cypress-interceptor/src/utils.cypress";

const titleDescribe1 = "Path test 1";
const titleDescribe2 = "Path test 2";
const titleIt1 = "Inner test 1";
const titleIt2 = "Inner test 2";
const titleIt3 = "Inner test 3";

describe(titleDescribe1, () => {
    it(titleIt1, () => {
        const outputDir = "output/dir";

        expect(getFilePath(undefined, "").replace(/\\/g, "/")).to.equal(
            `path-test/inner-dir/path.cy.ts [${titleDescribe1}] ${titleIt1}.json`
        );
        expect(getFilePath(undefined, outputDir).replace(/\\/g, "/")).to.equal(
            `${outputDir}/path-test/inner-dir/path.cy.ts [${titleDescribe1}] ${titleIt1}.json`
        );
    });

    describe(titleDescribe2, () => {
        it(titleIt2, () => {
            expect(getFilePath(undefined, "").replace(/\\/g, "/")).to.equal(
                `path-test/inner-dir/path.cy.ts [${titleDescribe1}] [${titleDescribe2}] ${titleIt2}.json`
            );
        });
    });
});

it(titleIt3, () => {
    expect(getFilePath(undefined, "").replace(/\\/g, "/")).to.equal(
        `path-test/inner-dir/path.cy.ts ${titleIt3}.json`
    );
});
