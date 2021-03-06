var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, './public/js');
var APP_DIR = path.resolve(__dirname, './resources/js');
var SASS_DIR = path.resolve(__dirname, './resources/sass');

module.exports = {
    entry: APP_DIR + "/app.js",
    output: {
        path: BUILD_DIR,
        filename: "app.js"
    },
    module: {
        loaders: [
            { 
                test: /\.css$/, 
                loader: "style!css" },
            {
                test : /\.jsx?/,
                include : APP_DIR,
                loader : 'babel'
            }
            ,{
                test: /\.scss$/,
                include: SASS_DIR,
                loaders: ["style", "css", "sass"]
            }
        ]
    }
};