export const createWebpackConfig = (codeCoverage = false) => ({
    devtool: "source-map",
    mode: "development",
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.ts/,
                use: [
                    ...(codeCoverage ? ["@jsdevtools/coverage-istanbul-loader"] : []),
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env", "@babel/preset-typescript"]
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    }
});
