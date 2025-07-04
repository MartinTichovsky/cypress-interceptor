import "cypress-interceptor/test.unit.commands";

import { getFilePath } from "cypress-interceptor/src/utils.cypress";
import { lineCalled, lineCalledWithClone } from "cypress-interceptor/test.unit";
import {
    disableCallLine,
    enableCallLine,
    getCallLine,
    isCallLineEnabled
} from "cypress-interceptor/test.unit.internal";
import { CallLineStack } from "cypress-interceptor/test.unit.types";

import { OUTPUT_DIR } from "../src/constants";
import { wrap } from "../src/utils";

function createOutputFileName(outputDir: string, fileName?: string) {
    const type = "callLine";

    return fileName
        ? `${outputDir}/${fileName}.${type}.json`
        : getFilePath(undefined, outputDir, type);
}

const outputDir = `${OUTPUT_DIR}/${Cypress.spec.name}`;

describe("test.unit", () => {
    beforeEach(() => {
        cy.callLineEnable();
        cy.task("clearLogs", [outputDir]);
    });

    /**
     * This test is synchronous so do not use any chainable or commands.
     */
    it("test.unit", () => {
        // disable call line
        disableCallLine();

        lineCalled("this");
        lineCalledWithClone("this");

        expect(isCallLineEnabled()).to.be.false;

        lineCalled("123");
        lineCalledWithClone("123");

        expect(isCallLineEnabled()).to.be.false;

        expect(getCallLine().current).to.be.undefined;
        expect(getCallLine().isEnabled).to.be.false;
        expect(getCallLine().length).to.eq(0);
        expect(getCallLine().next).to.be.undefined;
        expect(getCallLine().next).to.be.undefined;

        // enabled

        enableCallLine();

        const callLine1 = "this line has been called";

        lineCalled(callLine1);

        expect(getCallLine().isEnabled).to.be.true;
        expect(getCallLine().length).to.eq(1);

        expect(getCallLine().current).to.be.undefined;
        expect(getCallLine().next).to.eq(callLine1);
        expect(getCallLine().current).to.eq(callLine1);
        expect(getCallLine().next).to.be.undefined;
        expect(getCallLine().current).to.eq(callLine1);

        getCallLine().reset();

        expect(getCallLine().array.map((entry) => entry.args)).to.deep.eq([[callLine1]]);

        const callLine2 = "321";

        lineCalled(callLine2);

        expect(getCallLine().array.map((entry) => entry.args)).to.deep.eq([
            [callLine1],
            [callLine2]
        ]);

        expect(getCallLine().isEnabled).to.be.true;
        expect(getCallLine().length).to.eq(2);

        expect(getCallLine().current).to.be.undefined;
        expect(getCallLine().next).to.eq(callLine1);
        expect(getCallLine().current).to.eq(callLine1);
        expect(getCallLine().next).to.eq(callLine2);
        expect(getCallLine().current).to.eq(callLine2);
        expect(getCallLine().next).to.be.undefined;
        expect(getCallLine().current).to.eq(callLine2);
        expect(getCallLine().next).to.be.undefined;

        const callLine3 = "--";

        lineCalled(callLine3);

        expect(getCallLine().array.map((entry) => entry.args)).to.deep.eq([
            [callLine1],
            [callLine2],
            [callLine3]
        ]);

        expect(getCallLine().isEnabled).to.be.true;
        expect(getCallLine().length).to.eq(3);

        expect(getCallLine().current).to.eq(callLine2);
        expect(getCallLine().next).to.eq(callLine3);
        expect(getCallLine().current).to.eq(callLine3);
        expect(getCallLine().next).to.be.undefined;
        expect(getCallLine().current).to.eq(callLine3);

        getCallLine().reset();

        expect(getCallLine().array.map((entry) => entry.args)).to.deep.eq([
            [callLine1],
            [callLine2],
            [callLine3]
        ]);

        expect(getCallLine().isEnabled).to.be.true;
        expect(getCallLine().length).to.eq(3);

        expect(getCallLine().current).to.be.undefined;
        expect(getCallLine().next).to.eq(callLine1);
        expect(getCallLine().current).to.eq(callLine1);
        expect(getCallLine().next).to.eq(callLine2);
        expect(getCallLine().current).to.eq(callLine2);
        expect(getCallLine().next).to.eq(callLine3);
        expect(getCallLine().current).to.eq(callLine3);
        expect(getCallLine().next).to.be.undefined;
        expect(getCallLine().current).to.eq(callLine3);

        getCallLine().clean();

        expect(getCallLine().array.map((entry) => entry.args)).to.deep.eq([]);

        expect(getCallLine().current).to.be.undefined;
        expect(getCallLine().length).to.eq(0);
        expect(getCallLine().next).to.be.undefined;

        // call with multiple arguments
        const callLine4_arg1 = "arg1";
        const callLine4_arg2 = { obj: 987, arr: [9, false, null, ""] };
        const callLine4_arg3 = false;

        lineCalled(callLine4_arg1, callLine4_arg2, callLine4_arg3);

        expect(getCallLine().next).to.deep.eq([callLine4_arg1, callLine4_arg2, callLine4_arg3]);
        expect(getCallLine().current).to.deep.eq([callLine4_arg1, callLine4_arg2, callLine4_arg3]);
        expect((getCallLine().current as unknown[])[0]).to.eq(callLine4_arg1);
        expect((getCallLine().current as unknown[])[1]).to.eq(callLine4_arg2);
        expect((getCallLine().current as unknown[])[2]).to.eq(callLine4_arg3);

        // call with multiple arguments and clone
        const callLine5_arg1 = { l: "string", n: 999, b: true, a: [9, 8, [1, 2]] };
        const callLine5_arg2 = [9, 8, 7, { ea: ["y", 0, false, null] }];

        lineCalledWithClone(callLine5_arg1, callLine5_arg2);

        expect(getCallLine().next).to.deep.eq([callLine5_arg1, callLine5_arg2]);
        expect(getCallLine().current).to.deep.eq([callLine5_arg1, callLine5_arg2]);
        expect((getCallLine().current as unknown[])[0]).not.to.eq(callLine5_arg1);
        expect((getCallLine().current as unknown[])[1]).not.to.eq(callLine5_arg2);

        const callLine6 = "simple string";

        lineCalledWithClone(callLine6);

        expect(getCallLine().next).to.eq(callLine6);
    });

    it("cy.callLine in the context of the global window", () => {
        // disable call line
        cy.callLineDisable();

        wrap(() => lineCalled("this"));

        wrap(() => isCallLineEnabled()).should("be.false");

        wrap(() => lineCalled("123"));

        wrap(() => isCallLineEnabled()).should("be.false");

        cy.callLine()
            .then((callLine) => callLine.current === undefined)
            .should("be.true");
        cy.callLineCurrent().should("be.undefined");
        cy.callLine()
            .then((callLine) => callLine.current === undefined)
            .should("be.true");
        cy.callLineCurrent().should("be.undefined");
        cy.callLine()
            .then((callLine) => callLine.isEnabled)
            .should("be.false");
        cy.callLine()
            .then((callLine) => callLine.length)
            .should("eq", 0);
        cy.callLineLength().should("eq", 0);
        cy.callLine()
            .then((callLine) => callLine.next === undefined)
            .should("be.true");
        cy.callLine()
            .then((callLine) => callLine.next === undefined)
            .should("be.true");
        cy.callLineNext().should("be.undefined");

        cy.callLineClean();

        wrap(() => isCallLineEnabled()).should("be.false");

        // enabled

        wrap(() => enableCallLine());

        const callLine1 = "this line has been called";

        wrap(() => lineCalled(callLine1));

        cy.callLine()
            .then((callLine) => callLine.isEnabled)
            .should("be.true");
        cy.callLine()
            .then((callLine) => callLine.length)
            .should("eq", 1);
        cy.callLineLength().should("eq", 1);

        cy.callLineCurrent().should("be.undefined");
        cy.callLineNext().should("eq", callLine1);
        cy.callLineCurrent().should("eq", callLine1);
        cy.callLineNext().should("be.undefined");
        cy.callLineCurrent().should("eq", callLine1);

        cy.callLine().then((callLine) => callLine.reset());

        wrap(() => getCallLine().array.map((entry) => entry.args)).should("deep.equal", [
            [callLine1]
        ]);
        cy.callLine()
            .then((callLine) => callLine.array.map((entry) => entry.args))
            .should("deep.equal", [[callLine1]]);

        const callLine2 = "321";

        wrap(() => lineCalled(callLine2));

        wrap(() => getCallLine().array.map((entry) => entry.args)).should("deep.equal", [
            [callLine1],
            [callLine2]
        ]);
        cy.callLine()
            .then((callLine) => callLine.array.map((entry) => entry.args))
            .should("deep.equal", [[callLine1], [callLine2]]);

        cy.callLine()
            .then((callLine) => callLine.isEnabled)
            .should("be.true");
        cy.callLine()
            .then((callLine) => callLine.length)
            .should("eq", 2);
        cy.callLineLength().should("eq", 2);

        cy.callLineCurrent().should("be.undefined");
        cy.callLineNext().should("eq", callLine1);
        cy.callLineCurrent().should("eq", callLine1);
        cy.callLineNext().should("eq", callLine2);
        cy.callLineCurrent().should("eq", callLine2);
        cy.callLineNext().should("be.undefined");
        cy.callLineCurrent().should("eq", callLine2);
        cy.callLineNext().should("be.undefined");

        const callLine3 = "--";

        wrap(() => lineCalled(callLine3));

        wrap(() => getCallLine().array.map((entry) => entry.args)).should("deep.equal", [
            [callLine1],
            [callLine2],
            [callLine3]
        ]);
        cy.callLine()
            .then((callLine) => callLine.array.map((entry) => entry.args))
            .should("deep.equal", [[callLine1], [callLine2], [callLine3]]);

        cy.callLine()
            .then((callLine) => callLine.isEnabled)
            .should("be.true");
        cy.callLine()
            .then((callLine) => callLine.length)
            .should("eq", 3);
        cy.callLineLength().should("eq", 3);

        cy.callLineCurrent().should("eq", callLine2);
        cy.callLineNext().should("eq", callLine3);
        cy.callLineCurrent().should("eq", callLine3);
        cy.callLineNext().should("be.undefined");
        cy.callLineCurrent().should("eq", callLine3);

        cy.callLine().then((callLine) => callLine.reset());

        wrap(() => getCallLine().array.map((entry) => entry.args)).should("deep.equal", [
            [callLine1],
            [callLine2],
            [callLine3]
        ]);
        cy.callLine()
            .then((callLine) => callLine.array.map((entry) => entry.args))
            .should("deep.equal", [[callLine1], [callLine2], [callLine3]]);

        cy.callLine()
            .then((callLine) => callLine.isEnabled)
            .should("be.true");
        cy.callLine()
            .then((callLine) => callLine.length)
            .should("eq", 3);
        cy.callLineLength().should("eq", 3);

        cy.callLineCurrent().should("be.undefined");
        cy.callLineNext().should("eq", callLine1);
        cy.callLineCurrent().should("eq", callLine1);
        cy.callLineNext().should("eq", callLine2);
        cy.callLineCurrent().should("eq", callLine2);
        cy.callLineNext().should("eq", callLine3);
        cy.callLineCurrent().should("eq", callLine3);
        cy.callLineNext().should("be.undefined");
        cy.callLineCurrent().should("eq", callLine3);

        cy.callLine().then((callLine) => callLine.clean());

        wrap(() => getCallLine().array.map((entry) => entry.args)).should("deep.equal", []);
        cy.callLine()
            .then((callLine) => callLine.array.map((entry) => entry.args))
            .should("deep.equal", []);

        cy.callLine()
            .then((callLine) => callLine.isEnabled)
            .should("be.true");
        cy.callLine()
            .then((callLine) => callLine.length)
            .should("eq", 0);
        cy.callLineLength().should("eq", 0);

        cy.callLineCurrent().should("be.undefined");
        cy.callLineNext().should("be.undefined");

        // call with multiple arguments
        const callLine4_arg1 = "arg1";
        const callLine4_arg2 = { obj: 987, arr: [9, false, null, ""] };
        const callLine4_arg3 = false;

        wrap(() => lineCalled(callLine4_arg1, callLine4_arg2, callLine4_arg3));

        cy.callLineNext().should("deep.eq", [callLine4_arg1, callLine4_arg2, callLine4_arg3]);
        cy.callLineCurrent().should("deep.eq", [callLine4_arg1, callLine4_arg2, callLine4_arg3]);
        cy.callLine()
            .then((callLine) => (callLine.current as unknown[])[0])
            .should("eq", callLine4_arg1);
        cy.callLine()
            .then((callLine) => (callLine.current as unknown[])[1])
            .should("eq", callLine4_arg2);
        cy.callLine()
            .then((callLine) => (callLine.current as unknown[])[2])
            .should("eq", callLine4_arg3);

        // call with multiple arguments and clone
        const callLine5_arg1 = { l: "string", n: 999, b: true, a: [9, 8, [1, 2]] };
        const callLine5_arg2 = [9, 8, 7, { ea: ["y", 0, false, null] }];

        wrap(() => lineCalledWithClone(callLine5_arg1, callLine5_arg2));

        cy.callLineNext().should("deep.eq", [callLine5_arg1, callLine5_arg2]);
        cy.callLineCurrent().should("deep.eq", [callLine5_arg1, callLine5_arg2]);
        cy.callLine()
            .then((callLine) => (callLine.current as unknown[])[0])
            .should("not.eq", callLine5_arg1);
        cy.callLine()
            .then((callLine) => (callLine.current as unknown[])[1])
            .should("not.eq", callLine5_arg2);

        const callLine6 = "simple string";

        wrap(() => lineCalledWithClone(callLine6));

        cy.callLineNext().should("eq", callLine6);

        cy.callLineClean();

        const callLine7 = "111";

        cy.wrap(null).then(() => {
            setTimeout(() => {
                lineCalled(callLine7);
            }, 2000);
        });

        // now it should wait for the next call
        cy.callLineNext().should("eq", callLine7);
    });

    it("cy.callLine in the context of Cypress window", () => {
        cy.on("uncaught:exception", () => {
            return false;
        });

        cy.visit("/public/index.html");

        cy.window().then((_win) => {
            const win = _win as unknown as Window & {
                testUnit: { lineCalled: (...args: unknown[]) => void };
            };

            context("With disabled call line", () => {
                const callLine = "call-line";

                wrap(() => win.testUnit.lineCalled(callLine));

                cy.callLineNext().should("be.undefined");
            });

            wrap(() => enableCallLine(win));

            context("With enabled call line", () => {
                const callLine1 = "call-line-1";
                const callLine2 = "call-line-2";

                wrap(() => win.testUnit.lineCalled(callLine1));

                cy.callLineNext().should("eq", callLine1);
                cy.callLineNext().should("be.undefined");

                wrap(() => lineCalled(callLine2));

                cy.callLineNext().should("eq", callLine2);
                cy.callLineNext().should("be.undefined");

                cy.callLineReset();

                cy.callLineNext().should("eq", callLine1);
                cy.callLineNext().should("eq", callLine2);
                cy.callLineNext().should("be.undefined");

                cy.callLineClean();

                cy.callLineNext().should("be.undefined");
            });

            wrap(() => disableCallLine(win));

            context("With disabled call line", () => {
                const callLine = "call-line";

                wrap(() => win.testUnit.lineCalled(callLine));

                cy.callLineNext().should("be.undefined");
            });
        });
    });

    it("cy.callLineToFile in context of the global window", () => {
        const outputFileName = createOutputFileName(outputDir);

        const callLine1 = "123";
        const callLine2 = "456";

        wrap(() => lineCalled(callLine1));
        wrap(() => lineCalled(callLine2));

        cy.callLineToFile(outputDir).then(() => {
            cy.readFile<CallLineStack[]>(outputFileName).then((file) => {
                expect(file.map((entry) => entry.args)).to.deep.equal([[callLine1], [callLine2]]);
            });
        });
    });

    it("cy.callLineToFile with filtered data", () => {
        const outputFileName = createOutputFileName(outputDir);

        const callLine1 = ["abc", { o: false, n: { p: 1 } }];
        const callLine2 = "def";

        wrap(() => lineCalled(...callLine1));
        wrap(() => lineCalled(callLine2));

        cy.callLine().then((callLine) => {
            expect(callLine.array.map((entry) => entry.args)).to.deep.equal([
                [...callLine1],
                [callLine2]
            ]);
        });

        cy.callLineToFile(outputDir, {
            filter: (dataPoint) => dataPoint.args.includes(callLine1[0]),
            prettyOutput: true
        }).then(() => {
            cy.readFile<CallLineStack[]>(outputFileName).then((file) => {
                expect(file.map((entry) => entry.args)).to.deep.equal([[...callLine1]]);
            });
        });
    });

    it("cy.callLineToFile it should not create file if there is no data", () => {
        const outputFileName = createOutputFileName(outputDir);

        cy.callLineToFile(outputDir).then(() => {
            cy.task("doesFileExist", outputFileName).should("be.false");
        });
    });
});
