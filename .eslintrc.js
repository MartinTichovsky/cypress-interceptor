module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true
    },
    extends: ["eslint:recommended", "plugin:prettier/recommended", "prettier"],
    overrides: [
        {
            files: ["**/*.js"],
            parser: "@babel/eslint-parser"
        },
        {
            files: ["**/*.ts"],
            extends: [
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking"
            ],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                project: ["./tsconfig.json"],
                sourceType: "module",
                tsconfigRootDir: process.cwd()
            },
            plugins: ["@typescript-eslint"],
            rules: {
                "@typescript-eslint/ban-types": "warn",
                "@typescript-eslint/consistent-type-assertions": "warn",
                "@typescript-eslint/indent": "off",
                "@typescript-eslint/member-delimiter-style": [
                    "warn",
                    {
                        multiline: {
                            delimiter: "semi",
                            requireLast: true
                        },
                        singleline: {
                            delimiter: "semi",
                            requireLast: false
                        }
                    }
                ],
                "@typescript-eslint/naming-convention": "off",
                "@typescript-eslint/no-empty-function": "warn",
                "@typescript-eslint/no-for-in-array": "off",
                // eslint is failing with this rule
                "@typescript-eslint/no-misused-promises": "off",
                "@typescript-eslint/no-namespace": "off",
                "@typescript-eslint/no-unsafe-argument": "off",
                "@typescript-eslint/no-unsafe-assignment": "off",
                "@typescript-eslint/no-unsafe-member-access": "off",
                "@typescript-eslint/no-unsafe-return": "off",
                "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
                "@typescript-eslint/no-non-null-assertion": "off",
                "@typescript-eslint/no-var-requires": "off",
                "@typescript-eslint/prefer-namespace-keyword": "warn",
                "@typescript-eslint/quotes": [
                    "warn",
                    "double",
                    {
                        avoidEscape: true
                    }
                ],
                "@typescript-eslint/semi": ["warn", "always"],
                "@typescript-eslint/type-annotation-spacing": "warn"
            }
        }
    ],
    parser: "@babel/eslint-parser",
    parserOptions: {
        requireConfigFile: false
    },
    plugins: ["prettier", "simple-import-sort"],
    root: true,
    rules: {
        "brace-style": "off",
        curly: "warn",
        "eol-last": "warn",
        eqeqeq: ["warn", "smart"],
        "id-denylist": [
            "warn",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            // 'Undefined',
            "undefined"
        ],
        indent: "off",
        "no-multiple-empty-lines": [
            "warn",
            {
                max: 1
            }
        ],
        "no-unused-vars": "off",
        "prettier/prettier": "warn",
        quotes: ["warn", "double"],
        "simple-import-sort/imports": "warn",
        "simple-import-sort/exports": "warn",
        "spaced-comment": [
            "warn",
            "always",
            {
                markers: ["/"]
            }
        ]
    }
};
