var Promise = require('promise');
var https = require('https');
var weatherDb = require('../model/weather');
var R = require('ramda');

var apiHost = "api.wunderground.com";


function getRequest(path) {
    return new Promise(function(resolve, reject){
        var url = 'https://' + apiHost + '/' + path;
        https.get(url, function(response) {
            var body = '';
            response.on('data', function(chunk) {
                body += chunk;
            });
            response.on('end', function() {
                var json;
                try {
                    json = JSON.parse(body);
                    resolve(json);
                }
                catch(e) {
                    reject(e);
                }
            });
            response.on('error', function(e) {
                reject(e);
            });
        });
    });
}

function updateLocation(config, location) {
    return Promise.all([
        getRequest(['api', config.apiKey, 'conditions/q',location.api_url].join('/')),
        getRequest(['api', config.apiKey, 'forecast10day/q',location.api_url].join('/')),
        getRequest(['api', config.apiKey, 'hourly/q',location.api_url].join('/'))
    ]).then(function(data) {
        var now = (new Date().getTime() / 1000);
        return Promise.all([
            weatherDb.setNow(location.tableId, now, JSON.stringify(data[0])),
            weatherDb.setForecast(location.tableId, now, now, 10, JSON.stringify(data[1])),
            weatherDb.setHourly(location.tableId, now, now, JSON.stringify(data[2]))
        ]);
    }, function(err) {
        console.log("Error updating weather locatin:" + e);
    });
}
function updateLocations(config, locations) {
    if(locations.tableId) {
        locations = [locations];
    }
    if(!locations.length) {
        return Promise.resolve();
    }
    // recursively hit each location sequentially
    return updateLocation(config, R.head(locations))
        .then(updateLocations.bind(null, config, R.tail(locations)))
}

function update(config) {
    return weatherDb.getLocations()
        .then(function(locations){
            return updateLocations(config, locations);
        });
}

module.exports = {update: update}