var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: "./js/app.js",
  output: {
    path: "dist",
    filename: "bundle.js",
    hash: true
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
            presets: ['react', 'es2015']
        }
      },

      {
        test: /\.css$/,
        loader: 'style-loader!css-loader!stylus-loader'
      },

      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin({
        template: 'index.html'
    })
  ],
  devServer: {
    // public: 'something-other-than-localhost-3000',
    // OR use IFRAME mode (<public-url>/webpack-dev-server/index.html)
    hot: true,
    port: 3000
  }
};
