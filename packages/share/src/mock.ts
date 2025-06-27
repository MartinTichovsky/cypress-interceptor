interface MockRequire {
    basename?: string;
    dirname?: string;
    existsSync?: boolean;
    join?: (...args: string[]) => string;
    mkdirSync?: (...args: string[]) => void;
    readFileSync?: string;
    readdirSync?: string[];
    resolve?: (...args: string[]) => string;
    writeFileSync?: (...args: string[]) => void;
}

const emptyFunction = () => {
    //
};

export const mockNodeEnvironment = () => {
    const win = window as Window & {
        process?: { versions?: { node?: string } };
    };

    win.process = {
        versions: {
            node: "12.18.3"
        }
    };
};

export const mockRequire = ({
    basename = "mockfile",
    dirname = "/mock/dir",
    existsSync = true,
    join = (...args: string[]) => args.join("/"),
    mkdirSync = emptyFunction,
    readFileSync = "",
    readdirSync = [],
    resolve = (...args: string[]) => args.join("/"),
    writeFileSync = emptyFunction
}: MockRequire) => {
    const win = window as Window & {
        Cypress?: Cypress.Cypress;
        cy?: Cypress.cy;
        require?: (module: string) => unknown;
    };

    const mockFs = {
        existsSync: cy.stub().returns(existsSync),
        mkdirSync: cy.stub().callsFake(mkdirSync),
        readFileSync: cy.stub().returns(readFileSync),
        readdirSync: cy.stub().returns(readdirSync),
        writeFileSync: cy.stub().callsFake(writeFileSync)
    };

    const mockPath = {
        basename: cy.stub().returns(basename),
        dirname: cy.stub().returns(dirname),
        join: cy.stub().callsFake(join),
        resolve: cy.stub().callsFake(resolve)
    };

    win.require = (module: string) => {
        if (module === "fs") {
            return mockFs;
        }

        if (module === "path") {
            return mockPath;
        }
    };

    return { mockFs, mockPath, win };
};
