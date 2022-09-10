const path = require("path");
const fs = require("fs");
const Dotenv = require("dotenv-webpack")

// const HtmlWebpackPlugin = require("html-webpack-plugin");
// const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (env) => {
  return {
    entry: path.resolve(__dirname, "src/main.ts"), //path to the main .ts file

    output: {
      filename: "out.js", // name for the js file that is created/compiled in memory
      path: path.resolve(__dirname, 'public/dist'),
    },

    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },

    mode: "development",

    devServer: {
      static: path.join(__dirname, 'public'),
      compress: true,
      port: 3000,

      // SPA
      historyApiFallback: true
    },

    watchOptions: {
      aggregateTimeout: 200,
      poll: 1000,
      ignored: ['**/public', '**/css', '**/node_modules'],
    },

    module: {
      rules: [
        {
          test: /\.css?$/,
          use: "css-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.ts?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },

    plugins: [
      new Dotenv()
      // new HtmlWebpackPlugin({
      //   inject: true,
      //   template: path.resolve(appDirectory, "index.html"),
      // }),
      // new CleanWebpackPlugin(),
    ],
  }
};