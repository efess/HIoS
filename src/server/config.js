var fs = require('fs');
var Promise = require('promise');
var extend = require('extend');

var localConfig = 'local_config.json';

var config = {
	load: function(){
        return new Promise(function(resolve, reject) {
            fs.readFile(localConfig, 'utf8', function (err, data) {
                if (err) {
                    console.log('Coudln\'t load local config file: '  + err);
                    reject(err);
                } else{
                    var cfgObj = JSON.parse(data);
                    extend(config, cfgObj);  
                    
                    resolve(config);   
                }    
            });
        });
	},
    // defaults
    store: {
        type: 'mysql',
        params: {
            user: 'foo',
            password: 'bar',
            database: 'hios',
            host: 'localhost'
        }
    },
    publicDir: 'public/',
    listenPort: 8080
}

module.exports = config;