// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// This configures webpack, which handles JS module bundling, CSS and HTML
// minification, and generally transforming the source tree into the desired
// arrangement of files under out/webpkg for static hosting.

const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const path = require('path');

module.exports = env => { return {
  entry: './js/bootstrap.js',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ MiniCssExtractPlugin.loader, 'css-loader' ]
      },
      {
        // Put font files outside the assetDir; they aren't going to change from
        // version to version so let's not blow them out of the browser cache
        // with every deploy.
        test: /\.woff2$/,
        type: 'asset/resource',
        generator: { filename: '../fonts/[base]' }
      }
    ]
  },
  optimization: {
    minimizer: [ `...`, new CssMinimizerPlugin() ],

    // We use dynamic import when we want a late-loaded chunk.  Tell webpack
    // not to also make a separate chunk for the node_modules deps of our late
    // modules.  (May need to revisit if we want diamond dependencies.)
    splitChunks: { chunks: chunk => false }
  },
  output: {
    // All the output paths are relative to out/webpkg/v.a.NNNN/
    // Note env.assetDir is passed in by build.sh from VERSION file.
    path: path.resolve(__dirname,
                       `../out/webpkg/${env.assetDir}`)
  },
  plugins: [
    new HtmlWebpackPlugin({
      // This ends up in the <title> tag.
      title: 'DecoTax',

      // Generate main.html from main-template.html.
      filename: '../main.html',
      template: 'main-template.html',

      // Minify even in dev mode (whitespace is semantically meaningful).
      minify: true,

      // Need this when the template writes headTags explicitly.
      inject: false,

      // Writes a <base href> so all public paths are relative to assetDir.
      base: `${env.assetDir}/`,
      publicPath: '',
    }),
    new MiniCssExtractPlugin()
  ]
}};
