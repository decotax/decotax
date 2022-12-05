const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
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
  plugins: [
    new HtmlWebpackPlugin({
      title: 'DecoTax',
      filename: 'main.html',
      template: 'main-template.html'
    }),
    new MiniCssExtractPlugin()
  ]
};
