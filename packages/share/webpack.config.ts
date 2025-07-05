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
                          exclude: (filepath: string) => {
                              filepath = filepath.replace(/\\/g, "/");

                              if (
                                  filepath.includes("node_modules") ||
                                  /\.cy\.[tj]sx?$/.test(filepath) ||
                                  /\.spec\.[tj]sx?$/.test(filepath)
                              ) {
                                  return true;
                              }

                              // only include cypress-interceptor source code
                              return !filepath.includes("/packages/interceptor/");
                          },
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
