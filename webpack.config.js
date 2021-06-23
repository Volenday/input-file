const webpack = require('webpack');

module.exports = {
	mode: 'production',
	context: __dirname,
	devtool: false,
	entry: {
		index: ['core-js/stable', 'regenerator-runtime/runtime', './src/index.js']
	},
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				query: {
					presets: ['@babel/react', '@babel/env'],
					plugins: [
						'react-html-attrs',
						['@babel/proposal-decorators', { legacy: true }],
						'@babel/proposal-class-properties',
						'@babel/plugin-proposal-export-default-from',
						'@babel/plugin-syntax-dynamic-import'
					]
				}
			},
			{
				test: /\.(css|scss)$/,
				use: ['style-loader', 'css-loader', 'sass-loader']
			},
			{
				test: /\.(ttf|eot|woff|woff2)$/,
				loader: 'file-loader',
				options: {
					name: 'fonts/[name].[ext]'
				}
			},
			{
				test: /\.(jpg|png|svg|gif)$/,
				use: {
					loader: 'file-loader',
					options: {
						name: 'images/[name].[hash].[ext]'
					}
				}
			}
		]
	},
	output: {
		path: `${__dirname}/dist/`,
		filename: '[name].min.js',
		chunkFilename: '[name].[chunkhash].chunk.min.js',
		libraryTarget: 'commonjs2'
	},
	externals: {
		'@volenday/generate-thumbnail': '@volenday/generate-thumbnail',
		'@ant-design/icons': '@ant-design/icons',
		antd: 'antd',
		lodash: 'lodash',
		mime: 'mime',
		react: 'react',
		'react-cropper': 'react-cropper',
		'react-dom': 'react-dom'
	},
	plugins: [
		new webpack.optimize.AggressiveMergingPlugin(),
		new webpack.optimize.OccurrenceOrderPlugin(),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production')
			}
		})
	]
};
