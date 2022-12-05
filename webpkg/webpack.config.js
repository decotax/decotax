const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './bootstrap.js',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'DecoTax',
      filename: 'main.html',
      template: 'main-template.html'
    })
  ]
};
