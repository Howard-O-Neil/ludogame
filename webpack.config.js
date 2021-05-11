const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
  entry: path.resolve(appDirectory, "src/main.ts"), //path to the main .ts file
  output: {
    filename: "bundleName.js", //name for the js file that is created/compiled in memory
    path: path.resolve(appDirectory, 'public/dist'),
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  // devServer: {
  //   host: "0.0.0.0",
  //   port: 8082, //port that we're using for local host (localhost:8080)
  //   contentBase: path.resolve(appDirectory, "public"), // tells webpack to serve from this
  //   publicPath: "/",
  //   hot: true,
    
  // },
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
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     inject: true,
  //     template: path.resolve(appDirectory, "index.html"),
  //   }),
  //   new CleanWebpackPlugin(),
  // ],
  mode: "development",
};