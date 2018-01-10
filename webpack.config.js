
// webpack.config.js

const CleanWebpackPlugin = require('clean-webpack-plugin');
const env = require('yargs').argv.env;
const path = require('path');
const webpack = require('webpack');

const LIBRARY_NAME = 'aims-chart';
const OUTPUT_DIRECTORY = 'build';

let plugins = [

  // Clean the build directory first.
  new CleanWebpackPlugin([OUTPUT_DIRECTORY]),

];

// Add an IgnorePlugin for each defined dependency.
Object.keys(require('./package.json').dependencies)
  .forEach(lib => {
    plugins.push(new webpack.IgnorePlugin(new RegExp(`\\b${lib}\\b`)));
  });

let outputFile;
if (env === 'build') {
  plugins.push(new UglifyJsPlugin({ minimize: true }));
  outputFile = LIBRARY_NAME+ '.min.js';
} else {
  outputFile = LIBRARY_NAME + '.js';
}

const config = {
  entry: __dirname + '/index.js',
  devtool: 'source-map',
  output: {
    path: `${__dirname}/${OUTPUT_DIRECTORY}`,
    filename: outputFile,
    library: LIBRARY_NAME,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./lib')],
    extensions: ['.json', '.js']
  },
  plugins: plugins
};

module.exports = config;