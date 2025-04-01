const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const path = require('path')
const nodeEnv = process.env.NODE_ENV
const isProduction = nodeEnv !== 'development'
// Common plugins
const plugins = [
  new CleanWebpackPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  })
  // new webpack.NamedModulesPlugin()
]

const config = {
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  externals: [],
  plugins: plugins,
  target: 'node',
  entry: path.resolve(path.join(__dirname, './main.js')),
  output: {
    publicPath: './',
    path: path.resolve(__dirname, '../note-node/android/src/main/assets/nodejs-project/'),
    filename: 'main.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
    modules: [
      path.resolve(__dirname, 'node_modules')
    ]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-object-rest-spread']
        },
        exclude: /node_modules/
      },
      {
        enforce: 'pre',
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      },
      {
        test: /\.md$/i,
        use: 'raw-loader'
      }
    ]
  },
  node: {
    // console: false,
    // global: false,
    // process: false,
    // Buffer: false,
    __filename: false,
    __dirname: false
  }
}

if (isProduction) {
  config.optimization = {
    minimize: true,
    minimizer: [new TerserPlugin({
      extractComments: 'all',
      terserOptions: {
        compress: {
          drop_console: true,
          keep_classnames: /AbortSignal/,
          keep_fnames: /AbortSignal/
        }
      }
    })]
  }
} else {
}

module.exports = config
