var fs = require('fs');
var Promise = require('promise');
var extend = require('extend');

var localConfig = 'local_config.json';

function _applyEnvVar(obj, prop, env) {
    if(env) {
        obj[prop] = env;
    }
}

function applyEnvVars() {
    _applyEnvVar(config.store.params, 'host', process.env.STORE_HOST);
    _applyEnvVar(config.store.params, 'user', process.env.STORE_USER);
    _applyEnvVar(config.store.params, 'database', process.env.STORE_DB);
    _applyEnvVar(config.store.params, 'password', process.env.STORE_PASS);
    _applyEnvVar(config.redis, 'host', process.env.REDIS_HOST);
}

var config = {
	load: function(){
        return new Promise(function(resolve, reject) {
            fs.readFile(localConfig, 'utf8', function (err, data) {
                if (err) {
                    console.log('Coudln\'t load local config file: '  + err);
                    reject(err);
                } else {
                    var cfgObj = JSON.parse(data);
                    extend(config, cfgObj);  
                    
                    applyEnvVars(config);

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
    redis: {
        host: 'localhost'
    },
    publicDir: 'public/',
    listenPort: 8080
}

applyEnvVars();

module.exports = config;