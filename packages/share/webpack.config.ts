import { Configuration, RuleSetRule } from "webpack";

export const createWebpackConfig = (codeCoverage = false): Configuration => ({
    devtool: "inline-source-map",
    mode: "development",
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.ts/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            ["@babel/preset-env", { targets: { node: "current" } }],
                            "@babel/preset-typescript"
                        ],
                        sourceMaps: "inline",
                        retainLines: false
                    }
                }
            },
            ...(codeCoverage
                ? ([
                      {
                          test: /\.ts/,
                          enforce: "post",
                          exclude: [
                              /node_modules/,
                              /\.cy\.[tj]sx?$/,
                              /\.spec\.[tj]sx?$/,
                              /server(\\|\/)/,
                              /share(\\|\/)/
                          ],
                          use: {
                              loader: "@jsdevtools/coverage-istanbul-loader"
                          }
                      }
                  ] as RuleSetRule[])
                : [])
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    }
});
