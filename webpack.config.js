'use strict';

const path = require('path');

module.exports = {
	entry: './src/main.js',
	output: {
		filename: 'vrIME.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'vrIME',
		libraryTarget: 'window'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
		        use: {
		        	loader: 'babel-loader',
		        	options: {
						presets: ['env'],
						plugins: [
							'transform-es2015-block-scoping',
							'transform-es2015-template-literals',
							'syntax-object-rest-spread',
							'transform-object-rest-spread'
						]
					}
				}
			}
		]
	}
};
