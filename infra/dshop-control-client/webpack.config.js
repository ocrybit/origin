require('dotenv').config()

const path = require('path')
const webpack = require('webpack')
const SriPlugin = require('webpack-subresource-integrity')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'

let devtool = 'cheap-module-source-map'
if (isProduction) {
  devtool = false
}

const API_URL =
  process.env.API_URL || isProduction
    ? 'https://origin-dshop-control-server.herokuapp.com'
    : 'http://localhost:9011'
const IPFS_API_URL =
  process.env.IPFS_API_URL || isProduction
    ? 'https://ipfs.ogn.app'
    : 'http://localhost:5001'
const IPFS_GATEWAY_URL =
  process.env.IPFS_GATEWAY_URL || isProduction
    ? 'https://ipfs.ogn.app'
    : 'http://localhost:8080'

const webpackConfig = {
  entry: {
    app: './src/index.js'
  },
  devtool,
  output: {
    filename: '[name].js',
    chunkFilename: 'dist/[name].[hash:8].bundle.js',
    path: path.resolve(__dirname, 'public'),
    crossOriginLoading: 'anonymous'
  },
  externals: {
    Web3: 'web3'
  },
  module: {
    noParse: [/^react$/],
    rules: [
      { test: /\.flow$/, loader: 'ignore-loader' },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: isProduction ? MiniCssExtractPlugin.loader : 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              url: url => {
                return url.match(/(svg|png)/) ? false : true
              }
            }
          }
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: isProduction ? 'file-loader' : 'url-loader',
            options: isProduction ? { name: 'fonts/[name].[ext]' } : {}
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json'],
    modules: [path.resolve(__dirname, 'src/constants'), './node_modules'],
    symlinks: false
  },
  node: {
    fs: 'empty'
  },
  devServer: {
    port: process.env.PORT || 9001,
    host: '0.0.0.0',
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    contentBase: [path.join(__dirname, 'public'), path.join(__dirname, 'data')]
  },
  watchOptions: {
    poll: 2000
  },
  mode: isProduction ? 'production' : 'development',
  plugins: [
    new SriPlugin({
      hashFuncNames: ['sha256', 'sha384'],
      enabled: isProduction
    }),
    new HtmlWebpackPlugin({
      template: 'public/template.html',
      inject: false,
      network: process.env.NETWORK || 'localhost',
      metaMask: true
    }),
    new HtmlWebpackPlugin({
      template: 'public/template.html',
      inject: false,
      filename: 'localhost.html',
      network: 'localhost',
      metaMask: true
    }),
    new webpack.EnvironmentPlugin({
      WEBPACK_BUILD: true,
      NODE_ENV: process.env.NODE_ENV || 'development',
      API_URL,
      IPFS_API_URL,
      IPFS_GATEWAY_URL
    })
  ],

  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
}

if (isProduction) {
  webpackConfig.output.filename = '[name].[hash:8].js'
  webpackConfig.optimization.minimizer = [
    new TerserPlugin({ extractComments: false }),
    new OptimizeCSSAssetsPlugin({})
  ]
  webpackConfig.plugins.push(
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        'app.*.css',
        'app.*.js',
        'app.*.js.map',
        'vendors*',
        'dist/*.bundle.js'
      ]
    }),
    new MiniCssExtractPlugin({ filename: '[name].[hash:8].css' })
  )
  webpackConfig.resolve.alias = {
    'react-styl': 'react-styl/prod.js'
  }
  webpackConfig.module.noParse = [/^(react-styl)$/]
}

module.exports = webpackConfig
