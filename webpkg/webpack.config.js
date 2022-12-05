const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const path = require('path');

module.exports = env => { return {
  entry: './bootstrap.js',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ MiniCssExtractPlugin.loader, 'css-loader' ]
      }
    ]
  },
  optimization: {
    minimizer: [ `...`, new CssMinimizerPlugin() ]
  },
  output: {
    path: path.resolve(__dirname,
                       `../out/webpkg/${env.assetDir}`)
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'DecoTax',
      filename: '../main.html',
      template: 'main-template.html',
      base: `${env.assetDir}/`,
      publicPath: ''
    }),
    new MiniCssExtractPlugin()
  ]
}};
